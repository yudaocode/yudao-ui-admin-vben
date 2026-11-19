<script lang="ts" setup>
import type { AiModelModelApi } from '#/api/ai/model/model';

import { onMounted, ref } from 'vue';

import { AiModelTypeEnum } from '@vben/constants';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { generateDramaAudio } from '#/api/ai/drama/asset';
import { getModelSimpleList } from '#/api/ai/model/model';

/** AI 短剧：使用语音模型生成音频；有角色时为样音，否则为旁白 */
defineOptions({ name: 'AiDramaAudioGenerateForm' });

const props = defineProps<{
  characterId?: number;
  defaultText?: string;
  projectId: number;
}>();
const emit = defineEmits<{ success: [] }>();

const models = ref<AiModelModelApi.Model[]>([]); // 语音模型
const generating = ref(false); // 是否生成中
const formData = ref({
  modelId: undefined as number | undefined,
  voice: '',
  speed: 1,
  text: props.defaultText || '',
});

/** 同步合成，可能需要十几秒 */
async function handleGenerate() {
  generating.value = true;
  try {
    await generateDramaAudio({
      ...formData.value,
      modelId: formData.value.modelId!,
      projectId: props.projectId,
      characterId: props.characterId,
      voice: formData.value.voice.trim(),
      text: formData.value.text.trim(),
    });
    ElMessage.success('生成成功');
    emit('success');
  } finally {
    generating.value = false;
  }
}

/** 初始化 */
onMounted(async () => {
  models.value = await getModelSimpleList(AiModelTypeEnum.VOICE);
  formData.value.modelId = models.value[0]?.id;
});
</script>

<template>
  <ElForm :model="formData" label-width="90px">
    <ElFormItem label="语音模型">
      <ElSelect
        v-model="formData.modelId"
        placeholder="请选择语音模型"
        filterable
        class="w-full"
      >
        <ElOption
          v-for="item in models"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="音色">
      <ElInput
        v-model="formData.voice"
        placeholder="服务商的音色标识，例如 longxiaochun"
        :maxlength="128"
      />
    </ElFormItem>
    <ElFormItem label="语速">
      <ElInputNumber
        v-model="formData.speed"
        controls-position="right"
        class="!w-full"
        :min="0.5"
        :max="2"
        :step="0.1"
        :precision="1"
      />
    </ElFormItem>
    <ElFormItem label="文本">
      <ElInput
        v-model="formData.text"
        type="textarea"
        :rows="3"
        :maxlength="2000"
        show-word-limit
      />
    </ElFormItem>
    <ElFormItem>
      <div class="flex w-full justify-end">
        <ElButton
          type="primary"
          :loading="generating"
          :disabled="
            !formData.modelId || !formData.voice.trim() || !formData.text.trim()
          "
          @click="handleGenerate"
        >
          生成{{ characterId ? '样音' : '旁白' }}
        </ElButton>
      </div>
    </ElFormItem>
  </ElForm>
</template>
