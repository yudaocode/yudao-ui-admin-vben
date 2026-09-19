import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h, markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate, handleTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { getSimpleDeptList } from '#/api/system/dept';
import { DictTag } from '#/components/dict-tag';
import { getRangePickerDefaultProps } from '#/utils';
import { OaSealStatus } from '#/views/oa/utils/constants';
import { UserSelect } from '#/views/system/user/components';

/** 部门树选择配置 */
export function useDeptTreeSelectProps() {
  return {
    api: async () => handleTree(await getSimpleDeptList()),
    labelField: 'name',
    valueField: 'id',
    childrenField: 'children',
    placeholder: '请选择部门',
    clearable: true,
    defaultExpandAll: true,
  };
}

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
      fieldName: 'deptId',
      label: '所属部门',
      component: 'ApiTreeSelect',
      componentProps: useDeptTreeSelectProps(),
      rules: 'required',
    },
    {
      fieldName: 'no',
      label: '印章编号',
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: '保存后自动生成',
      },
    },
    {
      fieldName: 'name',
      label: '印章名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入印章名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'type',
      label: '印章类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SEAL_TYPE, 'number'),
        placeholder: '请选择印章类型',
      },
      rules: 'required',
    },
    {
      fieldName: 'category',
      label: '印章分类',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SEAL_CATEGORY, 'number'),
        clearable: true,
        placeholder: '请选择印章分类',
      },
    },
    {
      fieldName: 'keeperUserId',
      label: '保管人',
      component: markRaw(UserSelect),
      rules: 'required',
    },
    {
      fieldName: 'keeperDeptId',
      label: '保管部门',
      component: 'ApiTreeSelect',
      componentProps: useDeptTreeSelectProps(),
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SEAL_STATUS, 'number'),
        placeholder: '请选择状态',
      },
      rules: z.number().default(OaSealStatus.AVAILABLE),
    },
    {
      fieldName: 'purchaseTime',
      label: '购买时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择购买时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'enableTime',
      label: '启用时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择启用时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'disableTime',
      label: '停用时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择停用时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'picUrl',
      label: '印章照片',
      component: 'ImageUpload',
    },
    {
      fieldName: 'sort',
      label: '显示顺序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 0,
        controlsPosition: 'right',
        class: '!w-full',
        placeholder: '请输入显示顺序',
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        placeholder: '请输入备注',
      },
      formItemClass: 'col-span-2',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入编号',
      },
    },
    {
      fieldName: 'name',
      label: '名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入名称',
      },
    },
    {
      fieldName: 'category',
      label: '印章分类',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SEAL_CATEGORY, 'number'),
        clearable: true,
        placeholder: '请选择印章分类',
      },
    },
    {
      fieldName: 'deptId',
      label: '所属部门',
      component: 'ApiTreeSelect',
      componentProps: useDeptTreeSelectProps(),
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SEAL_STATUS, 'number'),
        clearable: true,
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'type',
      label: '印章类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SEAL_TYPE, 'number'),
        clearable: true,
        placeholder: '请选择印章类型',
      },
    },
    {
      fieldName: 'keeperUserId',
      label: '保管人',
      component: markRaw(UserSelect),
    },
    {
      fieldName: 'purchaseTime',
      label: '购买时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
    {
      fieldName: 'enableTime',
      label: '启用时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
    {
      fieldName: 'disableTime',
      label: '停用时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'deptName', title: '所属部门', minWidth: 150 },
    { field: 'no', title: '印章编号', minWidth: 180 },
    {
      field: 'name',
      title: '印章名称',
      minWidth: 160,
      slots: { default: 'name' },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_SEAL_STATUS },
      },
    },
    {
      field: 'picUrl',
      title: '印章照片',
      width: 100,
      cellRender: { name: 'CellImage' },
    },
    {
      field: 'type',
      title: '印章类型',
      minWidth: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_SEAL_TYPE },
      },
    },
    {
      field: 'category',
      title: '分类',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_SEAL_CATEGORY },
      },
    },
    { field: 'keeperName', title: '保管人', minWidth: 120 },
    { field: 'keeperDeptName', title: '保管部门', minWidth: 150 },
    {
      field: 'purchaseTime',
      title: '购买日期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'enableTime',
      title: '启用日期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'disableTime',
      title: '停用日期',
      width: 120,
      formatter: 'formatDate',
    },
    { field: 'sort', title: '显示顺序', width: 100 },
    { field: 'remark', title: '备注', minWidth: 150, showOverflow: true },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 印章详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'deptName',
      label: '所属部门',
      span: 2,
    },
    {
      field: 'no',
      label: '印章编号',
    },
    {
      field: 'name',
      label: '印章名称',
    },
    {
      field: 'keeperName',
      label: '保管人',
    },
    {
      field: 'keeperDeptName',
      label: '保管部门',
    },
    {
      field: 'purchaseTime',
      label: '购买时间',
      render: (value) => (value ? formatDate(value) : '-'),
    },
    {
      field: 'enableTime',
      label: '启用时间',
      render: (value) => (value ? formatDate(value) : '-'),
    },
    {
      field: 'disableTime',
      label: '停用时间',
      render: (value) => (value ? formatDate(value) : '-'),
    },
    {
      field: 'remark',
      label: '备注',
    },
    {
      field: 'status',
      label: '状态',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_SEAL_STATUS, value: value ?? '' }),
    },
    {
      field: 'type',
      label: '类型',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_SEAL_TYPE, value: value ?? '' }),
    },
    {
      field: 'category',
      label: '分类',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_SEAL_CATEGORY, value: value ?? '' }),
    },
    {
      field: 'picUrl',
      label: '照片',
      slot: 'picUrl',
    },
  ];
}
