<script lang="ts" setup>
import type { AiDramaProjectApi } from '#/api/ai/drama/project';
import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';
import type { AiModelModelApi } from '#/api/ai/model/model';

import { computed, onMounted, ref, watch } from 'vue';

import { confirm } from '@vben/common-ui';
import {
  AiDramaAudioTypeEnum,
  AiDramaProjectStatusEnum,
  AiModelTypeEnum,
  AiPlatformEnum,
  AiVideoTypeEnum,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Form,
  FormItem,
  message,
  Popover,
  Row,
  Select,
  Table,
} from 'antdv-next';

import { deleteDramaAudio, deleteDramaMotionReference } from '#/api/ai/drama/asset';
import {
  generateDramaActingNotes,
  generateDramaPhotographyRules,
  planDramaFrameList,
} from '#/api/ai/drama/script';
import { generateDramaStoryboardVideoBatch } from '#/api/ai/drama/storyboard';
import { getModelSimpleList } from '#/api/ai/model/model';
import {
  getVideoModelCapability,
  isVideoModelOfType,
} from '#/views/ai/utils/video';

import AudioForm from './asset/audio-form.vue';
import ComposeBar from './storyboard/compose-bar.vue';
import FrameBatchForm from './storyboard/frame-batch-form.vue';
import MotionReferenceForm from './storyboard/motion-reference-form.vue';
import MusicDialog from './storyboard/music-dialog.vue';
import PlanReviewDialog from './storyboard/plan-review-dialog.vue';
import ShotEditor from './storyboard/shot-editor.vue';
import ShotNavigator from './storyboard/shot-navigator.vue';
import StoryboardForm from './storyboard/storyboard-form.vue';

/** AI 短剧：分镜与成片 */
defineOptions({ name: 'AiDramaStoryboardStep' });

const props = defineProps<{ detail: AiDramaProjectApi.ProjectDetail }>();
const emit = defineEmits<{ refresh: [] }>();

const formRef = ref<InstanceType<typeof StoryboardForm>>();
const audioFormRef = ref<InstanceType<typeof AudioForm>>();
const planReviewRef = ref<InstanceType<typeof PlanReviewDialog>>();
const frameBatchRef = ref<InstanceType<typeof FrameBatchForm>>();
const musicRef = ref<InstanceType<typeof MusicDialog>>();
const motionFormRef = ref<InstanceType<typeof MotionReferenceForm>>();
const generatingDetail = ref(''); // 生成中的镜头设计名称
const chatModels = ref<AiModelModelApi.Model[]>([]); // 对话模型
const chatModelId = ref<number>(); // 对话模型
const imageModels = ref<AiModelModelApi.Model[]>([]); // 绘画模型
const imageModelId = ref<number>(); // 默认绘画模型
const videoModels = ref<AiModelModelApi.Model[]>([]); // 视频模型
const videoModelId = ref<number>(); // 默认视频模型
const resolution = ref<string>(); // 默认分辨率
const generatingBatch = ref(false); // 批量生成视频中

const project = computed(() => props.detail.project);
/** 剧本已修改：分镜可能已过期，不能生成关键帧、视频 */
const scriptChanged = computed(
  () => project.value.status === AiDramaProjectStatusEnum.SCRIPT_CHANGED,
);
const placementAudios = computed(() =>
  props.detail.audios.filter(
    (item) =>
      item.type === AiDramaAudioTypeEnum.BGM ||
      item.type === AiDramaAudioTypeEnum.REFERENCE,
  ),
);

// ========== 切镜 ==========

