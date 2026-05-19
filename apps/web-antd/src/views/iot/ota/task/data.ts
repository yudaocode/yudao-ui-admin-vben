import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { IoTOtaTaskDeviceScopeEnum } from '#/views/iot/utils/constants';

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
        mode: 'multiple',
        placeholder: '请选择设备',
        showSearch: true,
        filterOption: true,
        optionFilterProp: 'label',
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

/** 任务列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '任务名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入任务名称',
        allowClear: true,
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

/** 升级记录的列表字段 */
export function useRecordGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'deviceName',
      title: '设备名称',
      minWidth: 150,
      align: 'center',
    },
    {
      field: 'fromFirmwareVersion',
      title: '当前版本',
      width: 120,
      align: 'center',
    },
    {
      field: 'status',
      title: '升级状态',
      width: 120,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IOT_OTA_TASK_RECORD_STATUS },
      },
    },
    {
      field: 'progress',
      title: '升级进度',
      width: 120,
      align: 'center',
      formatter: ({ row }) => `${row.progress || 0}%`,
    },
    {
      field: 'description',
      title: '状态描述',
      minWidth: 150,
      align: 'center',
      showOverflow: 'tooltip',
    },
    {
      field: 'updateTime',
      title: '更新时间',
      width: 180,
      align: 'center',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}
