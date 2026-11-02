<script lang="ts" setup>
import type { AiModelModelApi } from '#/api/ai/model/model';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { AiModelInputModalityEnum, AiModelTypeEnum } from '@vben/constants';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { createModel, getModel, updateModel } from '#/api/ai/model/model';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import {
  buildReasoningFormValue,
  buildReasoningSaveData,
  validateReasoningFormValue,
} from '../reasoning';
import ReasoningConfig from './reasoning-config.vue';

const emit = defineEmits(['success']);
const formData = ref<AiModelModelApi.Model>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['模型配置'])
    : $t('ui.actionTitle.create', ['模型配置']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 'auto',
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const values = await formApi.getValues();
    const { reasoningConfig, ...rest } = values;
    const data = rest as AiModelModelApi.Model;
    if (data.type === AiModelTypeEnum.CHAT) {
      // 思考配置：校验后转换为 reasoningConfig 整体提交
      const reasoningError = validateReasoningFormValue(reasoningConfig);
      if (reasoningError) {
        ElMessage.error(reasoningError);
        modalApi.unlock();
        return;
      }
      Object.assign(data, buildReasoningSaveData(reasoningConfig));
    } else {
      delete data.temperature;
      delete data.maxTokens;
      delete data.maxContexts;
      delete data.inputModalities;
      // 非对话模型不提交思考配置（已从 values 中取出），后端按未配置清空
    }
    try {
      await (formData.value?.id ? updateModel(data) : createModel(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as AiModelModelApi.Model;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getModel(data.id);
      // 输入模态：text 必选，保留已配置的 image、video
      formData.value.inputModalities = [
        AiModelInputModalityEnum.TEXT,
        ...(formData.value.inputModalities || []).filter(
          (item) => item !== AiModelInputModalityEnum.TEXT,
        ),
      ];
      // 设置到 values：思考配置转换为表单值
      await formApi.setValues({
        ...formData.value,
        reasoningConfig: buildReasoningFormValue(formData.value),
      });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/5">
    <Form class="mx-4">
      <template #reasoningConfig="slotProps">
        <ReasoningConfig
          :model-value="slotProps.componentField.modelValue"
          :disabled="slotProps.disabled"
          @update:model-value="
            slotProps.componentField['onUpdate:modelValue']($event)
          "
        />
      </template>
    </Form>
  </Modal>
</template>