/** 选中的镜头：默认第一个；镜头被删除、重新生成分镜后，选中位置相近的镜头 */
const selectedId = ref<number>();
const selectedIndex = computed(() =>
  props.detail.storyboards.findIndex((item) => item.id === selectedId.value),
);
const selected = computed(() => props.detail.storyboards[selectedIndex.value]);
let lastIndex = 0;
watch(
  () => props.detail.storyboards,
  (list) => {
    if (list.some((item) => item.id === selectedId.value)) {
      return;
    }
    selectedId.value = list[Math.min(lastIndex, list.length - 1)]?.id;
  },
  { immediate: true },
);
watch(selectedIndex, (index) => {
  if (index >= 0) {
    lastIndex = index;
  }
});

/** 切到上一镜、下一镜 */
function handleSelect(offset: number) {
  selectedId.value = props.detail.storyboards[selectedIndex.value + offset]?.id;
}

/** 新增镜头：默认排在最后，保存后选中它 */
function openCreate() {
  const sceneNos = props.detail.storyboards.map((item) => item.sceneNo || 0);
  formRef.value?.open(
    undefined,
    sceneNos.length > 0 ? Math.max(...sceneNos) + 1 : 1,
  );
}

/** 镜头已新增：选中它并刷新 */
function handleCreated(id: number) {
  selectedId.value = id;
  emit('refresh');
}

// ========== 模型 ==========

/** 视频模型可选的分辨率：与 AI 视频一致，第一个为默认；为空表示不传 */
const resolutions = computed(() => {
  const model = videoModels.value.find((item) => item.id === videoModelId.value);
  return model
    ? getVideoModelCapability(model.platform, model.model).resolutions
    : [];
});
watch(resolutions, (list) => {
  if (!list.includes(resolution.value!)) {
    resolution.value = list[0];
  }
});

const chatModelOptions = computed(() =>
  chatModels.value.map((item) => ({ label: item.name, value: item.id })),
);
const imageModelOptions = computed(() =>
  imageModels.value.map((item) => ({ label: item.name, value: item.id })),
);
const videoModelOptions = computed(() =>
  videoModels.value.map((item) => ({ label: item.name, value: item.id })),
);
const resolutionOptions = computed(() =>
  resolutions.value.map((item) => ({ label: item, value: item })),
);

/** 默认模型的摘要：绘画模型 · 视频模型 · 分辨率 */
const defaultModelText = computed(
  () =>
    [
      imageModels.value.find((item) => item.id === imageModelId.value)?.name,
      videoModels.value.find((item) => item.id === videoModelId.value)?.name,
      resolution.value,
    ]
      .filter(Boolean)
      .join(' · ') || '未选择',
);

/** 镜头的视频模型：生成时固定使用；名称取模型列表，已删除时取快照 */
function getVideoModelText(storyboard: AiDramaStoryboardApi.Storyboard) {
  const name =
    videoModels.value.find((item) => item.id === storyboard.videoModelId)
      ?.name ||
    storyboard.videoModel ||
    `#${storyboard.videoModelId}`;
  return storyboard.videoResolution
    ? `${name} · ${storyboard.videoResolution}`
    : name;
}

function getSceneNos(storyboardIds: number[]) {
  return props.detail.storyboards
    .filter((item) => storyboardIds.includes(item.id))
    .map((item) => `#${item.sceneNo}`)
    .join('、');
}

// ========== 分镜生成 ==========

/** 从剧本生成分镜：打开规划审阅并立即逐场规划；审阅后导入时才替换已有镜头，确认前原分镜保留 */
function handleGenerateStoryboards() {
  planReviewRef.value?.open({ autoPlan: true });
}

/** 生成镜头设计：摄影规则、表演指导、关键帧规划，覆盖当前剧本全部镜头的对应内容 */
const DETAIL_GENERATORS: Record<
  string,
  { api: (projectId: number, modelId?: number) => Promise<any>; name: string }
