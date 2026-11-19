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
  ElAlert,
  ElButton,
  ElCard,
  ElCol,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElMessage,
  ElOption,
  ElPopover,
  ElRow,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  deleteDramaAudio,
  deleteDramaMotionReference,
} from '#/api/ai/drama/asset';
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
async function handleGenerateDetail(command: number | string) {
  const generator = DETAIL_GENERATORS[String(command)]!;
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
    ElMessage.success(`${generator.name}已生成`);
    emit('refresh');
  } finally {
    generatingDetail.value = '';
  }
}

/** 批量：批量关键帧、批量生成视频（未生成、已失败的镜头） */
async function handleBatchCommand(command: number | string) {
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
    ElMessage.success(count ? `已提交 ${count} 个镜头` : '没有需要生成的镜头');
    emit('refresh');
  } finally {
    generatingBatch.value = false;
  }
}

// ========== 配乐、参考音频、动作参考 ==========

/** 删除动作参考 */
async function handleDeleteMotion(id: number) {
  try {
    await confirm('删除后，已选用它的镜头仍保留视频地址，是否继续？');
  } catch {
    return;
  }
  await deleteDramaMotionReference(id);
  ElMessage.success('删除成功');
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
  ElMessage.success('删除成功');
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

    <ElCard class="mb-3">
      <ElAlert
        v-if="scriptChanged"
        type="warning"
        show-icon
        :closable="false"
        class="mb-3"
        title="剧本已修改，请重新分析资产并从剧本生成分镜后，再生成关键帧和视频"
      />
      <!-- 工具栏：高频的「从剧本生成分镜」在前，对话模型在旁；其它入口收进「更多」「默认模型」「批量」 -->
      <div class="flex flex-wrap items-center gap-2">
        <ElButton type="primary" @click="handleGenerateStoryboards">
          <IconifyIcon icon="lucide:wand-sparkles" class="mr-1 inline" />
          从剧本生成分镜
        </ElButton>
        <ElSelect
          v-model="chatModelId"
          clearable
          filterable
          placeholder="默认对话模型"
          class="!w-60"
        >
          <ElOption
            v-for="item in chatModels"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </ElSelect>
        <ElDropdown
          :disabled="!!generatingDetail"
          trigger="click"
          @command="handleGenerateDetail"
        >
          <ElButton :loading="!!generatingDetail">
            {{ generatingDetail || '更多' }}
            <IconifyIcon icon="lucide:chevron-down" class="ml-1 inline" />
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem
                command="photography"
                :disabled="detail.storyboards.length === 0"
              >
                生成摄影规则
              </ElDropdownItem>
              <ElDropdownItem
                command="acting"
                :disabled="detail.storyboards.length === 0"
              >
                生成表演指导
              </ElDropdownItem>
              <ElDropdownItem
                command="frame"
                :disabled="detail.storyboards.length === 0"
              >
                生成关键帧规划
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
        <div class="flex-1"></div>
        <ElPopover placement="bottom-end" trigger="click" :width="360">
          <template #reference>
            <ElButton>
              默认模型：{{ defaultModelText }}
              <IconifyIcon icon="lucide:chevron-down" class="ml-1 inline" />
            </ElButton>
          </template>
          <ElForm label-width="80px">
            <ElFormItem label="绘画模型">
              <ElSelect
                v-model="imageModelId"
                filterable
                placeholder="请选择绘画模型"
                class="w-full"
              >
                <ElOption
                  v-for="item in imageModels"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="视频模型">
              <ElSelect
                v-model="videoModelId"
                filterable
                placeholder="请选择视频模型"
                class="w-full"
              >
                <ElOption
                  v-for="item in videoModels"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem v-if="resolutions.length > 0" label="分辨率">
              <ElSelect
                v-model="resolution"
                placeholder="分辨率"
                class="w-full"
              >
                <ElOption
                  v-for="item in resolutions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </ElSelect>
            </ElFormItem>
            <div class="text-muted-foreground text-xs leading-[18px]">
              未设置视频模型的镜头使用此模型；镜头可在生成设置中单独指定
            </div>
          </ElForm>
        </ElPopover>
        <ElDropdown trigger="click" @command="handleBatchCommand">
          <ElButton :loading="generatingBatch">
            批量
            <IconifyIcon icon="lucide:chevron-down" class="ml-1 inline" />
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem
                command="frame"
                :disabled="!imageModelId || scriptChanged"
              >
                批量关键帧
              </ElDropdownItem>
              <ElDropdownItem
                command="video"
                :disabled="!videoModelId || scriptChanged"
              >
                批量生成视频
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </div>
    </ElCard>

    <!-- 工作台：左侧按场次切镜，右侧单镜编辑与原位播放；overflow 用 clip 保持裁剪，不截断内部的 sticky -->
    <div class="bg-card mb-3 overflow-clip rounded-lg p-3">
      <ElEmpty
        v-if="detail.storyboards.length === 0"
        description="暂无镜头，可从剧本生成分镜或手动新增"
      >
        <ElButton @click="openCreate">
          <IconifyIcon icon="lucide:plus" class="mr-1 inline" />
          新增镜头
        </ElButton>
      </ElEmpty>
      <ElRow v-else :gutter="16">
        <ElCol :span="6">
          <!-- 镜头导航：随页面滚动时保持可见 -->
          <div class="sticky top-3 max-h-[calc(100vh-160px)] overflow-y-auto">
            <ShotNavigator
              v-model="selectedId"
              :storyboards="detail.storyboards"
              :locations="detail.locations"
            />
          </div>
        </ElCol>
        <ElCol :span="18">
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
        </ElCol>
      </ElRow>
    </div>

    <!-- 配乐、参考音频：指定使用的镜头；参考音频随镜头视频提交，配乐用于成片 -->
    <ElCard class="mb-3">
      <div class="mb-3 flex items-center">
        <span class="text-base font-medium">配乐与参考音频</span>
        <div class="flex-1"></div>
        <ElButton class="mr-2" @click="musicRef?.open()">
          <IconifyIcon icon="lucide:headphones" class="mr-1 inline" />
          AI 配乐
        </ElButton>
        <ElButton @click="audioFormRef?.open()">
          <IconifyIcon icon="lucide:plus" class="mr-1 inline" />
          新增音频
        </ElButton>
      </div>
      <ElEmpty
        v-if="placementAudios.length === 0"
        description="暂无配乐或参考音频"
      />
      <ElTable v-else :data="placementAudios" size="small">
        <ElTableColumn label="类型" width="90" align="center">
          <template #default="{ row }">
            {{ row.type === AiDramaAudioTypeEnum.BGM ? '配乐' : '参考音频' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="名称" prop="name" width="140" />
        <ElTableColumn label="音频" min-width="280">
          <template #default="{ row }">
            <audio
              :src="row.fileUrl"
              controls
              preload="none"
              class="h-8 w-full"
            ></audio>
          </template>
        </ElTableColumn>
        <ElTableColumn label="使用的镜头" width="140">
          <template #default="{ row }">
            {{
              row.storyboardIds?.length
                ? getSceneNos(row.storyboardIds)
                : '候选，未使用'
            }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="音量" prop="volume" width="70" align="center" />
        <ElTableColumn
          label="起始偏移（秒）"
          prop="startOffset"
          width="120"
          align="center"
        />
        <ElTableColumn label="操作" width="120" align="center">
          <template #default="{ row }">
            <ElButton
              type="primary"
              link
              size="small"
              @click="audioFormRef?.open(row as any)"
            >
              编辑
            </ElButton>
            <ElButton
              type="danger"
              link
              size="small"
              @click="handleDeleteAudio(row.id)"
            >
              删除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <!-- 动作参考：镜头的动作参考视频可从这里选用 -->
    <ElCard class="mb-3">
      <div class="mb-3 flex items-center">
        <span class="text-base font-medium">动作参考</span>
        <div class="flex-1"></div>
        <ElButton @click="motionFormRef?.open()">
          <IconifyIcon icon="lucide:plus" class="mr-1 inline" />
          添加动作参考
        </ElButton>
      </div>
      <ElEmpty
        v-if="!detail.motionReferences?.length"
        description="暂无动作参考视频"
      />
      <div v-else class="flex flex-wrap gap-3">
        <div
          v-for="item in detail.motionReferences"
          :key="item.id"
          class="w-[200px]"
        >
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
            <ElButton
              type="danger"
              link
              size="small"
              @click="handleDeleteMotion(item.id)"
            >
              删除
            </ElButton>
          </div>
        </div>
      </div>
    </ElCard>

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
