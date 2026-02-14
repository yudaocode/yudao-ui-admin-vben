<!-- Modbus 连接配置弹窗 -->
<script lang="ts" setup>
import type { IotDeviceModbusConfigApi } from '#/api/iot/device/modbus/config';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { saveModbusConfig } from '#/api/iot/device/modbus/config';
import { ProtocolTypeEnum } from '#/api/iot/product/product';
import { $t } from '#/locales';
import {
  ModbusFrameFormatEnum,
  ModbusModeEnum,
} from '#/views/iot/utils/constants';

defineOptions({ name: 'DeviceModbusConfigForm' });

const emit = defineEmits(['success']);

const formData = ref<IotDeviceModbusConfigApi.ModbusConfig>();
const deviceId = ref<number>(0);
const protocolType = ref<string>('');

const isClient = computed(
  () => protocolType.value === ProtocolTypeEnum.MODBUS_TCP_CLIENT,
); // 是否为 Client 模式
const isServer = computed(
  () => protocolType.value === ProtocolTypeEnum.MODBUS_TCP_SERVER,
); // 是否为 Server 模式

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
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'ip',
      label: 'IP 地址',
      component: 'Input',
      componentProps: {
        placeholder: '请输入 Modbus 服务器 IP 地址',
      },
      dependencies: {
        triggerFields: [''],
        show: () => isClient.value, // Client 模式专有字段：IP 地址
      },
      rules: z.string().min(1, '请输入 IP 地址').optional(),
    },
    {
      fieldName: 'port',
      label: '端口',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入端口',
        min: 1,
        max: 65_535,
      },
      dependencies: {
        triggerFields: [''],
        show: () => isClient.value, // Client 模式专有字段：端口
      },
      rules: z.number().min(1).max(65_535).optional(),
      defaultValue: 502,
    },
    {
      fieldName: 'slaveId',
      label: '从站地址',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入从站地址，范围 1-247',
        min: 1,
        max: 247,
      },
      rules: z.number().min(1, '请输入从站地址').max(247),
      defaultValue: 1,
    },
    {
      fieldName: 'timeout',
      label: '连接超时(ms)',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入连接超时时间',
        min: 1000,
        step: 1000,
      },
      dependencies: {
        triggerFields: [''],
        show: () => isClient.value, // Client 模式专有字段：连接超时
      },
      rules: z.number().min(1000).optional(),
      defaultValue: 3000,
    },
    {
      fieldName: 'retryInterval',
      label: '重试间隔(ms)',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入重试间隔',
        min: 1000,
        step: 1000,
      },
      dependencies: {
        triggerFields: [''],
        show: () => isClient.value, // Client 模式专有字段：重试间隔
      },
      rules: z.number().min(1000).optional(),
      defaultValue: 10_000,
    },
    {
      fieldName: 'mode',
      label: '工作模式',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_MODBUS_MODE, 'number'),
      },
      dependencies: {
        triggerFields: [''],
        show: () => isServer.value, // Server 模式专有字段：工作模式
      },
      rules: 'required',
      defaultValue: ModbusModeEnum.POLLING,
    },
    {
      fieldName: 'frameFormat',
      label: '帧格式',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_MODBUS_FRAME_FORMAT, 'number'),
      },
      dependencies: {
        triggerFields: [''],
        show: () => isServer.value, // Server 模式专有字段：帧格式
      },
      rules: 'required',
      defaultValue: ModbusFrameFormatEnum.MODBUS_TCP,
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
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
    const data =
      (await formApi.getValues()) as IotDeviceModbusConfigApi.ModbusConfig;
    try {
      data.deviceId = deviceId.value;
      await saveModbusConfig(data);
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
    const data = modalApi.getData<{
      config?: IotDeviceModbusConfigApi.ModbusConfig;
      deviceId: number;
      protocolType: string;
    }>();
    if (!data) {
      return;
    }
    deviceId.value = data.deviceId;
    protocolType.value = data.protocolType;
    if (!data.config) {
      return;
    }
    // 设置到 values
    formData.value = { ...data.config };
    await formApi.setValues(formData.value);
  },
});
</script>

<template>
  <Modal title="编辑 Modbus 连接配置" class="w-[600px]">
    <Form class="mx-4" />
  </Modal>
</template>
