import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvCheckRecordApi } from '#/api/mes/dv/checkrecord';

import { markRaw } from 'vue';

import { DICT_TYPE, MesDvCheckPlanStatusEnum, MesDvCheckRecordStatusEnum, MesDvSubjectTypeEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';
import { DvCheckPlanSelect } from '#/views/mes/dv/checkplan/components';
import { DvMachinerySelect } from '#/views/mes/dv/machinery/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改点检记录的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'status',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
      defaultValue: MesDvCheckRecordStatusEnum.DRAFT,
    },
    {
      fieldName: 'machineryId',
      label: '设备',
      component: markRaw(DvMachinerySelect),
      componentProps: {
        placeholder: '请选择设备',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'planId',
      label: '点检计划',
      component: markRaw(DvCheckPlanSelect),
      componentProps: {
        status: MesDvCheckPlanStatusEnum.ENABLED,
        type: MesDvSubjectTypeEnum.CHECK,
        placeholder: '请选择计划',
      },
    },
    {
      fieldName: 'userId',
      label: '点检人',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择点检人',
        valueField: 'id',
      },
    },
    {
      fieldName: 'checkTime',
      label: '点检时间',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择点检时间',
        showTime: true,
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'machineryName',
      label: '设备名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入设备名称',
      },
    },
    {
      fieldName: 'checkTime',
      label: '点检时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_DV_CHECK_RECORD_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesDvCheckRecordApi.CheckRecord>['columns'] {
  return [
    { field: 'machineryCode', title: '设备编码', minWidth: 140 },
    {
      field: 'machineryName',
      title: '设备名称',
      minWidth: 150,
      slots: {
        default: 'machineryName',
      },
    },
    { field: 'planName', title: '计划名称', minWidth: 150 },
    { field: 'checkTime', title: '点检时间', width: 180, formatter: 'formatDateTime' },
    { field: 'nickname', title: '点检人', minWidth: 120 },
    {
      field: 'status',
      title: '状态',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_DV_CHECK_RECORD_STATUS },
      },
    },
    { field: 'createTime', title: '创建时间', width: 180, formatter: 'formatDateTime' },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: {
        default: 'actions',
      },
    },
  ];
}