> = {
  photography: { name: '摄影规则', api: generateDramaPhotographyRules },
  acting: { name: '表演指导', api: generateDramaActingNotes },
  frame: { name: '关键帧规划', api: planDramaFrameList },
};
const generateDetailMenu = computed(() => ({
  items: [
    { key: 'photography', label: '生成摄影规则' },
    { key: 'acting', label: '生成表演指导' },
    { key: 'frame', label: '生成关键帧规划' },
  ].map((item) => ({
    ...item,
    disabled: props.detail.storyboards.length === 0,
  })),
  onClick: (info: { key: number | string }) =>
    handleGenerateDetail(String(info.key)),
}));
async function handleGenerateDetail(command: string) {
  const generator = DETAIL_GENERATORS[command]!;
  try {
    await confirm(
      `为当前剧本的全部镜头生成${generator.name}，会覆盖已有的内容，是否继续？`,
    );
  } catch {
    return;
  }
  generatingDetail.value = `${generator.name}生成中`;
  try {
    await generator.api(project.value.id, chatModelId.value);
    message.success(`${generator.name}已生成`);
    emit('refresh');
  } finally {
    generatingDetail.value = '';
  }
}

/** 批量：批量关键帧、批量生成视频（未生成、已失败的镜头） */
const batchMenu = computed(() => ({
  items: [
    {
      key: 'frame',
      label: '批量关键帧',
      disabled: !imageModelId.value || scriptChanged.value,
    },
    {
      key: 'video',
      label: '批量生成视频',
      disabled: !videoModelId.value || scriptChanged.value,
    },
  ],
  onClick: (info: { key: number | string }) =>
    handleBatchCommand(String(info.key)),
}));
async function handleBatchCommand(command: string) {
  if (command === 'frame') {
    frameBatchRef.value?.open();
    return;
  }
  generatingBatch.value = true;
  try {
    const count = await generateDramaStoryboardVideoBatch(
      project.value.id,
      videoModelId.value!,
      resolution.value,
    );
    message.success(count ? `已提交 ${count} 个镜头` : '没有需要生成的镜头');
    emit('refresh');
  } finally {
    generatingBatch.value = false;
  }
}

// ========== 配乐、参考音频、动作参考 ==========

