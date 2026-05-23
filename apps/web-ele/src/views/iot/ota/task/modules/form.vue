<script lang="ts" setup>
import type { IoTOtaTaskApi } from '#/api/iot/ota/task';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { getDeviceListByProductId } from '#/api/iot/device/device';
import { createOtaTask } from '#/api/iot/ota/task';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

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
    // 提交表单
    const data = (await formApi.getValues()) as IoTOtaTaskApi.Task;
    try {
      await createOtaTask(data);
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
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ firmwareId: number; productId: number }>();
    if (!data?.firmwareId || !data?.productId) {
      return;
    }
    modalApi.lock();
    try {
      // 设置 firmwareId
      await formApi.setValues({ firmwareId: data.firmwareId });
      // 加载产品下的设备列表
      const devices = (await getDeviceListByProductId(data.productId)) || [];
      // 注入到 deviceIds 字段的 options
      formApi.updateSchema([
        {
          fieldName: 'deviceIds',
          componentProps: {
            options: devices.map((device) => ({
              label: device.nickname
                ? `${device.deviceName} (${device.nickname})`
                : device.deviceName,
              value: device.id,
            })),
          },
        },
      ]);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-3/5" :title="$t('ui.actionTitle.create', ['升级任务'])">
    <Form class="mx-4" />
  </Modal>
</template>
