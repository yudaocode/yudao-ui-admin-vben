<script lang="ts" setup>
import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import {
  computed,
  defineAsyncComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  useRoute,
  useRouter,
} from 'vue-router';

import { Page, prompt } from '@vben/common-ui';
import { AiDramaStepEnum, DICT_TYPE } from '@vben/constants';
import { useTabs } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { parseId } from '@vben/utils';

import { Button, Input, message, Spin, Steps, Tag } from 'antdv-next';

import {
  createDramaProject,
  getDramaProjectDetailMy,
} from '#/api/ai/drama/project';
import { DictTag } from '#/components/dict-tag';
import { getDramaStep, hasDramaRunning } from '#/views/ai/utils/drama';

import AssetStep from './modules/asset-step.vue';
import IdeaStep from './modules/idea-step.vue';
import ScriptStep from './modules/script-step.vue';
import StoryboardStep from './modules/storyboard-step.vue';

/** AI 短剧：项目表单，新建、查看、编辑共用；按 想法 → 剧本 → 资产 → 分镜与成片 分步；步骤只在前端，进入时按项目进度推断 */
defineOptions({ name: 'AiDramaProject' });

// 画布：点击「画布」时再加载
const DramaCanvas = defineAsyncComponent(() => import('../canvas/index.vue'));

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const isCreate = route.name === 'AiDramaProjectCreate'; // 是否新建
const projectId = parseId(route.params.id); // 项目编号

const STEPS = [
  { title: '故事想法', value: AiDramaStepEnum.IDEA },
  { title: '剧本审阅', value: AiDramaStepEnum.SCRIPT },
  { title: '资产配置', value: AiDramaStepEnum.ASSET },
  { title: '分镜与成片', value: AiDramaStepEnum.STORYBOARD },
];
const POLL_INTERVAL = 5000; // 生成中的轮询间隔（毫秒）

const loading = ref(false);
const detail = ref<AiDramaProjectApi.ProjectDetail>();
const step = ref<number>(AiDramaStepEnum.IDEA);
const stepIndex = computed(() =>
  STEPS.findIndex((item) => item.value === step.value),
);
const running = computed(() => hasDramaRunning(detail.value));

/** 加载项目详情：首次加载时按项目的进度推断步骤 */
async function loadDetail() {
  loading.value = true;
  try {
    const data = await getDramaProjectDetailMy(projectId!);
    if (!detail.value) {
      step.value = getDramaStep(data);
    }
    detail.value = data;
  } finally {
    loading.value = false;
  }
}

/** 切换步骤：只在前端切换，并刷新详情 */
async function goStep(value: number) {
  step.value = value;
  await loadDetail();
}

/** 点击步骤条 */
function handleStepChange(index: number) {
  if (STEPS[index]!.value === step.value) {
    return;
  }
  if (isCreate) {
    message.warning('请先保存故事想法');
    return;
  }
  goStep(STEPS[index]!.value);
}

/**
 * 切换画布、分步：离开画布前由画布处理未保存的修改（开启自动保存时先保存，否则确认）；
 * canvas=1 时直接打开画布（从空白画布新建的入口，刷新后保持）
 */
const canvasVisible = ref(route.query.canvas === '1');
const canvasRef = ref<{ confirmLeave: () => Promise<boolean> }>();
/** 能否离开画布：未打开画布时直接离开；确认进行中时（例如连续点击标签页）复用同一次确认，不重复弹出 */
let leaving: Promise<boolean> | undefined;
function confirmLeaveCanvas(): Promise<boolean> {
  if (!canvasVisible.value || !canvasRef.value) {
    return Promise.resolve(true);
  }
  if (!leaving) {
    leaving = canvasRef.value.confirmLeave().finally(() => {
      leaving = undefined;
    });
  }
  return leaving;
}
async function handleCanvasToggle() {
  if (!(await confirmLeaveCanvas())) {
    return;
  }
  canvasVisible.value = !canvasVisible.value;
  if (!canvasVisible.value) {
    if (route.query.canvas) {
      await router.replace({ query: { ...route.query, canvas: undefined } });
    }
    await loadDetail();
  }
}

/** 返回项目列表 */
let leaveConfirmed = false; // 已在「返回」时确认离开画布，路由守卫不再重复确认
async function close() {
  if (!(await confirmLeaveCanvas())) {
    return;
  }
  leaveConfirmed = true;
  try {
    await tabs.closeCurrentTab();
    await router.push({ name: 'AiDrama' });
  } finally {
    // 跳转被取消、失败时不残留：之后的离开仍需确认
    leaveConfirmed = false;
  }
}

/** 应用内跳转到其它页面前：画布有未保存的修改时，开启自动保存先保存，否则确认 */
onBeforeRouteLeave(async () => {
  if (leaveConfirmed) {
    return true;
  }
  return await confirmLeaveCanvas();
});

/**
 * 同一路由切到其它项目（例如点击另一个项目的标签页）、去掉 canvas 参数、后退等：页面按完整地址重建，同样离开了画布，需要确认。
 * 「返回分步」自身的 replace 在关闭画布后进行，此时不再确认
 */
