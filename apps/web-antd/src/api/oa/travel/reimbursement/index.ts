import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaTravelReimbursementApi {
  /** OA 出差报销 */
  export interface TravelReimbursement {
    id?: number; // 编号
    no?: string; // 单据编号
    reason?: string; // 出差事由
    startTime?: number | string; // 开始日期
    endTime?: number | string; // 结束日期
    days?: number; // 出差天数
    travelApplyId?: number; // 关联出差申请编号
    travelApplyNo?: string; // 关联出差单号
    totalPrice?: number; // 报销总金额
    payStatus?: boolean; // 支付状态
    status?: number; // 审批状态
    processInstanceId?: string; // 流程实例编号
    creator?: string; // 申请人编号
    creatorName?: string; // 申请人姓名
    deptId?: number; // 申请部门编号
    deptName?: string; // 申请部门名称
    createTime?: number | string; // 创建时间
    remark?: string; // 备注
    items: TravelReimbursementItem[]; // 明细
    fileUrls: string[]; // 附件地址列表
  }

  /** OA 出差报销费用明细 */
  export interface TravelReimbursementItem {
    expenseType?: number; // 费用类型
    expenseTime?: number | string; // 发生日期
    departureCity?: string; // 出发地
    arrivalCity?: string; // 到达地
    price?: number; // 金额
    description?: string; // 费用说明
  }
}

/** 获得本人出差报销分页 */
export function getTravelReimbursementPage(params: PageParam) {
  return requestClient.get<
    PageResult<OaTravelReimbursementApi.TravelReimbursement>
  >('/oa/travel-reimbursement/page', { params });
}

/** 获得出差报销详情 */
export function getTravelReimbursement(id: number) {
  return requestClient.get<OaTravelReimbursementApi.TravelReimbursement>(
    '/oa/travel-reimbursement/get',
    { params: { id } },
  );
}

/** 创建出差报销草稿 */
export function createTravelReimbursement(
  data: OaTravelReimbursementApi.TravelReimbursement,
) {
  return requestClient.post<number>('/oa/travel-reimbursement/create', data);
}

/** 修改出差报销草稿 */
export function updateTravelReimbursement(
  data: OaTravelReimbursementApi.TravelReimbursement,
) {
  return requestClient.put<boolean>('/oa/travel-reimbursement/update', data);
}

/** 提交出差报销 */
export function submitTravelReimbursement(id: number) {
  return requestClient.post<boolean>('/oa/travel-reimbursement/submit', { id });
}

/** 撤回出差报销 */
export function cancelTravelReimbursement(id: number) {
  return requestClient.put<boolean>('/oa/travel-reimbursement/cancel', null, {
    params: { id },
  });
}

/** 删除出差报销 */
export function deleteTravelReimbursement(id: number) {
  return requestClient.delete<boolean>('/oa/travel-reimbursement/delete', {
    params: { id },
  });
}
