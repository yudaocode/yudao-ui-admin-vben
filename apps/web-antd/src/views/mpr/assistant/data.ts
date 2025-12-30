import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AssistantApi } from '#/api/mpr/assistant';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

/** 新增/修改的表单 */
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
      fieldName: 'name',
      label: '助理名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入助理名称',
      },
    },
    {
      fieldName: 'keyword',
      label: '关键词',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入关键词',
      },
    },
    {
      fieldName: 'billingType',
      label: '帐单类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MPR_BILLING_TYPE, 'string'),
        placeholder: '请选择帐单类型',
      },
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'autoRenew',
      label: '是否自动续期',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
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
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Input',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(isSuperAdmin: boolean): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '助理名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入助理名称',
      },
    },
    {
      fieldName: 'keyword',
      label: '关键词',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入关键词',
      },
    },
    {
      fieldName: 'billingType',
      label: '定价计划',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MPR_BILLING_TYPE, 'string'),
        placeholder: '请选择定价计划',
      },
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'autoRenew',
      label: '是否自动续期',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
        placeholder: '请选择是否自动续期',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MPR_ASSISTANT_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'userId',
      label: '用户ID',
      component: 'Input',
      dependencies: {
        // 变相隐藏|显示
        if(_values) {
          return isSuperAdmin;
        },
        // 只有指定的字段改变时，才会触发
        triggerFields: ['field1Switch'],
      },
      help: '仅管理员可用',
      // description: '用户ID',
      componentProps: {
        allowClear: true,
        placeholder: '请输入用户ID',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(
  isSuperAdmin: boolean,
): VxeTableGridOptions<AssistantApi.Assistant>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
      minWidth: 60,
    },
    {
      field: 'name',
      title: '助理名称',
      minWidth: 120,
      align: 'left',
      formatter: ({ row }) => {
        return row.name || `Ara #${row.id}`;
      },
    },
    {
      field: 'assistantConfig.keyword',
      title: '关键词',
      minWidth: 180,
      align: 'left',
    },
    {
      field: 'billingType',
      title: '定价计划',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MPR_BILLING_TYPE },
      },
    },
    {
      field: 'autoRenew',
      title: '是否自动续期',
      visible: false,
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'configStep',
      title: '配置进度',
      minWidth: 120,
      // type: 'html',
      /* formatter: ({ row }) => {
        return (row.configStep?row.configStep+1:'1')+'/4';
      },*/
      slots: { default: 'config-step' },
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MPR_ASSISTANT_STATUS },
      },
    },
    {
      field: 'startTime',
      title: '开始时间',
      minWidth: 120,
      formatter: 'formatDateTime',
      sortable: true,
    },
    {
      field: 'endTime',
      title: '结束时间',
      minWidth: 120,
      formatter: 'formatDateTime',
      sortable: true,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'userId',
      title: '用户ID',
      minWidth: 120,
      visible: isSuperAdmin,
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
