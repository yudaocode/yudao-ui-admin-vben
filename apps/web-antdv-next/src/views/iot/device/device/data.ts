import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { getSimpleDeviceGroupList } from '#/api/iot/device/group';
import { getSimpleProductList } from '#/api/iot/product/product';

/** 基础表单字段 */
export function useBasicFormSchema(): VbenFormSchema[] {
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
      fieldName: 'productId',
      label: '产品',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleProductList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择产品',
      },
      dependencies: {
        triggerFields: ['id'],
        disabled: (values: any) => !!values?.id,
      },
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'deviceType',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'deviceName',
      label: 'DeviceName',
      component: 'Input',
      componentProps: {
        placeholder: '请输入 DeviceName',
      },
      dependencies: {
        triggerFields: ['id'],
        disabled: (values: any) => !!values?.id,
      },
      rules: z
        .string()
        .min(4, 'DeviceName 长度不能少于 4 个字符')
        .max(32, 'DeviceName 长度不能超过 32 个字符')
        .regex(
          /^[\w.\-:@]{4,32}$/,
          '支持英文字母、数字、下划线（_）、中划线（-）、点号（.）、半角冒号（:）和特殊字符@',
        ),
    },
  ];
}

/** 高级设置表单字段（更多设置） */
export function useAdvancedFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'nickname',
      label: '备注名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入备注名称',
      },
      rules: z
        .string()
        .min(4, '备注名称长度限制为 4~64 个字符')
        .max(64, '备注名称长度限制为 4~64 个字符')
        .regex(
          /^[\u4E00-\u9FA5\u3040-\u30FF\w]+$/,
          '备注名称只能包含中文、英文字母、日文、数字和下划线（_）',
        )
        .optional()
        .or(z.literal('')),
    },
    {
      fieldName: 'picUrl',
      label: '设备图片',
      component: 'ImageUpload',
    },
    {
      fieldName: 'groupIds',
      label: '设备分组',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleDeviceGroupList,
        labelField: 'name',
        valueField: 'id',
        mode: 'multiple',
        placeholder: '请选择设备分组',
      },
    },
    {
      fieldName: 'serialNumber',
      label: '设备序列号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入设备序列号',
      },
      rules: z
        .string()
        .regex(/^[\w-]+$/, '序列号只能包含字母、数字、中划线和下划线')
        .optional()
        .or(z.literal('')),
    },
    {
      fieldName: 'longitude',
      label: '设备经度',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入设备经度',
        class: 'w-full',
        min: -180,
        max: 180,
        precision: 6,
      },
      rules: z
        .number()
        .min(-180, '经度范围为 -180 到 180')
        .max(180, '经度范围为 -180 到 180')
        .optional()
        .nullable(),
    },
    {
      fieldName: 'latitude',
      label: '设备纬度',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入设备纬度',
        class: 'w-full',
        min: -90,
        max: 90,
        precision: 6,
      },
      rules: z
        .number()
        .min(-90, '纬度范围为 -90 到 90')
        .max(90, '纬度范围为 -90 到 90')
        .optional()
        .nullable(),
    },
  ];
}

/** 设备分组表单 */
export function useGroupFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'groupIds',
      label: '设备分组',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleDeviceGroupList,
        labelField: 'name',
        valueField: 'id',
        mode: 'multiple',
        placeholder: '请选择设备分组',
      },
      rules: 'required',
    },
  ];
}

/** 设备导入表单 */
export function useImportFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'file',
      label: '设备数据',
      component: 'Upload',
      rules: 'required',
      help: '仅允许导入 xls、xlsx 格式文件',
    },
    {
      fieldName: 'updateSupport',
      label: '是否覆盖',
      component: 'Switch',
      componentProps: {
        checkedChildren: '是',
        unCheckedChildren: '否',
      },
      rules: z.boolean().default(false),
      help: '是否更新已经存在的设备数据',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'productId',
      label: '产品',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleProductList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择产品',
        allowClear: true,
      },
    },
    {
      fieldName: 'deviceName',
      label: 'DeviceName',
      component: 'Input',
      componentProps: {
        placeholder: '请输入 DeviceName',
        allowClear: true,
      },
    },
    {
      fieldName: 'nickname',
      label: '备注名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入备注名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'deviceType',
      label: '设备类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE, 'number'),
        placeholder: '请选择设备类型',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '设备状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_DEVICE_STATE, 'number'),
        placeholder: '请选择设备状态',
        allowClear: true,
      },
    },
    {
      fieldName: 'groupId',
      label: '设备分组',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleDeviceGroupList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择设备分组',
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'deviceName',
      title: 'DeviceName',
      minWidth: 150,
    },
    {
      field: 'nickname',
      title: '备注名称',
      minWidth: 120,
    },
    {
      field: 'picUrl',
      title: '设备图片',
      width: 100,
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'productId',
      title: '所属产品',
      minWidth: 120,
      slots: { default: 'product' },
    },
    {
      field: 'deviceType',
      title: '设备类型',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE },
      },
    },
    {
      field: 'groupIds',
      title: '所属分组',
      minWidth: 150,
      slots: { default: 'groups' },
    },
    {
      field: 'state',
      title: '设备状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IOT_DEVICE_STATE },
      },
    },
    {
      field: 'onlineTime',
      title: '最后上线时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
