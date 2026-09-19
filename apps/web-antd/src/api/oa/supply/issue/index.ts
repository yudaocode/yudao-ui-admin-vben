import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaSupplyIssueApi {
  /** OA 办公用品领用明细 */
  export interface SupplyApplyItem {
    id?: number; // 编号
    applyId?: number; // 申请编号
    itemId?: number; // 用品编号
    itemName?: string; // 物品名称
    model?: string; // 规格型号
    unit?: string; // 计量单位
    manageType?: number; // 管理类型
    applyQuantity?: number; // 申请数量
    issuedQuantity?: number; // 实发数量
    returnedQuantity?: number; // 已归还数量
    status?: number; // 状态
    issueUserId?: number; // 发放人编号
    issueUserName?: string; // 发放人
    issueTime?: string; // 发放时间
    issueRemark?: string; // 发放备注
    returnRemark?: string; // 归还备注
    no?: string; // 申请单号
    creatorName?: string; // 申请人
    deptName?: string; // 申请部门
    useType?: number; // 使用类型
    createTime?: string; // 申请时间
  }
}

/** 查询领用发放分页 */
export function getSupplyApplyItemPage(params: PageParam) {
  return requestClient.get<PageResult<OaSupplyIssueApi.SupplyApplyItem>>(
    '/oa/supply-issue/page',
    { params },
  );
}

/** 发放用品 */
export function issueSupplyApplyItem(
  data: Partial<OaSupplyIssueApi.SupplyApplyItem>,
) {
  return requestClient.put<boolean>('/oa/supply-issue/issue', data);
}

/** 确认归还用品 */
export function returnSupplyApplyItem(
  id: number,
  quantity: number,
  returnRemark?: string,
) {
  return requestClient.put<boolean>('/oa/supply-issue/return', {
    id,
    quantity,
    returnRemark,
  });
}
