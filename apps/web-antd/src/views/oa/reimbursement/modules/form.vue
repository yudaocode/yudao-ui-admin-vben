<script lang="ts" setup>
import type { OaReimbursementApi } from '#/api/oa/reimbursement';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createReimbursement,
  getReimbursement,
  updateReimbursement,
} from '#/api/oa/reimbursement';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import ItemForm from './item-form.vue';

const emit = defineEmits(['success']);
const formData = ref<OaReimbursementApi.Reimbursement>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['费用报销'])
    : $t('ui.actionTitle.create', ['费用报销']);
});

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
    // 提交表单
    const data = (await formApi.getValues()) as OaReimbursementApi.Reimbursement;
    try {
      await (formData.value?.id
        ? updateReimbursement(data)
        : createReimbursement(data));
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
      return;
    }
    // 加载数据
    const data = modalApi.getData() as OaReimbursementApi.Reimbursement;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getReimbursement(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[1100px]">
    <Form class="mx-4">
      <template #items="slotProps">
        <ItemForm
          :model-value="slotProps.componentField.modelValue ?? []"
          @update:model-value="
            slotProps.componentField['onUpdate:modelValue']
          "
        />
      </template>
    </Form>
  </Modal>
</template>
