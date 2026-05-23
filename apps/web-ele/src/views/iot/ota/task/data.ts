import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { DICT_TYPE, IoTOtaTaskDeviceScopeEnum } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

/** 任务详情的描述字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    { field: 'id', label: '任务编号' },
    { field: 'name', label: '任务名称' },
    {
      field: 'deviceScope',
      label: '升级范围',
      render: (val) => getDictLabel(DICT_TYPE.IOT_OTA_TASK_DEVICE_SCOPE, val),
    },
    {
      field: 'status',
      label: '任务状态',
      render: (val) => getDictLabel(DICT_TYPE.IOT_OTA_TASK_STATUS, val),
    },
    {
      field: 'createTime',
      label: '创建时间',
      render: (val) => (val ? (formatDateTime(val) as string) : '-'),
    },
    { field: 'description', label: '任务描述', span: 3 },
  ];
}

/** 新增升级任务的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'firmwareId',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '任务名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入任务名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'description',
      label: '任务描述',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入任务描述',
        rows: 3,
      },
    },
    {
      fieldName: 'deviceScope',
      label: '升级范围',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_OTA_TASK_DEVICE_SCOPE, 'number'),
        placeholder: '请选择升级范围',
      },
      defaultValue: IoTOtaTaskDeviceScopeEnum.ALL.value,
      rules: 'required',
    },
    {
      fieldName: 'deviceIds',
      label: '选择设备',
      component: 'Select',
      componentProps: {
        multiple: true,
        placeholder: '请选择设备',
        filterable: true,
      },
      defaultValue: [],
      dependencies: {
        triggerFields: ['deviceScope'],
        show: (values) =>
          values.deviceScope === IoTOtaTaskDeviceScopeEnum.SELECT.value,
        rules: (values) =>
          values.deviceScope === IoTOtaTaskDeviceScopeEnum.SELECT.value
            ? 'required'
            : null,
      },
    },
  ];
}

/** 任务列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '任务编号',
      width: 80,
      align: 'center',
    },
    {
      field: 'name',
      title: '任务名称',
      minWidth: 150,
      align: 'center',
    },
    {
      field: 'deviceScope',
      title: '升级范围',
      width: 110,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IOT_OTA_TASK_DEVICE_SCOPE },
      },
    },
    {
      field: 'progress',
      title: '升级进度',
      width: 110,
      align: 'center',
      formatter: ({ row }) =>
        `${row.deviceSuccessCount || 0}/${row.deviceTotalCount || 0}`,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      align: 'center',
      formatter: 'formatDateTime',
    },
    {
      field: 'description',
      title: '任务描述',
      minWidth: 150,
      align: 'center',
      showOverflow: 'tooltip',
    },
    {
      field: 'status',
      title: '任务状态',
      width: 110,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IOT_OTA_TASK_STATUS },
      },
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}
