import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { markRaw } from 'vue';

import { z } from '#/adapter/form';
import {
  PmsProjectLevel,
  PmsProjectSortType,
  PmsProjectType,
} from '#/views/pms/pm/utils/constants';
import { UserSelect } from '#/views/system/user/components';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '项目名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入项目名称',
      },
    },
    {
      fieldName: 'sortType',
      label: '排序方式',
      component: 'Select',
      componentProps: {
        options: [
          { label: '按访问时间', value: PmsProjectSortType.ACCESS_TIME },
          { label: '按创建时间', value: PmsProjectSortType.CREATE_TIME },
        ],
      },
    },
    {
      fieldName: 'groupId',
      label: '个人分组',
      component: 'Select',
      componentProps: {
        allowClear: true,
        placeholder: '请选择个人分组',
      },
      dependencies: {
        // 默认隐藏，页面根据项目范围通过 updateSchema 控制显隐
        triggerFields: ['name'],
        if: () => false,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(
  showFavorite: boolean,
): VxeTableGridOptions<PmsProjectApi.Project>['columns'] {
  return [
    {
      field: 'name',
      title: '项目名称',
      minWidth: 220,
      fixed: 'left',
      slots: { default: 'name' },
    },
    {
      field: 'completion',
      title: '完成度',
      width: 200,
      slots: { default: 'completion' },
    },
    {
      field: 'endTime',
      title: '截止时间',
      width: 140,
      align: 'center',
      slots: { default: 'endTime' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 170,
      align: 'center',
      formatter: 'formatDateTime',
    },
    {
      field: 'adminNames',
      title: '管理员',
      width: 140,
      slots: { default: 'adminNames' },
    },
    ...(showFavorite
      ? [
          {
            field: 'favoriteStatus',
            title: '星标',
            width: 72,
            align: 'center' as const,
            slots: { default: 'favoriteStatus' },
          },
        ]
      : []),
    {
      title: '操作',
      width: 76,
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 校验项目时间范围：开始时间必须早于截止时间 */
function validateProjectTimeRange(startTime: unknown, endTime: unknown) {
  return z
    .any()
    .refine(
      () => !startTime || !endTime || Number(startTime) < Number(endTime),
      '开始时间必须早于截止时间',
    )
    .optional();
}

/** 新增/修改的表单 */
export function useProjectFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'id',
    },
    {
      component: 'InputNumber',
      defaultValue: PmsProjectLevel.NORMAL,
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'level',
    },
    {
      component: 'RadioGroup',
      defaultValue: PmsProjectType.GENERAL,
      dependencies: {
        show: (values) => !values.id,
        triggerFields: ['id'],
      },
      fieldName: 'type',
      label: '项目类型',
      rules: z.number({ message: '请选择项目类型' }),
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        maxlength: 31,
        placeholder: '请输入项目名称',
        showCount: true,
      },
      defaultValue: '',
      fieldName: 'name',
      formItemClass: 'col-span-1',
      label: '项目名称',
      rules: z.string({ message: '请输入项目名称' }).min(1, '请输入项目名称'),
    },
    {
      component: 'IconPicker',
      componentProps: {
        allowClear: true,
      },
      defaultValue: 'lucide:folder',
      fieldName: 'icon',
      formItemClass: 'col-span-1',
      label: '项目封面',
      rules: z.string({ message: '请选择项目封面' }).min(1, '请选择项目封面'),
    },
    {
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择开始时间',
        showTime: true,
        valueFormat: 'x',
      },
      dependencies: {
        rules: (values) =>
          validateProjectTimeRange(values.startTime, values.endTime),
        triggerFields: ['startTime', 'endTime'],
      },
      fieldName: 'startTime',
      formItemClass: 'col-span-1',
      label: '开始时间',
    },
    {
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择截止时间',
        showTime: true,
        valueFormat: 'x',
      },
      dependencies: {
        rules: (values) =>
          validateProjectTimeRange(values.startTime, values.endTime),
        triggerFields: ['startTime', 'endTime'],
      },
      fieldName: 'endTime',
      formItemClass: 'col-span-1',
      label: '截止时间',
    },
    {
      component: 'TextArea',
      componentProps: {
        maxlength: 500,
        placeholder: '请输入项目描述',
        rows: 3,
        showCount: true,
      },
      defaultValue: '',
      fieldName: 'description',
      label: '项目描述',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '私有：只有项目成员可以查看', value: false },
          { label: '公开：所有人可查看，只有项目成员可以编辑', value: true },
        ],
      },
      defaultValue: false,
      fieldName: 'openStatus',
      label: '可见范围',
      rules: z.boolean({ message: '请选择项目可见范围' }),
    },
    {
      component: markRaw(UserSelect),
      componentProps: {
        multiple: true,
        placeholder: '请选择项目成员；创建人会自动加入',
      },
      defaultValue: [],
      dependencies: {
        show: (values) => !values.id && !values.openStatus,
        triggerFields: ['id', 'openStatus'],
      },
      fieldName: 'memberUserIds',
      label: '项目成员',
    },
  ];
}
