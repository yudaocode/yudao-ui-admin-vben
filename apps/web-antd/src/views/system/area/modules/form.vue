<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';

import { $t } from '#/locales';
import { useVbenForm } from '#/adapter/form';
import { getAreaByIp } from '#/api/system/area';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, { setFieldValue, setValues, validate, getValues }] = useVbenForm({
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = await getValues();
    try {
      const result = await getAreaByIp(data.ip);
      // 设置结果
      await setFieldValue('result', result);
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
        key: 'action_process_msg',
      });
    } finally {
      modalApi.lock(false);
    }
  }
});
</script>

<template>
  <Modal title="IP 查询">
    <Form class="mx-4" />
  </Modal>
</template>
