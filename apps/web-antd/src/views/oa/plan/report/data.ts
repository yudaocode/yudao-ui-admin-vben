import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import dayjs from 'dayjs';

import { z } from '#/adapter/form';
import { OA_PLAN_TYPE } from '#/views/oa/utils/constants';

/** 报表搜索表单的事件回调 */
interface ReportFormEvents {
  /** 切换计划类型 */
  onTypeChange: () => void;
  /** 选择统计日期 */
  onPeriodDateChange: (date: unknown) => void;
}

/** 列表的搜索表单 */
export function useGridFormSchema(events: ReportFormEvents): VbenFormSchema[] {
  return [
    {
      fieldName: 'userName',
      label: '成员姓名',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入成员姓名',
      },
    },
    {
      fieldName: 'type',
      label: '计划类型',
      component: 'RadioGroup',
      defaultValue: OA_PLAN_TYPE.DAY,
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.OA_PLAN_TYPE, 'number'),
        onChange: () => events.onTypeChange(),
      },
    },
    {
      fieldName: 'periodDate',
      label: '统计周期',
      component: 'DatePicker',
      defaultValue: dayjs().format('YYYY-MM-DD'),
      componentProps: {
        allowClear: false,
        valueFormat: 'YYYY-MM-DD',
        placeholder: '请选择统计日期',
        class: 'w-full',
        onChange: (date: unknown) => events.onPeriodDateChange(date),
      },
      dependencies: {
        triggerFields: ['type'],
        componentProps: (values) => ({
          picker: values.type === OA_PLAN_TYPE.MONTH ? 'month' : 'date',
          format: values.type === OA_PLAN_TYPE.MONTH ? 'YYYY-MM' : 'YYYY-MM-DD',
        }),
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'deptName',
      title: '部门',
      minWidth: 120,
    },
    {
      field: 'userName',
      title: '成员',
      minWidth: 110,
    },
    {
      field: 'title',
      title: '计划',
      minWidth: 260,
      slots: { default: 'planInfo' },
    },
    {
      field: 'status',
      title: '状态',
      width: 90,
      slots: { default: 'statusTag' },
    },
    {
      field: 'summary',
      title: '总结',
      minWidth: 180,
    },
    {
      field: 'comment',
      title: '点评',
      minWidth: 180,
      slots: { default: 'commentText' },
    },
    {
      title: '操作',
      width: 90,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 点评的表单 */
export function useCommentFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'comment',
      label: '点评内容',
      component: 'Textarea',
      componentProps: {
        rows: 5,
        maxlength: 1000,
        showCount: true,
        placeholder: '请输入本次点评内容',
      },
      rules: z.string().trim().min(1, '点评内容不能为空'),
    },
  ];
}
