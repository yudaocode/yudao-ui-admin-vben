import type { VxeTableGridOptions } from '#/adapter/vxe-table';

/** 新建员工字段配置列表 */
export function useCreateFieldGridColumns(): VxeTableGridOptions<any>['columns'] {
  return [
    { field: 'groupName', title: '字段分组', width: 180 },
    { field: 'title', title: '字段名称', minWidth: 200 },
    {
      title: '新建在职员工',
      width: 180,
      slots: { default: 'activeVisible' },
    },
    {
      title: '新建待入职员工',
      width: 180,
      slots: { default: 'pendingEntryVisible' },
    },
  ];
}

/** 员工档案字段配置列表 */
export function useArchiveFieldGridColumns(): VxeTableGridOptions<any>['columns'] {
  return [
    { field: 'groupName', title: '字段分组', width: 180 },
    { field: 'title', title: '字段名称', minWidth: 200 },
    {
      title: '员工是否可见',
      width: 160,
      slots: { default: 'visible' },
    },
    {
      title: '员工是否可编辑',
      width: 160,
      slots: { default: 'editable' },
    },
  ];
}
