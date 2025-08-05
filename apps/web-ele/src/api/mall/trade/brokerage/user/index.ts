import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MallBrokerageUserApi {
  /** 分销用户 */
  export interface BrokerageUser {
    /** 编号 */
    id: number;
    /** 推广员编号 */
    bindUserId: number;
    /** 推广员绑定时间 */
    bindUserTime: Date;
    /** 是否启用分销 */
    brokerageEnabled: boolean;
    /** 分销资格时间 */
    brokerageTime: Date;
    /** 可提现金额，单位：分 */
    price: number;
    /** 冻结金额，单位：分 */
    frozenPrice: number;
    /** 用户昵称 */
    nickname: string;
    /** 用户头像 */
    avatar: string;
  }

  /** 创建分销用户请求 */
  export interface CreateRequest {
    /** 用户编号 */
    userId: number;
    /** 推广员编号 */
    bindUserId: number;
  }

  /** 修改推广员请求 */
  export interface UpdateBindUserRequest {
    /** 用户编号 */
    id: number;
    /** 推广员编号 */
    bindUserId: number;
  }

  /** 清除推广员请求 */
  export interface ClearBindUserRequest {
    /** 用户编号 */
    id: number;
  }

  /** 修改推广资格请求 */
  export interface UpdateBrokerageEnabledRequest {
    /** 用户编号 */
    id: number;
    /** 是否启用分销 */
    enabled: boolean;
  }
}

/** 创建分销用户 */
export function createBrokerageUser(data: MallBrokerageUserApi.CreateRequest) {
  return requestClient.post('/trade/brokerage-user/create', data);
}

/** 查询分销用户列表 */
export function getBrokerageUserPage(params: PageParam) {
  return requestClient.get<PageResult<MallBrokerageUserApi.BrokerageUser>>(
    '/trade/brokerage-user/page',
    { params },
  );
}

/** 查询分销用户详情 */
export function getBrokerageUser(id: number) {
  return requestClient.get<MallBrokerageUserApi.BrokerageUser>(
    `/trade/brokerage-user/get?id=${id}`,
  );
}

/** 修改推广员 */
export function updateBindUser(
  data: MallBrokerageUserApi.UpdateBindUserRequest,
) {
  return requestClient.put('/trade/brokerage-user/update-bind-user', data);
}

/** 清除推广员 */
export function clearBindUser(data: MallBrokerageUserApi.ClearBindUserRequest) {
  return requestClient.put('/trade/brokerage-user/clear-bind-user', data);
}

/** 修改推广资格 */
export function updateBrokerageEnabled(
  data: MallBrokerageUserApi.UpdateBrokerageEnabledRequest,
) {
  return requestClient.put(
    '/trade/brokerage-user/update-brokerage-enable',
    data,
  );
}
