import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ReportUReportFileApi {
  /** UReport2 报表模板 */
  export interface UReportFile {
    id: number;
    name: string; // 模板名称，不包含存储前缀
    createTime: Date;
    updateTime: Date;
  }
}

/** UReport2 的设计器、预览页使用登录租户，所以列表、删除也不设置 visit-tenant-id 访问租户，保持一致 */
const headers = { isVisitTenant: false };

/** 查询 UReport2 报表模板分页 */
export function getUReportFilePage(params: PageParam) {
  return requestClient.get<PageResult<ReportUReportFileApi.UReportFile>>(
    '/report/ureport2/file/page',
    { params, headers },
  );
}

/** 删除 UReport2 报表模板 */
export function deleteUReportFile(id: number) {
  return requestClient.delete(`/report/ureport2/file/delete?id=${id}`, {
    headers,
  });
}
