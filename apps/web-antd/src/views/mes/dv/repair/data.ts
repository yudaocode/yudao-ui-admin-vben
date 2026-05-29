import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvRepairApi } from '#/api/mes/dv/repair';

import { h, markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';
import { DvMachinerySelect } from '#/views/mes/dv/machinery/components';
import { MesAutoCodeRuleCode, MesDvRepairStatusEnum } from '#/views/mes/utils/constants';
/** 表单类型 */
export type FormType = 'confirm' | 'create' | 'detail' | 'finish' | 'update';

/** 新增/修改维修工单的表单 */
export function useFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
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
      defaultValue: MesDvRepairStatusEnum.PREPARE,
    },
    {
      fieldName: 'code',
      label: '维修单编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入维修单编码',
      },
      dependencies: {
        triggerFields: ['id'],
        componentProps: (values) => ({ disabled: !!values.id }),
      },
      rules: 'required',
      suffix: () =>
        h(
          Button,
          {
            type: 'default',
            onClick: async () => {
              const code = await generateAutoCode(MesAutoCodeRuleCode.DV_REPAIR_CODE);
              await formApi?.setFieldValue('code', code);
            },
          },
          { default: () => '生成' },
        ),
    },
    {
      fieldName: 'name',
      label: '维修单名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入维修单名称',
      },
      rules: 'required',
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
      fieldName: 'requireDate',
      label: '报修日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择报修日期',
        showTime: true,
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'acceptedUserId',
      label: '维修人',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择维修人',
        valueField: 'id',
      },
    },
    {
      fieldName: 'finishDate',
      label: '维修完成日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择完成日期',
        showTime: true,
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'confirmUserId',
      label: '验收人',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择验收人',
        valueField: 'id',
      },
    },
    {
      fieldName: 'confirmDate',
      label: '验收日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择验收日期',
        showTime: true,
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'result',
      label: '维修结果',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.MES_DV_REPAIR_RESULT, 'number'),
      },
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
      fieldName: 'code',
      label: '维修单编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入维修单编码',
      },
    },
    {
      fieldName: 'name',
      label: '维修单名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入维修单名称',
      },
    },
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
      fieldName: 'requireDate',
      label: '报修日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
      },
    },
    {
      fieldName: 'result',
      label: '维修结果',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_DV_REPAIR_RESULT, 'number'),
        placeholder: '请选择维修结果',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_DV_REPAIR_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}
/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesDvRepairApi.Repair>['columns'] {
  return [
    {
      field: 'code',
      title: '维修单编码',
      minWidth: 140,
      slots: {
        default: 'code',
      },
    },
    { field: 'name', title: '维修单名称', minWidth: 150 },
    { field: 'machineryName', title: '设备名称', minWidth: 150 },
    { field: 'requireDate', title: '报修日期', width: 180, formatter: 'formatDateTime' },
    { field: 'finishDate', title: '完成日期', width: 180, formatter: 'formatDateTime' },
    {
      field: 'result',
      title: '维修结果',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_DV_REPAIR_RESULT },
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_DV_REPAIR_STATUS },
      },
    },
    { field: 'createTime', title: '创建时间', width: 180, formatter: 'formatDateTime' },
    {
      title: '操作',
      width: 260,
      fixed: 'right',
      slots: {
        default: 'actions',
      },
    },
  ];
}
