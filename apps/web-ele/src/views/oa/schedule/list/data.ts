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
import { OA_PRIORITY, OA_SCHEDULE_TYPE } from '#/views/oa/utils/constants';
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
      fieldName: 'type',
      label: '日程类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SCHEDULE_TYPE, 'number'),
        placeholder: '请选择日程类型',
      },
      rules: z.number().default(OA_SCHEDULE_TYPE.REMINDER),
    },
    {
      fieldName: 'priority',
      label: '优先级',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PRIORITY, 'number'),
        placeholder: '请选择优先级',
      },
      rules: z.number().default(OA_PRIORITY.NORMAL),
    },
    {
      fieldName: 'title',
      label: '日程标题',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        showWordLimit: true,
        placeholder: '请输入日程标题',
      },
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'DatePicker',
      componentProps: {
        type: 'datetime',
        valueFormat: 'x',
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择开始时间',
        clearable: true,
      },
      rules: 'required',
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'DatePicker',
      componentProps: {
        type: 'datetime',
        valueFormat: 'x',
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择结束时间',
        clearable: true,
      },
      rules: 'required',
    },
    {
      fieldName: 'participantUserIds',
      label: '参与人',
      component: markRaw(UserSelect),
      componentProps: {
        multiple: true,
        placeholder: '请选择参与人',
      },
      defaultValue: [],
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'remind',
      label: '日程提醒',
      component: 'Switch',
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'description',
      label: '日程描述',
      component: 'Textarea',
      componentProps: {
        maxlength: 1000,
        rows: 4,
        placeholder: '请输入日程描述',
      },
      formItemClass: 'col-span-2',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(
  onScopeChange?: () => void,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'includeMine',
      label: '日程范围',
      component: 'Checkbox',
      componentProps: {
        // 勾选日程范围后立即查询
        onChange: () => onScopeChange?.(),
      },
      defaultValue: true,
      renderComponentContent: () => ({
        default: () => ['我的日程'],
      }),
    },
    {
      fieldName: 'includeReceived',
      component: 'Checkbox',
      componentProps: {
        // 勾选日程范围后立即查询
        onChange: () => onScopeChange?.(),
      },
      defaultValue: true,
      renderComponentContent: () => ({
        default: () => ['共享给我'],
      }),
    },
    {
      fieldName: 'title',
      label: '标题',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入日程标题',
      },
    },
    {
      fieldName: 'type',
      label: '日程类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_SCHEDULE_TYPE, 'number'),
        clearable: true,
        placeholder: '请选择日程类型',
      },
    },
    {
      fieldName: 'priority',
      label: '优先级',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PRIORITY, 'number'),
        clearable: true,
        placeholder: '请选择优先级',
      },
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
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
      field: 'title',
      title: '标题',
      minWidth: 180,
      slots: { default: 'title' },
    },
    {
      field: 'type',
      title: '类型',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_SCHEDULE_TYPE },
      },
    },
    {
      field: 'priority',
      title: '优先级',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_PRIORITY },
      },
    },
    {
      field: 'startTime',
      title: '开始时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '结束时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'participantUserNames',
      title: '参与人',
      minWidth: 150,
      formatter: ({ row }) => row.participantUserNames?.join('、') || '-',
    },
    {
      field: 'creatorName',
      title: '发布人',
      minWidth: 100,
    },
    {
      field: 'creatorDeptName',
      title: '部门',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '发布时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'remind',
      title: '提醒',
      width: 70,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}

/** 日程详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'title',
      label: '日程标题',
    },
    {
      field: 'creatorName',
      label: '创建人',
    },
    {
      field: 'type',
      label: '日程类型',
      render: (value) => h(DictTag, { type: DICT_TYPE.OA_SCHEDULE_TYPE, value }),
    },
    {
      field: 'priority',
      label: '优先级',
      render: (value) => h(DictTag, { type: DICT_TYPE.OA_PRIORITY, value }),
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
      field: 'remind',
      label: '日程提醒',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.INFRA_BOOLEAN_STRING, value }),
    },
    {
      field: 'description',
      label: '日程描述',
      render: (value) =>
        h('div', { class: 'whitespace-pre-wrap break-words' }, value || '-'),
    },
  ];
}
