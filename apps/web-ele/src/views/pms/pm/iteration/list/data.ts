import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsIterationApi } from '#/api/pms/pm/iteration';

import { DICT_TYPE } from '@vben/constants';

import { z } from '#/adapter/form';
import { PmsIterationStatus } from '#/views/pms/pm/utils/constants';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '搜索迭代',
      },
    },
    {
      fieldName: 'status',
      label: '迭代状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          { label: '未开始', value: PmsIterationStatus.PLANNED },
          { label: '进行中', value: PmsIterationStatus.ACTIVE },
          { label: '已完成', value: PmsIterationStatus.COMPLETED },
        ],
        placeholder: '全部状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(
  editable: boolean,
): VxeTableGridOptions<PmsIterationApi.Iteration>['columns'] {
  return [
    {
      field: 'id',
      title: '引用 ID',
      width: 90,
      slots: { default: 'id' },
    },
    {
      field: 'name',
      title: '迭代名称',
      minWidth: 200,
      slots: { default: 'name' },
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
      field: 'status',
      title: '状态',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PMS_ITERATION_STATUS },
      },
    },
    {
      field: 'progress',
      title: '进度',
      width: 160,
      align: 'center',
      slots: { default: 'progress' },
    },
    {
      field: 'ownerUserName',
      title: '负责人',
      minWidth: 110,
    },
    ...(editable
      ? [
          {
            title: '操作',
            width: 90,
            align: 'center' as const,
            fixed: 'right' as const,
            slots: { default: 'actions' },
          },
        ]
      : []),
  ];
}

/** 开始迭代的表单 */
export function useIterationStartFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'DatePicker',
      componentProps: {
        type: 'datetimerange',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
        rangeSeparator: '至',
        valueFormat: 'x',
      },
      fieldName: 'timeRange',
      label: '迭代周期',
      rules: 'required',
    },
  ];
}

/** 新增/修改迭代的表单 */
export function useIterationFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '迭代名称',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '请输入迭代名称',
      },
      rules: z.string().min(1, '迭代名称不能为空'),
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'DatePicker',
      componentProps: {
        allowClear: true,
        placeholder: '请选择开始时间',
        showTime: true,
        valueFormat: 'x',
      },
      dependencies: {
        rules: (values) =>
          z
            .any()
            .refine(
              () =>
                !values.startTime ||
                !values.endTime ||
                Number(values.startTime) < Number(values.endTime),
              '迭代开始时间必须早于结束时间',
            ),
        triggerFields: ['startTime', 'endTime'],
      },
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'DatePicker',
      componentProps: {
        allowClear: true,
        placeholder: '请选择结束时间',
        showTime: true,
        valueFormat: 'x',
      },
      dependencies: {
        rules: (values) =>
          z
            .any()
            .refine(
              () =>
                !values.startTime ||
                !values.endTime ||
                Number(values.startTime) < Number(values.endTime),
              '迭代开始时间必须早于结束时间',
            ),
        triggerFields: ['startTime', 'endTime'],
      },
    },
    {
      fieldName: 'target',
      label: '迭代目标',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入迭代目标',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'ownerUserId',
      label: '负责人',
      component: 'Select',
      componentProps: {
        allowClear: true,
        optionFilterProp: 'label',
        placeholder: '请选择项目成员',
        showSearch: true,
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'description',
      label: '迭代描述',
      component: 'Textarea',
      componentProps: {
        maxlength: 2000,
        placeholder: '请输入迭代描述',
        rows: 4,
        showCount: true,
      },
      formItemClass: 'col-span-2',
    },
  ];
}
