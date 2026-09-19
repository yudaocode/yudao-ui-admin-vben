import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h, markRaw } from 'vue';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { z } from '#/adapter/form';
import { DictTag } from '#/components/dict-tag';
import { UserSelect } from '#/views/system/user/components';

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
      fieldName: 'title',
      label: '标题',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        showWordLimit: true,
        placeholder: '请输入标题',
      },
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'urgency',
      label: '紧急程度',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_APPLY_URGENCY, 'number'),
        placeholder: '请选择紧急程度',
      },
      rules: 'required',
    },
    {
      fieldName: 'witnessUserId',
      label: '证明人',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择证明人',
      },
      rules: 'required',
    },
    {
      fieldName: 'customerName',
      label: '相关客户',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入相关客户',
      },
      rules: 'required',
    },
    {
      fieldName: 'paymentMethod',
      label: '报销方式',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.OA_REIMBURSEMENT_PAYMENT_METHOD,
          'number',
        ),
        placeholder: '请选择报销方式',
      },
      rules: 'required',
    },
    {
      fieldName: 'reason',
      label: '申请原因',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        maxlength: 5000,
        placeholder: '请输入申请原因',
      },
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'fileUrls',
      label: '附件',
      component: 'FileUpload',
      componentProps: {
        maxNumber: 5,
        maxSize: 5,
        multiple: true,
      },
      formItemClass: 'col-span-2',
      defaultValue: [],
    },
    {
      fieldName: 'items',
      label: '报销明细',
      component: 'Input',
      formItemClass: 'col-span-2',
      defaultValue: [],
      rules: z
        .array(z.record(z.string(), z.any()))
        .refine((items) => items.every((item) => item.description?.trim()), {
          message: '费用说明不能为空',
        }),
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'title',
      label: '标题',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入标题',
      },
    },
    {
      fieldName: 'status',
      label: '审批状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '未提交', value: BpmProcessInstanceStatus.NOT_START },
          ...getDictOptions(
            DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
            'number',
          ).filter((item) => item.value !== BpmProcessInstanceStatus.NOT_START),
        ],
        clearable: true,
        placeholder: '请选择审批状态',
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'title',
      title: '标题',
      minWidth: 240,
      slots: { default: 'title' },
    },
    {
      field: 'urgency',
      title: '紧急程度',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_APPLY_URGENCY },
      },
    },
    {
      field: 'creatorName',
      title: '申请人',
      width: 120,
    },
    {
      field: 'createTime',
      title: '申请时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'status',
      title: '审批状态',
      width: 110,
      slots: { default: 'status' },
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 报销明细的表格列配置 */
export function useFormItemColumns(
  disabled?: boolean,
): VxeTableGridOptions['columns'] {
  const columns: VxeTableGridOptions['columns'] = [
    {
      type: 'seq',
      title: '序号',
      width: 60,
    },
    {
      field: 'expenseTime',
      title: '费用发生时间',
      minWidth: 210,
      slots: { default: 'expenseTime' },
    },
    {
      field: 'expenseType',
      title: '费用类型',
      minWidth: 160,
      slots: { default: 'expenseType' },
    },
    {
      field: 'description',
      title: '费用说明',
      minWidth: 160,
      slots: { default: 'description' },
    },
    {
      field: 'invoiceCount',
      title: '票据张数',
      minWidth: 160,
      slots: { default: 'invoiceCount' },
    },
    {
      field: 'price',
      title: '报销金额',
      minWidth: 160,
      slots: { default: 'price' },
    },
  ];
  // 详情展示时不提供删除操作
  if (!disabled) {
    columns.push({
      title: '操作',
      width: 75,
      fixed: 'right',
      slots: { default: 'actions' },
    });
  }
  return columns;
}

/** 费用报销详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'title',
      label: '标题',
      span: 2,
    },
    {
      field: 'urgency',
      label: '紧急程度',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_APPLY_URGENCY, value }),
    },
    {
      field: 'witnessUserId',
      label: '证明人',
      slot: 'witnessUserId',
    },
    {
      field: 'customerName',
      label: '相关客户',
    },
    {
      field: 'paymentMethod',
      label: '报销方式',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_REIMBURSEMENT_PAYMENT_METHOD, value }),
    },
    {
      field: 'fileUrls',
      label: '附件',
      span: 2,
      slot: 'fileUrls',
    },
    {
      field: 'reason',
      label: '申请原因',
      span: 2,
      slot: 'reason',
    },
    {
      field: 'creatorName',
      label: '申请人',
    },
    {
      field: 'createTime',
      label: '申请时间',
      render: (value) => formatDateTime(value) || '-',
    },
    {
      field: 'status',
      label: '审批状态',
      slot: 'status',
    },
  ];
}
