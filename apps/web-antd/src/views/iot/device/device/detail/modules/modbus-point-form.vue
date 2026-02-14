<!-- Modbus 点位表单弹窗 -->
<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { IotDeviceModbusPointApi } from '#/api/iot/device/modbus/point';
import type { ThingModelData } from '#/api/iot/thingmodel';

import { computed, h, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import {
  createModbusPoint,
  getModbusPoint,
  updateModbusPoint,
} from '#/api/iot/device/modbus/point';
import {
  getByteOrderOptions,
  IoTThingModelTypeEnum,
  ModbusFunctionCodeOptions,
  ModbusRawDataTypeOptions,
} from '#/views/iot/utils/constants';

defineOptions({ name: 'DeviceModbusPointForm' });

const emit = defineEmits(['success']);

const formData = ref<IotDeviceModbusPointApi.ModbusPoint>();
const deviceId = ref<number>(0);
const thingModelList = ref<ThingModelData[]>([]);

const getTitle = computed(() => {
  return formData.value?.id ? '编辑点位' : '新增点位';
});

/** 筛选属性类型的物模型 */
// TODO @AI：这里 linter 报错：TS2367: This comparison appears to be unintentional because the types string | undefined and number have no overlap.
const propertyList = computed(() => {
  return thingModelList.value.filter(
    (item) => item.type === IoTThingModelTypeEnum.PROPERTY,
  );
});

/** 当前选中的数据类型 */
const currentRawDataType = ref<string>('');

/** 当前字节序选项（根据数据类型动态变化） */
const currentByteOrderOptions = computed(() => {
  if (!currentRawDataType.value) {
    return [];
  }
  return getByteOrderOptions(currentRawDataType.value).map((item) => ({
    value: item.value,
    label: `${item.label} - ${item.description}`,
  }));
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
        showSearch: true,
        // TODO @AI：不用这种 => 格式，看起来不够清晰。只处理这里的。
        filterOption: (input: string, option: any) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
        options: propertyList.value.map((item) => ({
          value: item.id,
          label: `${item.name} (${item.identifier})`,
        })),
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
        placeholder: '请输入寄存器地址',
        min: 0,
        max: 65_535,
      },
      rules: z.number().min(0, '请输入寄存器地址').max(65_535),
      suffix: () => {
        const values = formApi.form.values;
        const addr = values?.registerAddress;
        if (addr === undefined || addr === null) return '';
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
        placeholder: '请输入寄存器数量',
        min: 1,
        max: 125,
      },
      rules: z.number().min(1, '请输入寄存器数量').max(125),
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
        options: currentByteOrderOptions.value,
      },
    },
    {
      fieldName: 'scale',
      label: '缩放因子',
      component: 'InputNumber',
      componentProps: {
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
        placeholder: '请输入轮询间隔',
        min: 100,
        step: 1000,
      },
      rules: z.number().min(100, '请输入轮询间隔'),
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
  handleValuesChange: async (_values, changedFields) => {
    // 物模型属性变化：自动填充 identifier 和 name
    if (changedFields.includes('thingModelId')) {
      const thingModelId = await formApi.getFieldValue('thingModelId');
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
      const rawDataType = await formApi.getFieldValue('rawDataType');
      currentRawDataType.value = rawDataType || '';
      if (rawDataType) {
        // 根据数据类型自动设置寄存器数量
        const option = ModbusRawDataTypeOptions.find(
          (item) => item.value === rawDataType,
        );
        if (option && option.registerCount > 0) {
          await formApi.setFieldValue('registerCount', option.registerCount);
        }
        // 重置字节序为第一个选项
        const byteOrderOptions = getByteOrderOptions(rawDataType);
        if (byteOrderOptions.length > 0) {
          await formApi.setFieldValue('byteOrder', byteOrderOptions[0]!.value);
        }
        // 更新字节序下拉选项
        formApi.updateSchema([
          {
            fieldName: 'byteOrder',
            componentProps: {
              options: byteOrderOptions.map((item) => ({
                value: item.value,
                label: `${item.label} - ${item.description}`,
              })),
            },
          },
        ]);
      }
    }
  },
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    // TODO @AI：这里的处理，可以参考 /Users/yunai/Java/yudao-ui-admin-vben-v5/apps/web-antd/src/views/system/user/modules/form.vue 的注释风格；
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const data =
      (await formApi.getValues()) as IotDeviceModbusPointApi.ModbusPoint;
    try {
      data.deviceId = deviceId.value;
      await (formData.value?.id
        ? updateModbusPoint(data)
        : createModbusPoint(data));
      await modalApi.close();
      emit('success');
      message.success(formData.value?.id ? '更新成功' : '创建成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      currentRawDataType.value = '';
      return;
    }
    // TODO @AI：这里的处理，可以参考 /Users/yunai/Java/yudao-ui-admin-vben-v5/apps/web-antd/src/views/system/user/modules/form.vue 的注释风格；
    const data = modalApi.getData<{
      deviceId: number;
      id?: number;
      thingModelList: ThingModelData[];
    }>();
    if (!data) return;

    deviceId.value = data.deviceId;
    thingModelList.value = data.thingModelList || [];

    // 更新物模型属性下拉选项
    const properties = thingModelList.value.filter(
      (item) => item.type === IoTThingModelTypeEnum.PROPERTY,
    );
    formApi.updateSchema([
      {
        fieldName: 'thingModelId',
        componentProps: {
          options: properties.map((item) => ({
            value: item.id,
            label: `${item.name} (${item.identifier})`,
          })),
        },
      },
    ]);

    if (data.id) {
      // 编辑模式：加载数据
      modalApi.lock();
      try {
        formData.value = await getModbusPoint(data.id);
        // 先设置 rawDataType 以便更新字节序选项
        currentRawDataType.value = formData.value.rawDataType || '';
        if (formData.value.rawDataType) {
          const byteOrderOptions = getByteOrderOptions(
            formData.value.rawDataType,
          );
          formApi.updateSchema([
            {
              fieldName: 'byteOrder',
              componentProps: {
                options: byteOrderOptions.map((item) => ({
                  value: item.value,
                  label: `${item.label} - ${item.description}`,
                })),
              },
            },
          ]);
        }
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
    } else {
      // 新增模式：设置默认值
      // TODO @AI：这个是不是在 data 里处理；
      await formApi.setValues({
        scale: 1,
        pollInterval: 5000,
        status: 0,
      });
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[600px]">
    <Form class="mx-4" />
  </Modal>
</template>
