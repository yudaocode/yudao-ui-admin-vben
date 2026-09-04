import type { VxeTableGridOptions } from '#/adapter/vxe-table';

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<any>['columns'] {
  return [
    { type: 'seq', title: '序号', width: 80, align: 'center' },
    {
      field: 'reason',
      title: '淘汰原因',
      minWidth: 320,
      slots: { default: 'reason' },
    },
    {
      title: '操作',
      width: 100,
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}

/** 校验并整理待保存的淘汰原因 */
export function parseRecruitEliminateReasons(rows: any[]): {
  error?: string;
  reasons?: string[];
} {
  const reasons = rows.map((row) => row.reason.trim());
  if (reasons.some((reason) => !reason)) {
    return { error: '淘汰原因不能为空' };
  }
  if (new Set(reasons).size !== reasons.length) {
    return { error: '淘汰原因不能重复' };
  }
  return { reasons };
}
