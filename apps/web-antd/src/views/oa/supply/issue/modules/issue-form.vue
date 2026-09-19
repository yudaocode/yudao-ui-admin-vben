<script lang="ts" setup>
import type { OaSupplyIssueApi } from '#/api/oa/supply/issue';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { issueSupplyApplyItem } from '#/api/oa/supply/issue';

import { useIssueFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaSupplyIssueApi.SupplyApplyItem>();
const getTitle = computed(() => `发放 - ${formData.value?.itemName || ''}`);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: useIssueFormSchema(),
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
    const data =
      (await formApi.getValues()) as OaSupplyIssueApi.SupplyApplyItem;
    try {
      await issueSupplyApplyItem({
        id: formData.value!.id,
        issuedQuantity: data.issuedQuantity,
        issueRemark: data.issueRemark,
      });
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success('发放成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 设置当前发放明细，默认按申请数量发放
    const data = modalApi.getData() as OaSupplyIssueApi.SupplyApplyItem;
    formData.value = data;
    await formApi.setValues({
      ...data,
      issuedQuantity: data.applyQuantity,
      issueRemark: '',
    });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[550px]">
    <Form class="mx-4" />
  </Modal>
</template>
