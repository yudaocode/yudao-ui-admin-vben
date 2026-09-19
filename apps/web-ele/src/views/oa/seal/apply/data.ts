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
import { OaSealApplyType, OaSealUseMode } from '#/views/oa/utils/constants';

import SealSelect from '../components/select.vue';

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
      fieldName: 'sealId',
      label: '印章',
      component: 'Input',
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'reason',
      label: '用印事由',
      component: 'Textarea',
      componentProps: {
        rows: 2,
        maxlength: 500,
        showWordLimit: true,
        placeholder: '请输入用印事由',
      },
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'type',
      label: '用印类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SEAL_APPLY_TYPE, 'number'),
        placeholder: '请选择用印类型',
      },
      rules: z.number().default(OaSealApplyType.CONTRACT),
    },
    {
      fieldName: 'mode',
      label: '用印方式',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SEAL_USE_MODE, 'number'),
        placeholder: '请选择用印方式',
      },
      rules: z.number().default(OaSealUseMode.ONSITE),
    },
    {
      fieldName: 'documentTitle',
      label: '文件标题',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入文件标题',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'documentType',
      label: '文件类型',
      component: 'Input',
      componentProps: {
        maxlength: 64,
        placeholder: '请输入文件类型',
      },
    },
    {
      fieldName: 'documentCount',
      label: '文件份数',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        precision: 0,
        controlsPosition: 'right',
        class: '!w-full',
        placeholder: '请输入文件份数',
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'contractPrice',
      label: '合同金额',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 2,
        controlsPosition: 'right',
        class: '!w-full',
        placeholder: '请输入合同金额',
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === OaSealApplyType.CONTRACT,
      },
    },
    {
      fieldName: 'contractParty',
      label: '合同对方',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入合同对方',
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === OaSealApplyType.CONTRACT,
      },
    },
    {
      fieldName: 'expectedUseTime',
      label: '预计用印时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择预计用印时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'expectedReturnTime',
      label: '预计归还时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择预计归还时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
      dependencies: {
        triggerFields: ['mode'],
        show: (values) => values.mode === OaSealUseMode.BORROW,
      },
    },
    {
      fieldName: 'actualReturnTime',
      label: '实际归还时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择实际归还时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'urgent',
      label: '是否紧急',
      component: 'Switch',
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        rows: 2,
        maxlength: 500,
        showWordLimit: true,
        placeholder: '请输入备注',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'fileUrls',
      label: '附件',
      component: 'FileUpload',
      componentProps: {
        maxNumber: 5,
        showDescription: false,
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
      label: '单据编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入单据编号',
      },
    },
    {
      fieldName: 'sealId',
      label: '印章',
      component: markRaw(SealSelect),
    },
    {
      fieldName: 'status',
      label: '单据状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
          'number',
        ),
        clearable: true,
        placeholder: '请选择单据状态',
      },
    },
    {
      fieldName: 'type',
      label: '用印类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SEAL_APPLY_TYPE, 'number'),
        clearable: true,
        placeholder: '请选择用印类型',
      },
    },
    {
      fieldName: 'mode',
      label: '用印方式',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SEAL_USE_MODE, 'number'),
        clearable: true,
        placeholder: '请选择用印方式',
      },
    },
    {
      fieldName: 'useStatus',
      label: '用印状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SEAL_USE_STATUS, 'number'),
        clearable: true,
        placeholder: '请选择用印状态',
      },
    },
    {
      fieldName: 'urgent',
      label: '紧急',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
        clearable: true,
        placeholder: '请选择',
      },
    },
    {
      fieldName: 'expectedUseTime',
      label: '用印时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
    {
      fieldName: 'deptId',
      label: '申请部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        fieldNames: { label: 'name', value: 'id', children: 'children' },
        clearable: true,
        placeholder: '请选择申请部门',
        defaultExpandAll: true,
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
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
    {
      field: 'no',
      title: '单据编号',
      minWidth: 200,
      slots: { default: 'no' },
    },
    {
      field: 'status',
      title: '单据状态',
      width: 110,
      slots: { default: 'status' },
    },
    { field: 'sealNo', title: '印章编号', minWidth: 160 },
    {
      field: 'urgent',
      title: '紧急',
      width: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    { field: 'sealName', title: '印章', minWidth: 160 },
    { field: 'reason', title: '用印事由', minWidth: 180, showOverflow: true },
    {
      field: 'type',
      title: '用印类型',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_SEAL_APPLY_TYPE },
      },
    },
    {
      field: 'mode',
      title: '用印方式',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_SEAL_USE_MODE },
      },
    },
    {
      field: 'useStatus',
      title: '用印状态',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_SEAL_USE_STATUS },
      },
    },
    {
      field: 'expectedUseTime',
      title: '预计用印时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'expectedReturnTime',
      title: '预计归还时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    { field: 'keeperName', title: '保管人', width: 120 },
    { field: 'userName', title: '申请人', width: 120 },
    { field: 'deptName', title: '申请部门', width: 150 },
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

/** 用印申请详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'no',
      label: '申请单号',
    },
    {
      field: 'sealNo',
      label: '印章编号',
    },
    {
      field: 'sealName',
      label: '印章名称',
    },
    {
      field: 'sealType',
      label: '印章类型',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_SEAL_TYPE, value: value ?? '' }),
    },
    {
      field: 'keeperDeptName',
      label: '保管部门',
    },
    {
      field: 'keeperName',
      label: '保管人',
    },
    {
      field: 'userName',
      label: '申请人',
    },
    {
      field: 'deptName',
      label: '申请部门',
    },
    {
      field: 'reason',
      label: '用印事由',
    },
    {
      field: 'documentTitle',
      label: '文件标题',
    },
    {
      field: 'documentType',
      label: '文件类型',
    },
    {
      field: 'documentCount',
      label: '文件份数',
    },
    {
      field: 'contractPrice',
      label: '合同金额',
      show: (data) => data?.type === OaSealApplyType.CONTRACT,
    },
    {
      field: 'contractParty',
      label: '合同对方',
      show: (data) => data?.type === OaSealApplyType.CONTRACT,
    },
    {
      field: 'expectedUseTime',
      label: '预计用印时间',
      render: (value) => (value ? formatDate(value) : '-'),
    },
    {
      field: 'actualUseTime',
      label: '实际用印时间',
      render: (value) => (value ? formatDate(value) : '-'),
    },
    {
      field: 'expectedReturnTime',
      label: '预计归还时间',
      show: (data) => data?.mode === OaSealUseMode.BORROW,
      render: (value) => (value ? formatDate(value) : '-'),
    },
    {
      field: 'actualReturnTime',
      label: '实际归还时间',
      show: (data) => data?.mode === OaSealUseMode.BORROW,
      render: (value) => (value ? formatDate(value) : '-'),
    },
    {
      field: 'remark',
      label: '备注',
    },
    {
      field: 'status',
      label: '审批状态',
      slot: 'status',
    },
    {
      field: 'useStatus',
      label: '用印状态',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_SEAL_USE_STATUS, value: value ?? '' }),
    },
    {
      field: 'type',
      label: '用印类型',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_SEAL_APPLY_TYPE, value: value ?? '' }),
    },
    {
      field: 'mode',
      label: '用印方式',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_SEAL_USE_MODE, value: value ?? '' }),
    },
    {
      field: 'urgent',
      label: '紧急',
      render: (value) =>
        h(DictTag, {
          type: DICT_TYPE.INFRA_BOOLEAN_STRING,
          value: value ?? '',
        }),
    },
    {
      field: 'fileUrls',
      label: '附件',
      span: 2,
      slot: 'fileUrls',
    },
  ];
}
