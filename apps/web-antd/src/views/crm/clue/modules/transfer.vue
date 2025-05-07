<script lang="ts" setup>
import type { CrmPermissionApi } from '#/api/crm/permission';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { transferClue } from '#/api/crm/clue';
import { $t } from '#/locales';

const emit = defineEmits(['success']);
const formData = ref<{ id: number }>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: [
    {
      fieldName: 'ownerUserId',
      label: '负责人',
      component: 'Select',
      componentProps: {
        api: 'getSimpleUserList',
      },
      rules: 'required',
    },
  ],
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
    const data = (await formApi.getValues()) as CrmPermissionApi.TransferReq;
    try {
      await transferClue(data);
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
    const data = modalApi.getData<{ id: number }>();
    if (!data || !data.id) {
      return;
    }
    formData.value = data;
  },
});
</script>

<template>
  <Modal :title="$t('ui.actionTitle.transfer')" class="w-[40%]">
    <Form class="mx-4" />
  </Modal>
</template>
