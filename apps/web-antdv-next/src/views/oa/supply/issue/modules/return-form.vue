<script lang="ts" setup>
import type { OaSupplyIssueApi } from '#/api/oa/supply/issue';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { returnSupplyApplyItem } from '#/api/oa/supply/issue';

import { useReturnFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaSupplyIssueApi.SupplyApplyItem>();
const getTitle = computed(() => `归还确认 - ${formData.value?.itemName || ''}`);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: useReturnFormSchema(),
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
    const data = (await formApi.getValues()) as { quantity: number } & {
      returnRemark?: string;
    };
    try {
      await returnSupplyApplyItem(
        formData.value!.id!,
        data.quantity,
        data.returnRemark,
      );
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success('归还确认成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 设置当前归还明细，默认归还剩余数量
    const data = modalApi.getData() as OaSupplyIssueApi.SupplyApplyItem;
    formData.value = data;
    const remainQuantity =
      (data.issuedQuantity || 0) - (data.returnedQuantity || 0);
    await formApi.updateSchema([
      {
        fieldName: 'quantity',
        componentProps: {
          min: 1,
          max: remainQuantity,
          precision: 0,
          placeholder: '请输入归还数量',
        },
      },
    ]);
    await formApi.setValues({
      ...data,
      quantity: remainQuantity,
      returnRemark: '',
    });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[550px]">
    <Form class="mx-4" />
  </Modal>
</template>
