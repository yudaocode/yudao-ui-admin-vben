<script lang="ts" setup>
import type { AiDramaProjectApi } from '#/api/ai/drama/project';
import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';

import { computed, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ElAlert,
  ElButton,
  ElEmpty,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElRadioButton,
  ElRadioGroup,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  importDramaStoryboardList,
  planDramaStoryboardList,
} from '#/api/ai/drama/script';

/** AI 短剧：规划分镜并审阅；规划结果不保存，可多次规划对比，确认后导入替换当前剧本的分镜 */
defineOptions({ name: 'AiDramaPlanReviewDialog' });

const props = defineProps<{
  chatModelId?: number;
  detail: AiDramaProjectApi.ProjectDetail;
}>();
const emit = defineEmits<{ success: [] }>();

const visible = ref(false); // 弹窗是否打开
const importing = ref(false); // 导入中
const candidates = ref<AiDramaStoryboardApi.Storyboard[][]>([]); // 候选方案
const candidateIndex = ref(0); // 当前方案
/** 本次打开的项目、剧本：规划结果只写入同一项目、剧本的窗口，导入也以它为准 */
const context = ref<{ projectId: number; scriptId?: number }>();
function getContextKey() {
  return context.value
    ? `${context.value.projectId}:${context.value.scriptId}`
    : '';
}
/** 进行中的规划：所属的项目、剧本；其它剧本的窗口中不算规划中 */
let planRequestId = 0;
const planRequest = ref<{ id: number; key: string }>();
const planning = computed(
  () => !!planRequest.value && planRequest.value.key === getContextKey(),
);

const current = computed(() => candidates.value[candidateIndex.value] || []);
/** 规划提示：带上第几个镜头 */
const planWarnings = computed(() =>
  current.value.flatMap((item, index) =>
    (item.planWarnings || []).map(
      (warning) => `第 ${index + 1} 镜「${item.title || ''}」：${warning}`,
    ),
  ),
);
const totalDuration = computed(() =>
  current.value.reduce((sum, item) => sum + (item.duration || 0), 0),
);

/** 原文场次：分镜规划返回的场次；没有时按镜头序号 */
function getSceneNumber(item: AiDramaStoryboardApi.Storyboard): number {
  return (item.continuity?.sceneNumber as number) ?? item.sceneNo ?? 0;
}

/** 检查点：每个原文场次的镜头数、时长 */
const checkpoints = computed(() => {
  const map = new Map<
    number,
    { count: number; duration: number; sceneNumber: number }
  >();
  current.value.forEach((item) => {
    const sceneNumber = getSceneNumber(item);
    const checkpoint = map.get(sceneNumber) || {
      sceneNumber,
      count: 0,
      duration: 0,
    };
    checkpoint.count++;
    checkpoint.duration += item.duration || 0;
    map.set(sceneNumber, checkpoint);
  });
  return [...map.values()].sort((a, b) => a.sceneNumber - b.sceneNumber);
});

function getCharacterName(characterId?: number) {
  return (
    props.detail.characters.find((item) => item.id === characterId)?.name ||
    '旁白'
  );
}

/** 移除一个镜头 */
function handleRemove(index: number) {
  current.value.splice(index, 1);
}

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen: boolean) {
    visible.value = isOpen;
  },
});

/** 规划：多场剧本按场逐场规划（后端），只返回不保存；导入确认前原分镜保留 */
async function handlePlan() {
  const key = getContextKey();
  if (!context.value || planning.value) {
    return;
  }
  const id = ++planRequestId;
  planRequest.value = { id, key };
  const { projectId, scriptId } = context.value;
  try {
    const list = await planDramaStoryboardList(projectId, props.chatModelId);
    // 已关闭窗口、或已打开其它项目、剧本的窗口：丢弃，不保存
    if (!visible.value || key !== getContextKey()) {
      return;
    }
    // 规划期间剧本有了新版本：返回的分镜不属于发起时的剧本，丢弃
    if (list.some((item) => item.scriptId && item.scriptId !== scriptId)) {
      ElMessage.warning('剧本已有新版本，请关闭后重新规划分镜');
      return;
    }
    candidates.value.push(list);
    candidateIndex.value = candidates.value.length - 1;
  } finally {
    if (planRequest.value?.id === id) {
      planRequest.value = undefined;
    }
  }
}

/** 导入此方案：剧本已有新版本时，后端拒绝导入 */
async function handleImport() {
  // 以发起导入时的项目、剧本、方案为准：确认期间窗口变化（关闭、打开其它剧本、切换方案）时不导入
  const key = getContextKey();
  const { projectId, scriptId } = context.value!;
  const storyboards = current.value;
  try {
    await confirm(
      `导入后替换当前剧本的全部 ${props.detail.storyboards.length} 个镜头（包括已生成的关键帧、视频），是否继续？`,
    );
  } catch {
    return;
  }
  if (
    !visible.value ||
    key !== getContextKey() ||
    storyboards !== current.value
  ) {
    ElMessage.warning('规划窗口已变化，请重新确认导入');
    return;
  }
  importing.value = true;
  try {
    await importDramaStoryboardList({
      projectId,
      scriptId: scriptId!,
      storyboards,
    });
    ElMessage.success('已导入分镜');
    await modalApi.close();
    emit('success');
  } finally {
    importing.value = false;
  }
}