const audioColumns = [
  { title: '类型', key: 'type', width: 90, align: 'center' as const },
  { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
  { title: '音频', key: 'audio', width: 280 },
  { title: '使用的镜头', key: 'storyboards', width: 140 },
  { title: '音量', dataIndex: 'volume', key: 'volume', width: 70, align: 'center' as const },
  {
    title: '起始偏移（秒）',
    dataIndex: 'startOffset',
    key: 'startOffset',
    width: 120,
    align: 'center' as const,
  },
  { title: '操作', key: 'action', width: 120, align: 'center' as const },
];

/** 删除动作参考 */
async function handleDeleteMotion(id: number) {
  try {
    await confirm('删除后，已选用它的镜头仍保留视频地址，是否继续？');
  } catch {
    return;
  }
  await deleteDramaMotionReference(id);
  message.success('删除成功');
  emit('refresh');
}

/** 删除音频 */
async function handleDeleteAudio(id: number) {
  try {
    await confirm('确定删除该音频吗？');
  } catch {
    return;
  }
  await deleteDramaAudio(id);
  message.success('删除成功');
  emit('refresh');
}

onMounted(async () => {
  chatModels.value = await getModelSimpleList(AiModelTypeEnum.CHAT);
  // Midjourney 不支持，不展示
  imageModels.value = (await getModelSimpleList(AiModelTypeEnum.IMAGE)).filter(
    (item) => item.platform !== AiPlatformEnum.MIDJOURNEY,
  );
  imageModelId.value = imageModels.value[0]?.id;
  videoModels.value = (await getModelSimpleList(AiModelTypeEnum.VIDEO)).filter(
    (item) =>
      isVideoModelOfType(AiVideoTypeEnum.GENERATE, item.platform, item.model),
  );
  videoModelId.value = videoModels.value[0]?.id;
});
</script>

<template>
  <div>
    <!-- 成片：紧凑条放在最上方，默认收起；展开后播放成片、设置合成 -->
    <ComposeBar :detail="detail" @refresh="emit('refresh')" />

    <Card class="mb-3">
      <Alert
        v-if="scriptChanged"
        type="warning"
        show-icon
        class="mb-3"
        title="剧本已修改，请重新分析资产并从剧本生成分镜后，再生成关键帧和视频"
      />
      <!-- 工具栏：高频的「从剧本生成分镜」在前，对话模型在旁；其它入口收进「更多」「默认模型」「批量」 -->
      <div class="flex flex-wrap items-center gap-2">
        <Button type="primary" @click="handleGenerateStoryboards">
          <IconifyIcon icon="lucide:wand-sparkles" class="mr-1 inline" />
          从剧本生成分镜
        </Button>
        <Select
          v-model:value="chatModelId"
          :options="chatModelOptions"
          allow-clear
          show-search
          option-filter-prop="label"
          placeholder="默认对话模型"
          class="w-60"
        />
        <Dropdown
          :disabled="!!generatingDetail"
          :trigger="['click']"
          :menu="generateDetailMenu"
        >
          <Button :loading="!!generatingDetail">
            {{ generatingDetail || '更多' }}
            <IconifyIcon icon="lucide:chevron-down" class="ml-1 inline" />
          </Button>
        </Dropdown>
        <div class="flex-1"></div>
        <Popover placement="bottomRight" trigger="click">
          <template #content>
            <Form
              :label-col="{ flex: '80px' }"
              :wrapper-col="{ flex: 'auto' }"
              class="w-80"
            >
              <FormItem label="绘画模型">
                <Select
                  v-model:value="imageModelId"
                  :options="imageModelOptions"
                  show-search
                  option-filter-prop="label"
                  placeholder="请选择绘画模型"
                  class="w-full"
                />
              </FormItem>
              <FormItem label="视频模型">
                <Select
                  v-model:value="videoModelId"
                  :options="videoModelOptions"
                  show-search
                  option-filter-prop="label"
                  placeholder="请选择视频模型"
                  class="w-full"
                />
              </FormItem>
              <FormItem v-if="resolutions.length > 0" label="分辨率">
                <Select
                  v-model:value="resolution"
                  :options="resolutionOptions"
                  placeholder="分辨率"
                  class="w-full"
                />
              </FormItem>
              <div class="text-muted-foreground text-xs leading-[18px]">
                未设置视频模型的镜头使用此模型；镜头可在生成设置中单独指定
              </div>
            </Form>
          </template>
          <Button>
            默认模型：{{ defaultModelText }}
            <IconifyIcon icon="lucide:chevron-down" class="ml-1 inline" />
          </Button>
        </Popover>
        <Dropdown :trigger="['click']" :menu="batchMenu">
          <Button :loading="generatingBatch">
            批量
            <IconifyIcon icon="lucide:chevron-down" class="ml-1 inline" />
          </Button>
        </Dropdown>
      </div>
    </Card>

    <!-- 工作台：左侧按场次切镜，右侧单镜编辑与原位播放；overflow 用 clip 保持裁剪，不截断内部的 sticky -->
    <div class="bg-card mb-3 overflow-clip rounded-lg p-3">
      <Empty
        v-if="detail.storyboards.length === 0"
        description="暂无镜头，可从剧本生成分镜或手动新增"
      >
        <Button @click="openCreate">
          <IconifyIcon icon="lucide:plus" class="mr-1 inline" />
          新增镜头
        </Button>
      </Empty>
      <Row v-else :gutter="16">
        <Col :span="6">
          <!-- 镜头导航：随页面滚动时保持可见 -->
          <div class="sticky top-3 max-h-[calc(100vh-160px)] overflow-y-auto">
            <ShotNavigator
              v-model="selectedId"
              :storyboards="detail.storyboards"
              :locations="detail.locations"
            />
          </div>
        </Col>
        <Col :span="18">
          <ShotEditor
            v-if="selected"
            :detail="detail"
            :storyboard="selected"
            :index="selectedIndex"
            :total="detail.storyboards.length"
            :image-model-id="imageModelId"
            :video-model-id="videoModelId"
            :resolution="resolution"
            :model-text="selected.videoModelId ? getVideoModelText(selected) : ''"
            :script-changed="scriptChanged"
            @select="handleSelect"
            @create="openCreate"
            @refresh="emit('refresh')"
          />
        </Col>
      </Row>
    </div>

    <!-- 配乐、参考音频：指定使用的镜头；参考音频随镜头视频提交，配乐用于成片 -->
    <Card class="mb-3">
      <div class="mb-3 flex items-center">
        <span class="text-base font-medium">配乐与参考音频</span>
        <div class="flex-1"></div>
        <Button class="mr-2" @click="musicRef?.open()">
          <IconifyIcon icon="lucide:headphones" class="mr-1 inline" />
          AI 配乐
        </Button>
        <Button @click="audioFormRef?.open()">
          <IconifyIcon icon="lucide:plus" class="mr-1 inline" />
          新增音频
        </Button>
      </div>
      <Empty
        v-if="placementAudios.length === 0"
        description="暂无配乐或参考音频"
      />
      <Table
        v-else
        :columns="audioColumns"
        :data-source="placementAudios"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            {{ record.type === AiDramaAudioTypeEnum.BGM ? '配乐' : '参考音频' }}
          </template>
          <template v-else-if="column.key === 'audio'">
            <audio
              :src="record.fileUrl"
              controls
              preload="none"
              class="h-8 w-full"
            ></audio>
          </template>
          <template v-else-if="column.key === 'storyboards'">
            {{
              record.storyboardIds?.length
                ? getSceneNos(record.storyboardIds)
                : '候选，未使用'
            }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="audioFormRef?.open(record as any)">
              编辑
            </Button>
            <Button type="link" size="small" danger @click="handleDeleteAudio(record.id)">
              删除
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 动作参考：镜头的动作参考视频可从这里选用 -->
    <Card class="mb-3">
      <div class="mb-3 flex items-center">
        <span class="text-base font-medium">动作参考</span>
        <div class="flex-1"></div>
        <Button @click="motionFormRef?.open()">
          <IconifyIcon icon="lucide:plus" class="mr-1 inline" />
          添加动作参考
        </Button>
      </div>
      <Empty
        v-if="!detail.motionReferences?.length"
        description="暂无动作参考视频"
      />
      <div v-else class="flex flex-wrap gap-3">
        <div v-for="item in detail.motionReferences" :key="item.id" class="w-[200px]">
          <video
            :src="item.fileUrl"
            controls
            preload="metadata"
            class="h-[120px] w-[200px] rounded bg-black"
          ></video>
          <div class="flex items-center text-xs">
            <span class="flex-1 truncate">{{ item.name }}</span>
            <span v-if="item.duration" class="text-muted-foreground mr-2">
              {{ item.duration.toFixed(1) }} 秒
            </span>
            <Button type="link" size="small" danger @click="handleDeleteMotion(item.id)">
              删除
            </Button>
          </div>
        </div>
      </div>
    </Card>

    <StoryboardForm ref="formRef" :detail="detail" @success="handleCreated" />
    <PlanReviewDialog
      ref="planReviewRef"
      :detail="detail"
      :chat-model-id="chatModelId"
      @success="emit('refresh')"
    />
    <FrameBatchForm
      ref="frameBatchRef"
      :project-id="project.id"
      :model-id="imageModelId"
      @success="emit('refresh')"
    />
    <MusicDialog ref="musicRef" :detail="detail" @success="emit('refresh')" />
    <MotionReferenceForm
      ref="motionFormRef"
      :project-id="project.id"
      @success="emit('refresh')"
    />
    <AudioForm ref="audioFormRef" :detail="detail" @success="emit('refresh')" />
  </div>
</template>
