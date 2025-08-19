<script lang="ts" setup>
import type { SystemTenantApi } from '#/api/system/tenant';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createTenant, getTenant, updateTenant } from '#/api/system/tenant';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemTenantApi.Tenant>();
const getTitle = computed(() => {
  return formData.value
    ? $t('ui.actionTitle.edit', ['租户'])
    : $t('ui.actionTitle.create', ['租户']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  // 一共2列
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
    const formValues = (await formApi.getValues()) as SystemTenantApi.Tenant & {
      websites: string;
    };
    // 将换行符分隔的字符串转换为数组
    const data: SystemTenantApi.Tenant = {
      ...formValues,
      websites: formValues.websites
        ? formValues.websites.split('\n').filter((item) => item.trim())
        : [],
    };
    try {
      await (formData.value ? updateTenant(data) : createTenant(data));
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
    const data = modalApi.getData<SystemTenantApi.Tenant>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getTenant(data.id as number);
      // 将数组转换为换行符分隔的字符串
      const formValues = {
        ...formData.value,
        websites: Array.isArray(formData.value.websites)
          ? formData.value.websites.join('\n')
          : formData.value.websites || '',
      };
      // 设置到 values
      await formApi.setValues(formValues);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>
<template>
  <Modal :title="getTitle" class="w-1/2">
    <Form class="mx-4" />
  </Modal>
</template>
