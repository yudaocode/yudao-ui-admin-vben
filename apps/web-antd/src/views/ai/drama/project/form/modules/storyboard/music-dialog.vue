<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { AiDramaProjectApi } from '#/api/ai/drama/project';
import type { AiModelModelApi } from '#/api/ai/model/model';
import type { AiMusicApi } from '#/api/ai/music';

import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import {
  AiModelTypeEnum,
  AiMusicGenerateModeEnum,
  AiMusicStatusEnum,
  AiPlatformEnum,
  DICT_TYPE,
  isAiMusicRunning,
} from '@vben/constants';

import {
  Button,
  Checkbox,
  Divider,
  Form,
  FormItem,
  message,
  Select,
  Table,
  Textarea,
} from 'ant-design-vue';

import { createDramaMusicAudio } from '#/api/ai/drama/asset';
import { getModelSimpleList } from '#/api/ai/model/model';
import { generateMusic, getMusicMyPage } from '#/api/ai/music';
import { DictTag } from '#/components/dict-tag';

/** AI 短剧：配乐；复用 AI 音乐生成，选用已完成的音乐作为配乐 */
defineOptions({ name: 'AiDramaMusicDialog' });

const props = defineProps<{ detail: AiDramaProjectApi.ProjectDetail }>();
const emit = defineEmits<{ success: [] }>();

const POLL_INTERVAL = 5000; // 音乐生成中的轮询间隔（毫秒）

const visible = ref(false); // 弹窗是否打开
const loading = ref(false); // 列表加载中
const generating = ref(false); // 生成中
const list = ref<AiMusicApi.Music[]>([]); // 我的 AI 音乐
const models = ref<AiModelModelApi.Model[]>([]); // 音乐模型
const storyboardIds = ref<number[]>([]); // 选用时使用的镜头
const formRef = ref();
const formData = reactive({
  modelId: undefined as number | undefined,
  prompt: '',
  makeInstrumental: true,
});
const formRules: Record<string, Rule[]> = {
  modelId: [{ required: true, message: '请选择音乐模型', trigger: 'change' }],
  prompt: [{ required: true, message: '请输入音乐描述', trigger: 'blur' }],
};

const modelOptions = computed(() =>
  models.value.map((item) => ({ label: item.name, value: item.id })),
);
const storyboardOptions = computed(() =>
  props.detail.storyboards.map((item) => ({
    label: `#${item.sceneNo} ${item.title || '未命名镜头'}`,
    value: item.id,
  })),
);
const columns = [
  { title: '名称', dataIndex: 'title', key: 'title', ellipsis: true },
  { title: '状态', key: 'status', width: 100, align: 'center' as const },
  { title: '试听', key: 'audio', width: 280 },
  { title: '时长', key: 'duration', width: 80, align: 'center' as const },
  { title: '操作', key: 'action', width: 80, align: 'center' as const },
];

const [Modal, modalApi] = useVbenModal({
  footer: false,
  onOpenChange(isOpen: boolean) {
    visible.value = isOpen;
  },
});

/** 加载我的 AI 音乐 */
async function getList() {
  loading.value = list.value.length === 0;
  try {
    const data = await getMusicMyPage({ pageNo: 1, pageSize: 20 });
    list.value = data.list;
  } finally {
    loading.value = false;
  }
}

/** 按剧本起草：剧名、基调、大纲 */
function draftPrompt() {
  const script = props.detail.script;
  formData.prompt = [
    `短剧《${script?.title || props.detail.project.name}》的配乐`,
    script?.tone ? `基调：${script.tone}` : '',
    script?.outline ? `剧情：${script.outline.slice(0, 300)}` : '',
  ]
    .filter(Boolean)
    .join('。');
}

/** 生成音乐 */
async function handleGenerate() {
  await formRef.value.validate();
  generating.value = true;
  try {
    await generateMusic({
      generateMode: AiMusicGenerateModeEnum.INSPIRATION,
      modelId: formData.modelId!,
      prompt: formData.prompt,
      makeInstrumental: formData.makeInstrumental,
    });
    message.success('已提交生成，完成后可选用');
    await getList();
  } finally {
    generating.value = false;
  }
}

/** 选用为配乐 */
async function handleUse(row: AiMusicApi.Music) {
  await createDramaMusicAudio({
    projectId: props.detail.project.id,
    musicId: row.id,
    storyboardIds: storyboardIds.value,
  });
  message.success('已加入配乐，可在配乐列表调整音量与起始偏移');
  emit('success');
}

// 有生成中的音乐时轮询
let timer: ReturnType<typeof setInterval> | undefined;
function stopPolling() {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}
watch(
  () => visible.value && list.value.some((item) => isAiMusicRunning(item.status)),
  (value) => {
    stopPolling();
    if (value) {
      timer = setInterval(getList, POLL_INTERVAL);
    }
  },
);
onBeforeUnmount(stopPolling);

/** 打开弹窗 */
async function open() {
  storyboardIds.value = [];
  modalApi.open();
  if (!formData.prompt) {
    draftPrompt();
  }
  if (models.value.length === 0) {
    models.value = await getModelSimpleList(
      AiModelTypeEnum.MUSIC,
      AiPlatformEnum.SUNO,
    );
    formData.modelId ||= models.value[0]?.id;
  }
  await getList();
}
defineExpose({ open });
</script>

<template>
  <Modal title="AI 配乐" class="w-[1000px]">
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="{ flex: '90px' }"
      :wrapper-col="{ flex: 'auto' }"
    >
      <FormItem label="音乐模型" name="modelId">
        <div class="flex items-center gap-3">
          <Select
            v-model:value="formData.modelId"
            :options="modelOptions"
            placeholder="请选择音乐模型"
            class="w-64"
          />
          <Checkbox v-model:checked="formData.makeInstrumental">纯音乐</Checkbox>
        </div>
      </FormItem>
      <FormItem label="音乐描述" name="prompt">
        <Textarea
          v-model:value="formData.prompt"
          :rows="3"
          :maxlength="500"
          show-count
        />
        <Button type="link" class="!px-0" @click="draftPrompt">
          按剧本起草
        </Button>
      </FormItem>
      <div class="flex justify-end">
        <Button type="primary" :loading="generating" @click="handleGenerate">
          生成音乐
        </Button>
      </div>
    </Form>
    <Divider orientation="left">我的 AI 音乐</Divider>
    <Form :label-col="{ flex: '90px' }" :wrapper-col="{ flex: 'auto' }">
      <FormItem label="使用的镜头">
        <Select
          v-model:value="storyboardIds"
          :options="storyboardOptions"
          mode="multiple"
          placeholder="选用时使用的镜头；为空表示候选"
          class="w-full"
        />
      </FormItem>
    </Form>
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      :scroll="{ y: 320 }"
      row-key="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <DictTag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="record.status" />
        </template>
        <template v-else-if="column.key === 'audio'">
          <audio
            v-if="record.audioUrl"
            :src="record.audioUrl"
            controls
            preload="none"
            class="h-8 w-full"
          ></audio>
          <span v-else-if="record.errorMessage" class="text-destructive text-xs">
            {{ record.errorMessage }}
          </span>
        </template>
        <template v-else-if="column.key === 'duration'">
          {{ record.duration ? `${Math.round(record.duration)} 秒` : '' }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Button
            type="link"
            size="small"
            :disabled="
              record.status !== AiMusicStatusEnum.SUCCESS || !record.audioUrl
            "
            @click="handleUse(record as AiMusicApi.Music)"
          >
            选用
          </Button>
        </template>
      </template>
    </Table>
  </Modal>
</template>
