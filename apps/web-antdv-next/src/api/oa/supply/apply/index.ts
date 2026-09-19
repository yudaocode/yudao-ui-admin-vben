import type { PageParam, PageResult } from '@vben/request';

import type { OaSupplyIssueApi } from '#/api/oa/supply/issue';

import { requestClient } from '#/api/request';

export namespace OaSupplyApplyApi {
  /** OA 办公用品领用申请 */
  export interface SupplyApply {
    id?: number; // 编号
    applyTime?: string; // 领用日期
    useType?: number; // 使用类型
    pickupMethod?: number; // 领取方式
    reason?: string; // 申请事由
    fileUrls: string[]; // 附件地址列表
    remark?: string; // 备注
    no?: string; // 申请单号
    creator?: string; // 申请人编号
    creatorName?: string; // 申请人
    deptId?: number; // 申请部门编号
    deptName?: string; // 申请部门
    status?: number; // 单据状态
    processInstanceId?: string; // 流程实例编号
    createTime?: string; // 创建时间
    items?: OaSupplyIssueApi.SupplyApplyItem[]; // 领用明细
  }
}

/** 查询本人领用申请分页 */
export function getSupplyApplyPage(params: PageParam) {
  return requestClient.get<PageResult<OaSupplyApplyApi.SupplyApply>>(
    '/oa/supply-apply/page',
    { params },
  );
}

/** 查询领用申请详情 */
export function getSupplyApply(id: number) {
  return requestClient.get<OaSupplyApplyApi.SupplyApply>(
    '/oa/supply-apply/get',
    { params: { id } },
  );
}

/** 新增领用申请 */
export function createSupplyApply(data: Partial<OaSupplyApplyApi.SupplyApply>) {
  return requestClient.post<number>('/oa/supply-apply/create', data);
}

/** 修改领用申请 */
export function updateSupplyApply(data: Partial<OaSupplyApplyApi.SupplyApply>) {
  return requestClient.put<boolean>('/oa/supply-apply/update', data);
}

/** 删除领用申请 */
export function deleteSupplyApply(id: number) {
  return requestClient.delete<boolean>('/oa/supply-apply/delete', {
    params: { id },
  });
}

/** 提交领用申请 */
export function submitSupplyApply(id: number) {
  return requestClient.put<boolean>('/oa/supply-apply/submit', null, {
    params: { id },
  });
}

/** 取消领用申请 */
export function cancelSupplyApply(id: number) {
  return requestClient.put<boolean>('/oa/supply-apply/cancel', null, {
    params: { id },
  });
}
