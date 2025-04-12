<script lang="ts" setup>
import type { Demo01ContactApi } from '#/api/infra/demo/demo01';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createDemo01Contact, getDemo01Contact, updateDemo01Contact } from '#/api/infra/demo/demo01';
import { $t } from '#/locales';
import { computed, ref } from 'vue';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<Demo01ContactApi.Demo01Contact>();
const getTitle = computed(() => {
  return formData.value?.id ? $t('ui.actionTitle.edit', ['示例联系人']) : $t('ui.actionTitle.create', ['示例联系人']);
});

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  commonConfig: {
    labelWidth: 120,
  },
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as Demo01ContactApi.Demo01Contact;
    try {
      await (formData.value?.id ? updateDemo01Contact(data) : createDemo01Contact(data));
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
    const data = modalApi.getData<Demo01ContactApi.Demo01Contact>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getDemo01Contact(data.id as number);
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
