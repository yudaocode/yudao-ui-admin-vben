import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { PmsProjectSortType } from '#/views/pms/pm/utils/constants';

/** 列表的搜索表单 */
// TODO @AI：命名对齐 system user，改成 useGridFormSchema；iteration/recycle/workbench 等也有 useSearchFormSchema，一并统一。
export function useSearchFormSchema(): VbenFormSchema[] {
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
