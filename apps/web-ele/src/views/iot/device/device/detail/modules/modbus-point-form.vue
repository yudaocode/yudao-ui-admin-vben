<!-- Modbus 点位表单弹窗 -->
<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { IotDeviceModbusPointApi } from '#/api/iot/device/modbus/point';
import type { ThingModelApi } from '#/api/iot/thingmodel';

import { computed, h, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import {
  CommonStatusEnum,
  DICT_TYPE,
  getByteOrderOptions,
  IoTThingModelTypeEnum,
  ModbusFunctionCodeOptions,
  ModbusRawDataTypeOptions,
} from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElMessage } from 'element-plus';

import { useVbenForm, z } from '#/adapter/form';
import {
  createModbusPoint,
  getModbusPoint,
  updateModbusPoint,
} from '#/api/iot/device/modbus/point';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const formData = ref<IotDeviceModbusPointApi.ModbusPoint>();
const getTitle = computed(() => {
  return formData.value?.id ? '编辑点位' : '新增点位';
});
const deviceId = ref<number>(0);
const thingModelList = ref<ThingModelApi.ThingModel[]>([]);

/** 筛选属性类型的物模型 */
const propertyList = computed(() => {
  return thingModelList.value.filter(
    (item) => Number(item.type) === IoTThingModelTypeEnum.PROPERTY,
  );
});

/** 表单 Schema */
function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'identifier',
      dependencies: {
        triggerFields: [''], // 隐藏字段：identifier（由物模型属性选择自动填充）
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'name',
      dependencies: {
        triggerFields: [''], // 隐藏字段：name（由物模型属性选择自动填充）
        show: () => false,
      },
    },
    {
      fieldName: 'thingModelId',
      label: '物模型属性',
      component: 'Select',
      componentProps: {
        placeholder: '请选择物模型属性',
        filterable: true,
      },
      dependencies: {
        triggerFields: [''],
        componentProps: () => ({
          options: propertyList.value.map((item) => ({
            value: item.id,
            label: `${item.name} (${item.identifier})`,
          })),
        }),
      },
      rules: 'required',
    },
    {
      fieldName: 'functionCode',
      label: '功能码',
      component: 'Select',
      componentProps: {
        placeholder: '请选择功能码',
        options: ModbusFunctionCodeOptions.map((item) => ({
          value: item.value,
          label: item.label,
        })),
      },
      rules: 'required',
    },
    {
      fieldName: 'registerAddress',
      label: '寄存器地址',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        placeholder: '请输入寄存器地址',
        min: 0,
        max: 65_535,
      },
      rules: 'required',
      suffix: () => {
        const addr = formApi.form.values?.registerAddress;
        if (addr === null || addr === undefined) {
          return '';
        }
        return h(
          'span',
          { class: 'text-gray-400' },
          `0x${Number(addr).toString(16).toUpperCase().padStart(4, '0')}`,
        );
      },
    },
    {
      fieldName: 'registerCount',
      label: '寄存器数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        placeholder: '请输入寄存器数量',
        min: 1,
        max: 125,
      },
      rules: 'required',
    },
    {
      fieldName: 'rawDataType',
      label: '原始数据类型',
      component: 'Select',
      componentProps: {
        placeholder: '请选择数据类型',
        options: ModbusRawDataTypeOptions.map((item) => ({
          value: item.value,
          label: `${item.label} - ${item.description}`,
        })),
      },
      rules: 'required',
    },
    {
      fieldName: 'byteOrder',
      label: '字节序',
      component: 'Select',
      componentProps: {
        placeholder: '请选择字节序',
      },
      dependencies: {
        triggerFields: ['rawDataType'],
        componentProps: (values) => ({
          options: values.rawDataType
            ? getByteOrderOptions(values.rawDataType).map((item) => ({
                value: item.value,
                label: `${item.label} - ${item.description}`,
              }))
            : [],
        }),
      },
      rules: 'required',
    },
    {
      fieldName: 'scale',
      label: '缩放因子',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        placeholder: '请输入缩放因子',
        precision: 6,
        step: 0.1,
      },
      defaultValue: 1,
    },
    {
      fieldName: 'pollInterval',
      label: '轮询间隔(ms)',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        placeholder: '请输入轮询间隔',
        min: 100,
        step: 1000,
      },
      rules: z.number().min(100, '请输入轮询间隔'),
      defaultValue: 5000,
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
  ];
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  handleValuesChange: async (values, changedFields) => {
    // 物模型属性变化：自动填充 identifier 和 name
    if (changedFields.includes('thingModelId')) {
      const thingModelId = values.thingModelId;
      const thingModel = thingModelList.value.find(
        (item) => item.id === thingModelId,
      );
      if (thingModel) {
        await formApi.setFieldValue('identifier', thingModel.identifier);
        await formApi.setFieldValue('name', thingModel.name);
      }
    }
    // 数据类型变化：自动设置寄存器数量和字节序
    if (changedFields.includes('rawDataType')) {
      const rawDataType = values.rawDataType;
      if (rawDataType) {
        // 根据数据类型自动设置寄存器数量
        const option = ModbusRawDataTypeOptions.find(
          (item) => item.value === rawDataType,
        );
        if (option && option.registerCount > 0) {
          await formApi.setFieldValue('registerCount', option.registerCount);
        }
        // 字节序：仅在当前值为空或不属于新 rawDataType 时才重置为第一个选项；
        // 编辑回填时 setValues 会触发本回调，无条件重置会覆盖已保存字节序
        const byteOrderOptions = getByteOrderOptions(rawDataType);
        if (byteOrderOptions.length > 0) {
          const currentByteOrder = values.byteOrder;
          const isCurrentValid =
            !!currentByteOrder &&
            byteOrderOptions.some((opt) => opt.value === currentByteOrder);
          if (!isCurrentValid) {
            await formApi.setFieldValue(
              'byteOrder',
              byteOrderOptions[0]!.value,
            );
          }
        }
      }
    }
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
    const data =
      (await formApi.getValues()) as IotDeviceModbusPointApi.ModbusPoint;
    try {
      data.deviceId = deviceId.value;
      await (formData.value?.id
        ? updateModbusPoint(data)
        : createModbusPoint(data));
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
    const data = modalApi.getData<{
      deviceId: number;
      id?: number;
      thingModelList: ThingModelApi.ThingModel[];
    }>();
    if (!data) {
      return;
    }
    deviceId.value = data.deviceId;
    thingModelList.value = data.thingModelList || [];
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getModbusPoint(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[600px]">
    <Form class="mx-4" />
  </Modal>
</template>
