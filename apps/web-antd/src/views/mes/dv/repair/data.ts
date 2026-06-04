import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvRepairApi } from '#/api/mes/dv/repair';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesDvRepairStatusEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';
import { DvMachinerySelect } from '#/views/mes/dv/machinery/components';
/** 表单类型 */
export type FormType = 'confirm' | 'create' | 'detail' | 'finish' | 'update';

/** 表头是否只读（完成维修、验收、详情态；finishDate 在 confirm 单独放开） */
function isHeaderReadonly(formType: FormType): boolean {
  return ['confirm', 'detail', 'finish'].includes(formType);
}

/** 新增/修改维修工单的表单 */
export function useFormSchema(
  formType: FormType,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
  const headerReadonly = isHeaderReadonly(formType);
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
        componentProps: (values) => ({ disabled: headerReadonly || !!values.id }),
      },
      rules: 'required',
      suffix: headerReadonly
        ? undefined
        : () =>
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
        disabled: headerReadonly,
        placeholder: '请输入维修单名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'machineryId',
      label: '设备',
      component: markRaw(DvMachinerySelect),
      componentProps: {
        disabled: headerReadonly,
        placeholder: '请选择设备',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'requireDate',
      label: '报修日期',
      component: 'DatePicker',
      componentProps: {
        disabled: headerReadonly,
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
        disabled: true,
        labelField: 'nickname',
        placeholder: '请选择维修人',
        valueField: 'id',
      },
      // 维修人为待验收(≥APPROVING)态自动产生的只读回显字段
      dependencies: {
        triggerFields: ['status'],
        if: (values) =>
          values.status != null &&
          values.status >= MesDvRepairStatusEnum.APPROVING,
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
      // 维修中(≥CONFIRMED)态展示；仅"完成维修"弹窗可编辑并必填，其余态只读回显
      dependencies: {
        triggerFields: ['status'],
        if: (values) =>
          values.status != null &&
          values.status >= MesDvRepairStatusEnum.CONFIRMED,
        disabled: formType !== 'confirm',
        rules: () => (formType === 'confirm' ? 'required' : null),
      },
    },
    {
      fieldName: 'confirmUserId',
      label: '验收人',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        disabled: true,
        labelField: 'nickname',
        placeholder: '请选择验收人',
        valueField: 'id',
      },
      // 验收信息为已确认(≥FINISHED)态自动产生的只读回显字段
      dependencies: {
        triggerFields: ['status'],
        if: (values) =>
          values.status != null &&
          values.status >= MesDvRepairStatusEnum.FINISHED,
      },
    },
    {
      fieldName: 'confirmDate',
      label: '验收日期',
      component: 'DatePicker',
      componentProps: {
        disabled: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择验收日期',
        showTime: true,
        valueFormat: 'x',
      },
      // 验收信息为已确认(≥FINISHED)态自动产生的只读回显字段
      dependencies: {
        triggerFields: ['status'],
        if: (values) =>
          values.status != null &&
          values.status >= MesDvRepairStatusEnum.FINISHED,
      },
    },
    {
      fieldName: 'result',
      label: '维修结果',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        disabled: true,
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.MES_DV_REPAIR_RESULT, 'number'),
      },
      // 验收信息为已确认(≥FINISHED)态自动产生的只读回显字段
      dependencies: {
        triggerFields: ['status'],
        if: (values) =>
          values.status != null &&
          values.status >= MesDvRepairStatusEnum.FINISHED,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        disabled: headerReadonly,
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