onBeforeRouteUpdate(async (to, from) => {
  if (to.fullPath === from.fullPath) {
    return true;
  }
  return await confirmLeaveCanvas();
});

/** 从空白画布开始：只填写名称，创建草稿项目（不调用模型），进入该项目的画布；取消时不创建 */
async function handleCreateCanvas() {
  let name: string;
  try {
    const value = await prompt<string>({
      title: '新建画布项目',
      content: '输入项目名称，创建后进入空白画布',
      component: Input,
      componentProps: { placeholder: '项目名称', maxlength: 64 },
      modelPropName: 'value',
      defaultValue: '',
      confirmText: '创建',
      cancelText: '取消',
      beforeClose: ({ isConfirm, value }) => {
        if (!isConfirm) {
          return true;
        }
        if (!value?.trim()) {
          message.warning('项目名称不能为空');
          return false;
        }
        if (value.trim().length > 64) {
          message.warning('项目名称不能超过 64 个字符');
          return false;
        }
        return true;
      },
    });
    name = (value ?? '').trim();
  } catch {
    return;
  }
  const id = await createDramaProject({ name });
  await tabs.closeCurrentTab();
  await router.push({
    name: 'AiDramaProject',
    params: { id },
    query: { canvas: '1' },
  });
}

/** 新建完成：关闭新建页，进入该项目；进入后按项目进度推断步骤 */
async function handleCreated(id: number) {
  await tabs.closeCurrentTab();
  await router.push({ name: 'AiDramaProject', params: { id } });
}

// 生成中时轮询；静默刷新，不显示加载中
let timer: ReturnType<typeof setInterval> | undefined;
function stopPolling() {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}
watch(running, (value) => {
  stopPolling();
  if (value) {
    timer = setInterval(async () => {
      detail.value = await getDramaProjectDetailMy(projectId!);
    }, POLL_INTERVAL);
  }
});

/** 初始化 */
onMounted(() => {
  if (isCreate) {
    return;
  }
  if (!projectId) {
    message.warning('参数错误，项目不能为空！');
    close();
    return;
  }
  loadDetail();
});
onBeforeUnmount(() => {
  stopPolling();
});
</script>

<template>
  <Page>
    <div class="bg-card mb-4 rounded-lg p-4">
      <div class="flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <Button type="link" @click="close">
            <IconifyIcon icon="lucide:arrow-left" class="mr-1" /> 返回
          </Button>
          <span class="truncate text-base font-semibold">
            {{ isCreate ? '新建短剧' : detail?.project.name || '加载中' }}
          </span>
          <template v-if="detail">
            <Tag>{{ detail.project.composeAspectRatio }}</Tag>
            <DictTag
              :type="DICT_TYPE.AI_DRAMA_PROJECT_STATUS"
              :value="detail.project.status"
            />
          </template>
          <span v-if="running" class="text-muted-foreground text-xs">
            生成中，自动刷新
          </span>
        </div>
        <div v-if="!isCreate" class="flex items-center gap-2">
          <Button
            :type="canvasVisible ? 'primary' : 'default'"
            ghost
            @click="handleCanvasToggle"
          >
            <IconifyIcon icon="lucide:share-2" class="mr-1" />
            {{ canvasVisible ? '返回分步' : '画布' }}
          </Button>
          <Button :loading="loading" @click="loadDetail">
            <IconifyIcon icon="lucide:refresh-cw" class="mr-1" /> 刷新
          </Button>
        </div>
        <Button v-else @click="handleCreateCanvas">
          <IconifyIcon icon="lucide:share-2" class="mr-1" /> 从空白画布开始
        </Button>
      </div>
      <Steps
        v-if="!canvasVisible"
        :current="stepIndex"
        :items="STEPS.map((item) => ({ title: item.title }))"
        type="navigation"
        size="small"
        class="mt-3"
        @change="handleStepChange"
      />
    </div>

    <Spin :spinning="loading && !detail">
      <!-- 新建：只有第 1 步，保存后进入该项目 -->
      <IdeaStep v-if="isCreate" @created="handleCreated" />
      <DramaCanvas
        v-else-if="detail && canvasVisible"
        ref="canvasRef"
        :detail="detail"
        @refresh="loadDetail"
      />
      <template v-else-if="detail">
        <IdeaStep
          v-if="step === AiDramaStepEnum.IDEA"
          :detail="detail"
          @refresh="loadDetail"
          @next="goStep"
        />
        <ScriptStep
          v-else-if="step === AiDramaStepEnum.SCRIPT"
          :detail="detail"
          @refresh="loadDetail"
          @next="goStep"
        />
        <AssetStep
          v-else-if="step === AiDramaStepEnum.ASSET"
          :detail="detail"
          @refresh="loadDetail"
          @next="goStep"
        />
        <StoryboardStep v-else :detail="detail" @refresh="loadDetail" />
      </template>
    </Spin>
  </Page>
</template>
