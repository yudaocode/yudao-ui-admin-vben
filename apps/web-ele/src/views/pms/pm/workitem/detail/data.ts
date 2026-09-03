import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';

/** 列表的字段 */
export function useColumns(
  editable: boolean,
): VxeTableGridOptions<PmsWorkItemApi.WorkItem>['columns'] {
  return [
    {
      field: 'status',
      title: '完成',
      width: 64,
      align: 'center',
      slots: { default: 'completed' },
    },
    {
      field: 'name',
      title: '标题',
      minWidth: 240,
      slots: { default: 'name' },
    },
    {
      field: 'statusName',
      title: '状态',
      width: 120,
    },
    {
      field: 'assigneeUserName',
      title: '负责人',
      width: 110,
    },
    {
      title: '操作',
      width: 120,
      align: 'center',
      visible: editable,
      slots: { default: 'action' },
    },
  ];
}
