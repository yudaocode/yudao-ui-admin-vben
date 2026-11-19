<script lang="ts" setup>
import type { AiDramaProjectApi } from '#/api/ai/drama/project';
import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Button,
  Divider,
  Empty,
  Form,
  FormItem,
  message,
  Select,
  Spin,
  Tag,
} from 'antdv-next';

import {
  getDramaStoryboardVoice,
  updateDramaStoryboardSpeakers,
} from '#/api/ai/drama/storyboard';

/** AI 短剧：镜头声音；发言角色可手动指定，预览生成视频时带上的样音、参考音频 */
defineOptions({ name: 'AiDramaVoiceDialog' });

const props = defineProps<{ detail: AiDramaProjectApi.ProjectDetail }>();
const emit = defineEmits<{ success: [] }>();

const loading = ref(false); // 加载中
const saving = ref(false); // 保存中
const storyboard = ref<AiDramaStoryboardApi.Storyboard>();
const voice = ref<AiDramaStoryboardApi.StoryboardVoice>();
const speakerIds = ref<number[]>([]); // 手动指定的发言角色

const characterOptions = computed(() =>
  props.detail.characters.map((item) => ({ label: item.name, value: item.id })),
);

const [Modal, modalApi] = useVbenModal({});

/** 加载镜头声音 */
async function loadVoice() {
  loading.value = true;
  try {
    voice.value = await getDramaStoryboardVoice(storyboard.value!.id);
    speakerIds.value = voice.value.explicit
      ? voice.value.speakers.map((item) => item.characterId)
      : [];
  } finally {
    loading.value = false;
  }
}

/** 打开弹窗 */
async function open(row: AiDramaStoryboardApi.Storyboard) {
  storyboard.value = row;
  voice.value = undefined;
  modalApi.open();
  await loadVoice();
}
defineExpose({ open });

/** 保存发言角色 */
async function save(characterIds?: number[]) {
  saving.value = true;
  try {
    await updateDramaStoryboardSpeakers(storyboard.value!.id, characterIds);
    message.success('已保存');
    emit('success');
    await loadVoice();
  } finally {
    saving.value = false;
  }
}

function handleSave() {
  return save(speakerIds.value.length > 0 ? speakerIds.value : undefined);
}

/** 恢复自动识别 */
function handleAuto() {
  speakerIds.value = [];
  return save(undefined);
}
</script>

<template>
  <Modal :title="`镜头声音 · #${storyboard?.sceneNo ?? ''}`" class="w-[720px]">
    <Spin :spinning="loading">
      <Form :label-col="{ flex: '100px' }" :wrapper-col="{ flex: 'auto' }">
        <FormItem label="发言角色">
          <Select
            v-model:value="speakerIds"
            :options="characterOptions"
            mode="multiple"
            placeholder="为空时按台词自动识别"
            class="w-full"
          />
          <div class="text-muted-foreground text-xs">
            {{ voice?.explicit ? '当前为手动指定' : '当前按台词自动识别' }}；按顺序对应参考音频的编号
          </div>
        </FormItem>
      </Form>
      <Divider title-placement="start">生成视频时使用</Divider>
      <Empty
        v-if="!voice?.speakers.length && !voice?.referenceAudios.length"
        description="没有发言角色和参考音频"
      />
      <div v-for="item in voice?.speakers || []" :key="item.characterId" class="mb-2">
        <span class="font-medium">{{ item.name }}</span>
        <span class="text-muted-foreground ml-2 text-xs">
          {{ item.voiceDescription || '未设置声音描述' }}
        </span>
        <Tag v-if="!item.sampleAudioUrl" color="warning" class="ml-2">
          未选用样音
        </Tag>
      </div>
      <div
        v-for="item in voice?.referenceAudios || []"
        :key="item.url"
        class="mb-2 flex items-center gap-2"
      >
        <span class="w-[220px] text-xs">{{ item.description }}</span>
        <audio :src="item.url" controls preload="none" class="h-8 flex-1"></audio>
      </div>
      <div class="text-muted-foreground text-xs leading-[18px]">
        声音描述作为文字写入视频提示词（当前语音合成只支持选择音色，不支持按描述设计音色）；参考音频只在不使用起始帧、且视频模型支持参考生视频时提交，模型不支持时自动去掉
      </div>
    </Spin>
    <template #footer>
      <Button :disabled="saving" @click="handleAuto">恢复自动识别</Button>
      <Button type="primary" :loading="saving" @click="handleSave">保存</Button>
    </template>
  </Modal>
</template>
