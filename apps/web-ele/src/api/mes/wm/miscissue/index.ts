import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmMiscIssueApi {
  /** MES 杂项出库单 */
  export interface MiscIssue {
    id?: number; // 编号
    code?: string; // 出库单编号
    name?: string; // 出库单名称
    type?: number; // 业务类型
    sourceDocType?: string; // 来源单据类型
    sourceDocId?: number; // 来源单据编号
    sourceDocCode?: string; // 来源单据编码
    issueDate?: number; // 出库日期
    status?: number; // 单据状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询杂项出库单分页 */
export function getMiscIssuePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmMiscIssueApi.MiscIssue>>(
    '/mes/wm/misc-issue/page',
    { params },
  );
}

/** 查询杂项出库单详情 */
export function getMiscIssue(id: number) {
  return requestClient.get<MesWmMiscIssueApi.MiscIssue>(
    `/mes/wm/misc-issue/get?id=${id}`,
  );
}

/** 新增杂项出库单 */
export function createMiscIssue(data: MesWmMiscIssueApi.MiscIssue) {
  return requestClient.post<number>('/mes/wm/misc-issue/create', data);
}

/** 修改杂项出库单 */
export function updateMiscIssue(data: MesWmMiscIssueApi.MiscIssue) {
  return requestClient.put('/mes/wm/misc-issue/update', data);
}

/** 删除杂项出库单 */
export function deleteMiscIssue(id: number) {
  return requestClient.delete(`/mes/wm/misc-issue/delete?id=${id}`);
}

/** 提交杂项出库单 */
export function submitMiscIssue(id: number) {
  return requestClient.put(`/mes/wm/misc-issue/submit?id=${id}`);
}

/** 执行出库 */
export function finishMiscIssue(id: number) {
  return requestClient.put(`/mes/wm/misc-issue/finish?id=${id}`);
}

/** 取消杂项出库单 */
export function cancelMiscIssue(id: number) {
  return requestClient.put(`/mes/wm/misc-issue/cancel?id=${id}`);
}

/** 导出杂项出库单 */
export function exportMiscIssue(params: any) {
  return requestClient.download('/mes/wm/misc-issue/export-excel', { params });
}
