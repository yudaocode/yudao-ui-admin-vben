<script lang="ts" setup>
import type { SystemTenantApi } from '#/api/system/tenant';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';

import { $t } from '#/locales';
import { computed, ref } from 'vue';
import { useVbenForm } from '#/adapter/form';
import { createTenant, getTenant, updateTenant } from '#/api/system/tenant';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemTenantApi.SystemTenant>();
const getTitle = computed(() => {
  return formData.value
    ? $t('ui.actionTitle.edit', ['租户'])
    : $t('ui.actionTitle.create', ['租户']);
});

const [Form, formApi] = useVbenForm({
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
    const data = (await formApi.getValues()) as SystemTenantApi.SystemTenant;
    try {
      await (formData.value ? updateTenant(data) : createTenant(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
        key: 'action_process_msg',
      });
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemTenantApi.SystemTenant>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getTenant(data.id as number);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.lock(false);
    }
  },
});
</script>
<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
