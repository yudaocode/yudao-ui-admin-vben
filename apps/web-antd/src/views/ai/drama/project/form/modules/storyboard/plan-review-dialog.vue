<script lang="ts" setup>
import type { AiDramaProjectApi } from '#/api/ai/drama/project';
import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';

import { computed, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Alert,
  Button,
  Empty,
  Input,
  InputNumber,
  message,
  RadioButton,
  RadioGroup,
  Table,
  Tag,
  Textarea,
} from 'ant-design-vue';

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

const columns = [
  { title: '#', key: 'index', width: 50, align: 'center' as const },
  { title: '原文场次', key: 'sceneNumber', width: 80, align: 'center' as const },
  { title: '镜头序号', key: 'sceneNo', width: 100 },
  { title: '标题', key: 'title', width: 160 },
  { title: '画面描述', key: 'sceneText', width: 280 },
  { title: '台词', key: 'dialogues', width: 180 },
  { title: '时长（秒）', key: 'duration', width: 110 },
  { title: '操作', key: 'action', width: 70, align: 'center' as const },
];

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
      message.warning('剧本已有新版本，请关闭后重新规划分镜');
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
    message.warning('规划窗口已变化，请重新确认导入');
    return;
  }
  importing.value = true;
  try {
    await importDramaStoryboardList({
      projectId,
      scriptId: scriptId!,
      storyboards,
    });
    message.success('已导入分镜');
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
      <RadioGroup
        v-if="candidates.length > 0"
        v-model:value="candidateIndex"
        button-style="solid"
      >
        <RadioButton
          v-for="(item, index) in candidates"
          :key="index"
          :value="index"
        >
          方案 {{ index + 1 }}（{{ item.length }} 镜）
        </RadioButton>
      </RadioGroup>
      <Button :loading="planning" @click="handlePlan">
        <IconifyIcon icon="lucide:wand-sparkles" class="mr-1 inline" />
        {{ candidates.length > 0 ? '再规划一版' : '开始规划' }}
      </Button>
      <span class="text-muted-foreground text-xs">
        规划结果只保存在当前窗口，关闭后丢失
      </span>
    </div>
    <Empty
      v-if="current.length === 0"
      :description="planning ? '规划中，请稍候' : '尚未规划'"
    />
    <template v-else>
      <!-- 检查点：按剧本原文场次核对覆盖情况 -->
      <div class="mb-3 flex flex-wrap gap-2">
        <Tag
          v-for="item in checkpoints"
          :key="item.sceneNumber"
          :color="item.duration > 0 ? 'success' : 'warning'"
        >
          场次 {{ item.sceneNumber }} · {{ item.count }} 镜 · {{ item.duration }} 秒
        </Tag>
        <Tag color="default">
          合计 {{ totalDuration }} 秒；当前已有
          {{ detail.storyboards.length }} 个镜头
        </Tag>
      </div>
      <!-- 规划提示：例如角色指定的形象无法唯一匹配，已使用初始形象，导入前请检查 -->
      <Alert
        v-if="planWarnings.length > 0"
        type="warning"
        show-icon
        class="mb-3"
        :message="`有 ${planWarnings.length} 处需要检查`"
      >
        <template #description>
          <div v-for="(item, index) in planWarnings" :key="index">{{ item }}</div>
        </template>
      </Alert>
      <Table
        :columns="columns"
        :data-source="current"
        :pagination="false"
        :row-key="(_: unknown, index?: number) => index!"
        :scroll="{ x: 'max-content', y: 440 }"
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">{{ index + 1 }}</template>
          <template v-else-if="column.key === 'sceneNumber'">
            {{ getSceneNumber(record as AiDramaStoryboardApi.Storyboard) }}
          </template>
          <template v-else-if="column.key === 'sceneNo'">
            <InputNumber
              v-model:value="record.sceneNo"
              :min="1"
              size="small"
              class="w-[70px]"
            />
          </template>
          <template v-else-if="column.key === 'title'">
            <Input v-model:value="record.title" size="small" :maxlength="255" />
          </template>
          <template v-else-if="column.key === 'sceneText'">
            <Textarea v-model:value="record.sceneText" :rows="2" size="small" />
          </template>
          <template v-else-if="column.key === 'dialogues'">
            <div
              v-for="(dialogue, i) in record.dialogues || []"
              :key="i"
              class="text-xs"
            >
              {{ getCharacterName(dialogue.characterId) }}：{{ dialogue.line }}
            </div>
          </template>
          <template v-else-if="column.key === 'duration'">
            <InputNumber
              v-model:value="record.duration"
              :min="1"
              :max="60"
              size="small"
              class="w-[90px]"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" danger @click="handleRemove(index)">
              移除
            </Button>
          </template>
        </template>
      </Table>
    </template>
    <template #footer>
      <Button @click="modalApi.close()">取消</Button>
      <Button
        type="primary"
        :loading="importing"
        :disabled="current.length === 0 || planning"
        @click="handleImport"
      >
        导入此方案
      </Button>
    </template>
  </Modal>
</template>