/**
 * 打开：规划结果只保存在本次打开的窗口中
 *
 * @param options.autoPlan 是否立即开始规划（「从剧本生成分镜」）；同一项目、剧本上一次的规划仍在进行时，沿用它的结果；
 *        其它剧本（例如剧本已有新版本）的规划结果到达后丢弃
 */
function open(options?: { autoPlan?: boolean }) {
  candidates.value = [];
  candidateIndex.value = 0;
  context.value = {
    projectId: props.detail.project.id,
    scriptId: props.detail.script?.id,
  };
  visible.value = true;
  modalApi.open();
  if (options?.autoPlan) {
    handlePlan();
  }
}
defineExpose({ open });
</script>

<template>
  <Modal title="规划分镜" class="w-[1100px]">
    <div class="mb-3 flex flex-wrap items-center gap-3">
      <ElRadioGroup v-if="candidates.length > 0" v-model="candidateIndex">
        <ElRadioButton
          v-for="(item, index) in candidates"
          :key="index"
          :value="index"
        >
          方案 {{ index + 1 }}（{{ item.length }} 镜）
        </ElRadioButton>
      </ElRadioGroup>
      <ElButton :loading="planning" @click="handlePlan">
        <IconifyIcon icon="lucide:wand-sparkles" class="mr-1 inline" />
        {{ candidates.length > 0 ? '再规划一版' : '开始规划' }}
      </ElButton>
      <span class="text-muted-foreground text-xs">
        规划结果只保存在当前窗口，关闭后丢失
      </span>
    </div>
    <ElEmpty
      v-if="current.length === 0"
      :description="planning ? '规划中，请稍候' : '尚未规划'"
    />
    <template v-else>
      <!-- 检查点：按剧本原文场次核对覆盖情况 -->
      <div class="mb-3 flex flex-wrap gap-2">
        <ElTag
          v-for="item in checkpoints"
          :key="item.sceneNumber"
          :type="item.duration > 0 ? 'success' : 'warning'"
        >
          场次 {{ item.sceneNumber }} · {{ item.count }} 镜 ·
          {{ item.duration }} 秒
        </ElTag>
        <ElTag type="info">
          合计 {{ totalDuration }} 秒；当前已有
          {{ detail.storyboards.length }} 个镜头
        </ElTag>
      </div>
      <!-- 规划提示：例如角色指定的形象无法唯一匹配，已使用初始形象，导入前请检查 -->
      <ElAlert
        v-if="planWarnings.length > 0"
        type="warning"
        show-icon
        :closable="false"
        class="mb-3"
        :title="`有 ${planWarnings.length} 处需要检查`"
      >
        <div v-for="(item, index) in planWarnings" :key="index">{{ item }}</div>
      </ElAlert>
      <ElTable :data="current" max-height="440" size="small">
        <ElTableColumn label="#" width="50" align="center">
          <template #default="{ $index }">{{ $index + 1 }}</template>
        </ElTableColumn>
        <ElTableColumn label="原文场次" width="80" align="center">
          <template #default="{ row }">
            {{ getSceneNumber(row as AiDramaStoryboardApi.Storyboard) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="镜头序号" width="120">
          <template #default="{ row }">
            <ElInputNumber
              v-model="row.sceneNo"
              :min="1"
              size="small"
              controls-position="right"
              class="!w-[90px]"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn label="标题" width="160">
          <template #default="{ row }">
            <ElInput v-model="row.title" size="small" :maxlength="255" />
          </template>
        </ElTableColumn>
        <ElTableColumn label="画面描述" min-width="280">
          <template #default="{ row }">
            <ElInput
              v-model="row.sceneText"
              type="textarea"
              :rows="2"
              size="small"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn label="台词" width="180">
          <template #default="{ row }">
            <div
              v-for="(dialogue, i) in row.dialogues || []"
              :key="i"
              class="text-xs"
            >
              {{ getCharacterName(dialogue.characterId) }}：{{ dialogue.line }}
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="时长（秒）" width="130">
          <template #default="{ row }">
            <ElInputNumber
              v-model="row.duration"
              :min="1"
              :max="60"
              size="small"
              controls-position="right"
              class="!w-[100px]"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="70" align="center">
          <template #default="{ $index }">
            <ElButton
              type="danger"
              link
              size="small"
              @click="handleRemove($index)"
            >
              移除
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
    </template>
    <template #footer>
      <ElButton @click="modalApi.close()">取消</ElButton>
      <ElButton
        type="primary"
        :loading="importing"
        :disabled="current.length === 0 || planning"
        @click="handleImport"
      >
        导入此方案
      </ElButton>
    </template>
  </Modal>
</template>
