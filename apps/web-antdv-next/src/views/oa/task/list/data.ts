import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h, markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { z } from '#/adapter/form';
import { DictTag } from '#/components/dict-tag';
import { getRangePickerDefaultProps } from '#/utils';
import { OA_TASK_STATUS, OA_TASK_TYPE } from '#/views/oa/utils/constants';
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
      label: '任务标题',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        showCount: true,
        placeholder: '请输入任务标题',
      },
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'type',
      label: '任务类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_TASK_TYPE, 'number'),
        placeholder: '请选择任务类型',
      },
      rules: z.number().default(OA_TASK_TYPE.WORK),
    },
    {
      fieldName: 'receiverUserIds',
      label: '接收人',
      component: markRaw(UserSelect),
      componentProps: {
        multiple: true,
        placeholder: '请选择任务接收人',
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '任务状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_TASK_STATUS, 'number'),
        placeholder: '请选择任务状态',
      },
      rules: z.number().default(OA_TASK_STATUS.NEW),
    },
    {
      fieldName: 'top',
      label: '置顶',
      component: 'Switch',
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'canceled',
      label: '取消',
      component: 'Switch',
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        placeholder: '请选择开始时间',
      },
      rules: 'required',
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        placeholder: '请选择结束时间',
      },
      rules: 'required',
    },
    {
      fieldName: 'description',
      label: '任务描述',
      component: 'Textarea',
      componentProps: {
        rows: 5,
        maxlength: 2000,
        showCount: true,
        placeholder: '请输入任务描述',
      },
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'comment',
      label: '任务评价',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        maxlength: 1000,
        showCount: true,
        placeholder: '请输入任务评价',
      },
      formItemClass: 'col-span-2',
    },
  ];
}

/** 新增反馈的表单 */
export function useFeedbackFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'taskId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'publisher',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'status',
      label: '任务状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_TASK_STATUS, 'number'),
        placeholder: '请选择任务状态',
      },
      rules: 'required',
    },
    {
      fieldName: 'content',
      label: '反馈内容',
      component: 'Textarea',
      componentProps: {
        rows: 5,
        maxlength: 1000,
        showCount: true,
        placeholder: '请输入任务反馈',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'title',
      label: '任务标题',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入任务标题',
      },
    },
    {
      fieldName: 'type',
      label: '任务类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_TASK_TYPE, 'number'),
        allowClear: true,
        placeholder: '请选择类型',
      },
    },
    {
      fieldName: 'status',
      label: '任务状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_TASK_STATUS, 'number'),
        allowClear: true,
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'canceled',
      label: '取消状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '正常', value: false },
          { label: '已取消', value: true },
        ],
        allowClear: true,
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'publishTime',
      label: '发布时间',
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
      field: 'title',
      title: '任务标题',
      minWidth: 200,
      slots: { default: 'title' },
    },
    {
      field: 'type',
      title: '类型',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_TASK_TYPE },
      },
    },
    {
      field: 'receivers',
      title: '接收人',
      minWidth: 160,
      slots: { default: 'receivers' },
    },
    {
      field: 'status',
      title: '总体状态',
      width: 105,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_TASK_STATUS },
      },
    },
    {
      title: '进度',
      minWidth: 150,
      slots: { default: 'statusProgress' },
    },
    {
      title: '任务周期',
      minWidth: 220,
      slots: { default: 'period' },
    },
    {
      field: 'canceled',
      title: '取消状态',
      width: 90,
      slots: { default: 'canceledTag' },
    },
    {
      field: 'publishTime',
      title: '发布时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 任务详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'title',
      label: '任务标题',
      span: 2,
    },
    {
      field: 'publisherUserName',
      label: '发布人',
      render: (value) => value || '-',
    },
    {
      field: 'publisherDeptName',
      label: '发布部门',
      render: (value) => value || '-',
    },
    {
      field: 'type',
      label: '任务类型',
      render: (value) => h(DictTag, { type: DICT_TYPE.OA_TASK_TYPE, value }),
    },
    {
      field: 'status',
      label: '总体状态',
      render: (value) => h(DictTag, { type: DICT_TYPE.OA_TASK_STATUS, value }),
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
      field: 'top',
      label: '是否置顶',
      render: (value) =>
        h(DictTag, {
          type: DICT_TYPE.INFRA_BOOLEAN_STRING,
          value: value ?? false,
        }),
    },
    {
      field: 'canceled',
      label: '是否取消',
      render: (value) =>
        h(DictTag, {
          type: DICT_TYPE.INFRA_BOOLEAN_STRING,
          value: value ?? false,
        }),
    },
    {
      field: 'description',
      label: '任务描述',
      span: 2,
      slot: 'description',
    },
    {
      field: 'comment',
      label: '任务评价',
      span: 2,
      slot: 'comment',
    },
  ];
}

/** 接收人状态的表格列配置 */
export function useReceiverGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'userName',
      title: '接收人',
      minWidth: 120,
    },
    {
      field: 'deptName',
      title: '部门',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '状态',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_TASK_STATUS },
      },
    },
    {
      title: '进度',
      minWidth: 180,
      slots: { default: 'statusProgress' },
    },
    {
      field: 'updateTime',
      title: '更新时间',
      width: 180,
      formatter: 'formatDateTime',
    },
  ];
}

/** 反馈日志的表格列配置 */
export function useLogGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'userName',
      title: '反馈人',
      width: 120,
    },
    {
      field: 'status',
      title: '任务状态',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_TASK_STATUS },
      },
    },
    {
      field: 'content',
      title: '反馈内容',
      minWidth: 260,
      slots: { default: 'content' },
    },
    {
      field: 'createTime',
      title: '反馈时间',
      width: 180,
      formatter: 'formatDateTime',
    },
  ];
}
