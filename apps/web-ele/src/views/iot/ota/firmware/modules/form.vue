<script lang="ts" setup>
import type { IoTOtaFirmwareApi } from '#/api/iot/ota/firmware';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createOtaFirmware,
  getOtaFirmware,
  updateOtaFirmware,
} from '#/api/iot/ota/firmware';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const formData = ref<IoTOtaFirmwareApi.Firmware>();

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['固件'])
    : $t('ui.actionTitle.create', ['固件']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
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
    // 提交表单：编辑态只提交 id / name / description，其它字段固定不变
    const values = (await formApi.getValues()) as IoTOtaFirmwareApi.Firmware;
    const data: IoTOtaFirmwareApi.Firmware = formData.value?.id
      ? {
          id: formData.value.id,
          name: values.name,
          description: values.description,
        }
      : values;
    try {
      await (formData.value?.id
        ? updateOtaFirmware(data)
        : createOtaFirmware(data));
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
    const data = modalApi.getData<IoTOtaFirmwareApi.Firmware>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getOtaFirmware(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/3">
    <Form class="mx-4" />
  </Modal>
</template>
