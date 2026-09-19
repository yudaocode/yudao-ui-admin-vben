import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate, formatDateTime, handleTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { getSimpleDeptList } from '#/api/system/dept';
import { DictTag } from '#/components/dict-tag';
import { getRangePickerDefaultProps } from '#/utils';

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
      fieldName: 'no',
      label: '单据编号',
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: '保存后自动生成',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'applyTime',
      label: '领用日期',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择领用日期',
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
      rules: 'required',
    },
    {
      fieldName: 'useType',
      label: '使用类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SUPPLY_USE_TYPE, 'number'),
        placeholder: '请选择使用类型',
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'pickupMethod',
      label: '领取方式',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SUPPLY_PICKUP_METHOD, 'number'),
        placeholder: '请选择领取方式',
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'reason',
      label: '申请事由',
      component: 'Textarea',
      componentProps: {
        maxlength: 500,
        placeholder: '请输入申请事由',
      },
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        maxlength: 500,
        placeholder: '请输入备注',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'fileUrls',
      label: '附件',
      component: 'FileUpload',
      componentProps: {
        maxNumber: 10,
        maxSize: 20,
      },
      formItemClass: 'col-span-2',
      rules: z.array(z.string()).default([]),
    },
    {
      fieldName: 'items',
      label: '领用明细',
      component: 'Input',
      formItemClass: 'col-span-2',
    },
  ];
}

/** 领用明细的表格列配置 */
export function useFormItemColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'seq', title: '序号', width: 60, align: 'center' },
    {
      field: 'itemName',
      title: '物品名称',
      minWidth: 160,
    },
    {
      field: 'model',
      title: '规格型号',
      minWidth: 120,
    },
    {
      field: 'unit',
      title: '计量单位',
      width: 90,
      align: 'center',
    },
    {
      field: 'manageType',
      title: '管理类型',
      width: 110,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_SUPPLY_MANAGE_TYPE },
      },
    },
    {
      field: 'applyQuantity',
      title: '领用数量',
      width: 140,
      slots: { default: 'applyQuantity' },
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '单据编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入单据编号',
      },
    },
    {
      fieldName: 'status',
      label: '单据状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '未提交', value: BpmProcessInstanceStatus.NOT_START },
          ...getDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, 'number'),
        ],
        allowClear: true,
        placeholder: '请选择单据状态',
      },
    },
    {
      fieldName: 'deptId',
      label: '申请部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => {
          const data = await getSimpleDeptList();
          return handleTree(data);
        },
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择申请部门',
        allowClear: true,
        treeDefaultExpandAll: true,
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
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'no',
      title: '单据编号',
      minWidth: 210,
      slots: { default: 'no' },
    },
    {
      field: 'status',
      title: '单据状态',
      width: 120,
      slots: { default: 'statusTag' },
    },
    {
      field: 'reason',
      title: '申请事由',
      minWidth: 200,
    },
    {
      field: 'creatorName',
      title: '申请人',
      minWidth: 100,
    },
    {
      field: 'deptName',
      title: '申请部门',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
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

/** 领用申请详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'no',
      label: '单据编号',
    },
    {
      field: 'status',
      label: '单据状态',
      slot: 'statusTag',
    },
    {
      field: 'creatorName',
      label: '申请人',
    },
    {
      field: 'deptName',
      label: '申请部门',
    },
    {
      field: 'applyTime',
      label: '领用日期',
      render: (value) => (value ? formatDate(value, 'YYYY-MM-DD') : '-'),
    },
    {
      field: 'useType',
      label: '使用类型',
      render: (value) =>
        value === undefined
          ? '-'
          : h(DictTag, { type: DICT_TYPE.OA_SUPPLY_USE_TYPE, value }),
    },
    {
      field: 'pickupMethod',
      label: '领取方式',
      render: (value) =>
        value === undefined
          ? '-'
          : h(DictTag, { type: DICT_TYPE.OA_SUPPLY_PICKUP_METHOD, value }),
    },
    {
      field: 'createTime',
      label: '创建时间',
      render: (value) => formatDateTime(value) || '-',
    },
    {
      field: 'reason',
      label: '申请事由',
      span: 2,
    },
    {
      field: 'remark',
      label: '备注',
      span: 2,
    },
    {
      field: 'fileUrls',
      label: '附件',
      span: 2,
      slot: 'fileUrls',
    },
  ];
}

/** 详情领用明细的表格列配置 */
export function useDetailItemColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'seq', title: '序号', width: 60, align: 'center' },
    {
      field: 'itemName',
      title: '物品名称',
      minWidth: 160,
    },
    {
      field: 'model',
      title: '规格型号',
      minWidth: 120,
    },
    {
      field: 'unit',
      title: '计量单位',
      width: 90,
      align: 'center',
    },
    {
      field: 'manageType',
      title: '管理类型',
      width: 110,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_SUPPLY_MANAGE_TYPE },
      },
    },
    {
      field: 'applyQuantity',
      title: '领用数量',
      width: 140,
    },
  ];
}
