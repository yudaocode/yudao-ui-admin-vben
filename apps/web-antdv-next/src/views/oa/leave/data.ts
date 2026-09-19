import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { DictTag } from '#/components/dict-tag';

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
        showCount: true,
        placeholder: '请输入标题',
      },
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
      fieldName: 'type',
      label: '请假类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_LEAVE_TYPE, 'number'),
        placeholder: '请选择请假类型',
      },
      rules: 'required',
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择开始时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择结束时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
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
        showCount: true,
        placeholder: '请输入申请原因',
      },
      rules: 'required',
    },
    {
      fieldName: 'fileUrls',
      label: '附件',
      component: 'FileUpload',
      componentProps: {
        showDescription: false,
      },
    },
    {
      fieldName: 'days',
      label: '天数',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
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
        allowClear: true,
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
        allowClear: true,
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
      width: 220,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 请假申请详情的字段 */
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
        h(DictTag, { type: DICT_TYPE.OA_APPLY_URGENCY, value: value ?? '' }),
    },
    {
      field: 'type',
      label: '请假类型',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_LEAVE_TYPE, value: value ?? '' }),
    },
    {
      field: 'startTime',
      label: '开始时间',
      render: (value) => formatDateTime(value) || '-',
    },
    {
      field: 'endTime',
      label: '结束时间',
      render: (value) => formatDateTime(value) || '-',
    },
    {
      field: 'reason',
      label: '申请原因',
      span: 2,
      slot: 'reason',
    },
    {
      field: 'fileUrls',
      label: '附件',
      span: 2,
      slot: 'fileUrls',
    },
    {
      field: 'days',
      label: '天数',
      render: (value) =>
        value === undefined || value === null ? '-' : `${value} 天`,
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
