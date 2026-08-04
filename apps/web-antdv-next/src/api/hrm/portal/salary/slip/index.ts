import { requestClient } from '#/api/request';

export namespace HrmPortalSalarySlipApi {
  /** 工资条选项 */
  export interface SlipOption {
    name: string;
    type?: number;
    code?: number;
    value?: number;
    remark?: string;
    sort?: number;
    children?: SlipOption[];
  }

  /** 员工端工资条 */
  export interface PortalSalarySlip {
    id: number;
    sendRecordId?: number;
    monthEmployeeRecordId?: number;
    employeeId: number;
    year: number;
    month: number;
    readStatus?: number;
    realPaySalary?: number;
    remark?: string;
    createTime?: Date;
    options: SlipOption[];
  }

  /** SlipListReq */
  export interface SlipListReq {
    startMonth?: string;
    endMonth?: string;
    orderType?: number;
    order?: number;
  }

  /** UnreadSummary */
  export interface UnreadSummary {
    unreadCount: number;
    reminder?: string;
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
