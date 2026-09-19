<script lang="ts" setup>
import type { OaSealApi } from '#/api/oa/seal';
import type { OaSealApplyApi } from '#/api/oa/seal/apply';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createSealApply,
  getSealApply,
  updateSealApply,
} from '#/api/oa/seal/apply';
import { $t } from '#/locales';

import SealSelect from '../../components/select.vue';
import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaSealApplyApi.SealApply>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['用印申请'])
    : $t('ui.actionTitle.create', ['用印申请']);
});

const selectedSeal = ref<OaSealApi.Seal>(); // 已选印章，用于回显

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  wrapperClass: 'grid-cols-2',
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
    // 保存草稿，提交审批由列表单独操作
    const data = (await formApi.getValues()) as OaSealApplyApi.SealApply;
    try {
      await (formData.value?.id
        ? updateSealApply(data)
        : createSealApply(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      selectedSeal.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as OaSealApplyApi.SealApply;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getSealApply(data.id);
      // 回显申请关联的印章
      selectedSeal.value = {
        id: formData.value.sealId,
        no: formData.value.sealNo,
        name: formData.value.sealName,
      };
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[900px]">
    <Form class="mx-4">
      <template #sealId="slotProps">
        <SealSelect
          :model-value="slotProps.componentField.modelValue"
          :selected-seal="selectedSeal"
          class="w-full"
          @update:model-value="slotProps.componentField['onUpdate:modelValue']"
        />
      </template>
    </Form>
  </Modal>
</template>
