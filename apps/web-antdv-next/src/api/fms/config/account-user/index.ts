import { requestClient } from '#/api/request';

/** FMS 账套用户权限级别枚举 */
export enum FmsAccountUserLevelEnum {
  OWNER = 1, // 主管
  READ = 2, // 查看者
  WRITE = 3, // 会计
}

export namespace FmsAccountUserApi {
  /** 账套用户 */
  export interface AccountUser {
    userId: number; // 后台用户编号
    nickname?: string; // 用户昵称
    deptName?: string; // 部门名称
    mobile?: string; // 手机号码
    email?: string; // 用户邮箱
    status?: number; // 用户状态
    defaultStatus: boolean; // 是否默认账套
    founder: boolean; // 是否账套创建人
    level: number; // 成员权限级别
  }

  /** 账套成员修改参数 */
  export interface UpdateMemberReq {
    userId: number; // 后台用户编号
    level: number; // 成员权限级别
  }

  /** 账套用户修改参数 */
  export interface UpdateReq {
    accountSetId: number; // 账套编号
    members: UpdateMemberReq[]; // 账套成员数组
  }
}

/** 查询账套用户列表 */
export function getAccountUserList(accountSetId: number) {
  return requestClient.get<FmsAccountUserApi.AccountUser[]>(
    '/fms/config/account-user/list',
    { params: { accountSetId } },
  );
}

/** 修改账套用户列表 */
export function updateAccountUserList(data: FmsAccountUserApi.UpdateReq) {
  return requestClient.put<boolean>('/fms/config/account-user/update', data);
}

/** 设置默认账套 */
export function updateAccountSetDefaultStatus(accountSetId: number) {
  return requestClient.put<boolean>(
    '/fms/config/account-user/update-default-status',
    undefined,
    { params: { accountSetId } },
  );
}
