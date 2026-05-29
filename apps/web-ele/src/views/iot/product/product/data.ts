import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IotProductApi } from '#/api/iot/product/product';

import { h } from 'vue';

import { DeviceTypeEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { getSimpleProductCategoryList } from '#/api/iot/product/category';

/** 基础表单字段（不含图标、图片、描述） */
export function useBasicFormSchema(
  formApi?: VbenFormApi,
  generateProductKey?: () => string,
): VbenFormSchema[] {
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
      fieldName: 'productKey',
      label: 'ProductKey',
      component: 'Input',
      componentProps: {
        placeholder: '请输入 ProductKey',
      },
      dependencies: {
        triggerFields: ['id'],
        if(values) {
          return !values.id;
        },
      },
      rules: z
        .string()
        .min(1, 'ProductKey 不能为空')
        .max(32, 'ProductKey 长度不能超过 32 个字符'),
      suffix: () => {
        return h(
          ElButton,
          {
            onClick: () => {
              if (generateProductKey) {
                formApi?.setFieldValue('productKey', generateProductKey());
              }
            },
          },
          { default: () => '重新生成' },
        );
      },
    },
    {
      fieldName: 'productKey',
      label: 'ProductKey',
      component: 'Input',
      componentProps: {
        placeholder: '请输入 ProductKey',
        disabled: true,
      },
      dependencies: {
        triggerFields: ['id'],
        if(values) {
          return !!values.id;
        },
      },
      rules: z
        .string()
        .min(1, 'ProductKey 不能为空')
        .max(32, 'ProductKey 长度不能超过 32 个字符'),
    },
    {
      fieldName: 'name',
      label: '产品名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入产品名称',
      },
      rules: z
        .string()
        .min(1, '产品名称不能为空')
        .max(64, '产品名称长度不能超过 64 个字符'),
    },
    {
      fieldName: 'categoryId',
      label: '产品分类',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleProductCategoryList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择产品分类',
      },
      rules: 'required',
    },
    {
      fieldName: 'deviceType',
      label: '设备类型',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE, 'number'),
      },
      dependencies: {
        triggerFields: ['id'],
        componentProps: (values) => ({
          // 编辑时设备类型不可改
          disabled: !!values.id,
        }),
      },
      rules: 'required',
    },
    {
      fieldName: 'netType',
      label: '联网方式',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_NET_TYPE, 'number'),
        placeholder: '请选择联网方式',
      },
      // 网关子设备走网关联网，不需要联网方式
      dependencies: {
        triggerFields: ['deviceType'],
        show: (values) =>
          [DeviceTypeEnum.DEVICE, DeviceTypeEnum.GATEWAY].includes(
            values.deviceType,
          ),
      },
      rules: 'required',
    },
    {
      fieldName: 'protocolType',
      label: '协议类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_PROTOCOL_TYPE, 'string'),
        placeholder: '请选择协议类型',
      },
      defaultValue: 'mqtt',
      rules: 'required',
    },
    {
      fieldName: 'serializeType',
      label: '序列化类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_SERIALIZE_TYPE, 'string'),
        placeholder: '请选择序列化类型',
      },
      defaultValue: 'json',
      help: 'iot-gateway-server 默认根据接入的协议类型确定数据格式，仅 MQTT、EMQX 协议支持自定义序列化类型',
      rules: 'required',
    },
  ];
}

/** 高级设置表单字段（图标、图片、产品描述、动态注册） */
export function useAdvancedFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'registerEnabled',
      label: '动态注册',
      component: 'Switch',
      componentProps: {
        activeText: '开',
        inactiveText: '关',
      },
      defaultValue: false,
      help: '设备动态注册无需一一烧录设备证书（DeviceSecret），每台设备烧录相同的产品证书，即 ProductKey 和 ProductSecret ，云端鉴权通过后下发设备证书，您可以根据需要开启或关闭动态注册，保障安全性。',
    },
    {
      fieldName: 'icon',
      label: '产品图标',
      component: 'ImageUpload',
    },
    {
      fieldName: 'picUrl',
      label: '产品图片',
      component: 'ImageUpload',
    },
    {
      fieldName: 'description',
      label: '产品描述',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入产品描述',
        rows: 3,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<IotProductApi.Product>['columns'] {
  return [
    {
      field: 'id',
      title: 'ID',
      width: 80,
    },
    {
      field: 'productKey',
      title: 'ProductKey',
      minWidth: 150,
    },
    {
      field: 'categoryName',
      title: '品类',
      minWidth: 120,
      formatter: ({ row }) => row.categoryName || '未分类',
    },
    {
      field: 'deviceType',
      title: '设备类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE },
      },
    },
    {
      field: 'icon',
      title: '产品图标',
      width: 100,
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'picUrl',
      title: '产品图片',
      width: 100,
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
