import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MemberAddressApi {
  /** 收件地址信息 */
  export interface Address {
    id?: number;
    name: string;
    mobile: string;
    areaId: number;
    detailAddress: string;
    defaultStatus: boolean;
  }
}

/** 查询用户收件地址列表 */
export function getAddressList(params: PageParam) {
  return requestClient.get<PageResult<MemberAddressApi.Address>>(
    '/member/address/list',
    {
      params,
    },
  );
}
