import { requestClient } from '#/api/request';

export namespace HrmPortalSalarySlipApi {
  /** 工资条选项 */
  export interface SlipOption {
    name: string; // 薪资项名称
    type?: number; // 薪资项类型
    code?: number; // 编码
    value?: number; // 值
    remark?: string; // 备注
    sort?: number; // 排序
    children?: SlipOption[]; // 子工资条项
  }

  /** 员工端工资条 */
  export interface PortalSalarySlip {
    id: number; // 编号
    sendRecordId?: number; // 工资条记录编号
    monthEmployeeRecordId?: number; // 员工工资记录编号
    employeeId: number; // 员工编号
    year: number; // 年份
    month: number; // 月份
    readStatus?: number; // 已读状态
    realPaySalary?: number; // 实发工资
    remark?: string; // 备注
    createTime?: Date; // 创建时间
    options: SlipOption[]; // 选项列表
  }

  /** 工资条列表查询 */
  export interface SlipListReq {
    startMonth?: string; // 工资开始月份
    endMonth?: string; // 结束月份
    orderType?: number; // 排序类型
    order?: number; // 排序方向
  }

  /** 未读汇总 */
  export interface UnreadSummary {
    unreadCount: number; // 未读工资条数量
    reminder?: string; // 最新未读工资条提醒
  }
}

/** 获得我的工资条列表 */
export function getSalarySlipList(params?: HrmPortalSalarySlipApi.SlipListReq) {
  return requestClient.get<HrmPortalSalarySlipApi.PortalSalarySlip[]>(
    '/hrm/portal/salary/slip/list',
    { params },
  );
}

/** 获得我的未读工资条概况 */
export function getUnreadSalarySlipSummary() {
  return requestClient.get<HrmPortalSalarySlipApi.UnreadSummary>(
    '/hrm/portal/salary/slip/unread-summary',
  );
}

/** 标记我的工资条为已读 */
export function markSalarySlipRead(ids: number[]) {
  return requestClient.put<boolean>('/hrm/portal/salary/slip/read', undefined, {
    params: { ids: ids.join(',') },
  });
}
