<script lang="ts" setup>
import type { AiModelModelApi } from '#/api/ai/model/model';

import { onMounted, ref } from 'vue';

import { AiModelTypeEnum } from '@vben/constants';

import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Select,
} from 'antdv-next';

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
    message.success('生成成功');
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
  <Form :model="formData" :label-col="{ span: 4 }">
    <FormItem label="语音模型">
      <Select
        v-model:value="formData.modelId"
        :options="models"
        :field-names="{ label: 'name', value: 'id' }"
        option-filter-prop="name"
        placeholder="请选择语音模型"
        show-search
        class="w-full"
      />
    </FormItem>
    <FormItem label="音色">
      <Input
        v-model:value="formData.voice"
        placeholder="服务商的音色标识，例如 longxiaochun"
        :maxlength="128"
      />
    </FormItem>
    <FormItem label="语速">
      <InputNumber
        v-model:value="formData.speed"
        :min="0.5"
        :max="2"
        :step="0.1"
        :precision="1"
      />
    </FormItem>
    <FormItem label="文本">
      <TextArea
        v-model:value="formData.text"
        :rows="3"
        :maxlength="2000"
        show-count
      />
    </FormItem>
    <FormItem :wrapper-col="{ span: 24 }">
      <div class="flex w-full justify-end">
        <Button
          type="primary"
          :loading="generating"
          :disabled="
            !formData.modelId || !formData.voice.trim() || !formData.text.trim()
          "
          @click="handleGenerate"
        >
          生成{{ characterId ? '样音' : '旁白' }}
        </Button>
      </div>
    </FormItem>
  </Form>
</template>
