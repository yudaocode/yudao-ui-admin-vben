<script setup lang="ts">
import type { IoTOtaTaskApi } from '#/api/iot/ota/task';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getDeviceListByProductId } from '#/api/iot/device/device';
import { createOtaTask } from '#/api/iot/ota/task';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

// TODO @AI：是不是defineOptions、升级任务表单 注释需要？
/** IoT OTA 升级任务表单 */
defineOptions({ name: 'IoTOtaTaskForm' });

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

// TODO @AI：注释风格，需要对齐其他 form；
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    try {
      const data = (await formApi.getValues()) as IoTOtaTaskApi.Task;
      await createOtaTask(data);
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
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
  <Modal class="w-3/5" title="新增升级任务">
    <Form class="mx-4" />
  </Modal>
</template>
