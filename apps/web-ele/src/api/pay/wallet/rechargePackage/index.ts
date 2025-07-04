import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace WalletRechargePackageApi {
  /** 充值套餐信息 */
  export interface Package {
    id?: number;
    name: string;
    payPrice: number;
    bonusPrice: number;
    status: number;
  }
}

/** 查询充值套餐列表 */
export function getPackagePage(params: PageParam) {
  return requestClient.get<PageResult<WalletRechargePackageApi.Package>>(
    '/pay/wallet-recharge-package/page',
    {
      params,
    },
  );
}

/** 查询充值套餐详情 */
export function getPackage(id: number) {
  return requestClient.get<WalletRechargePackageApi.Package>(
    `/pay/wallet-recharge-package/get?id=${id}`,
  );
}

/** 新增充值套餐 */
export function createPackage(data: WalletRechargePackageApi.Package) {
  return requestClient.post('/pay/wallet-recharge-package/create', data);
}

/** 修改充值套餐 */
export function updatePackage(data: WalletRechargePackageApi.Package) {
  return requestClient.put('/pay/wallet-recharge-package/update', data);
}

/** 删除充值套餐 */
export function deletePackage(id: number) {
  return requestClient.delete(`/pay/wallet-recharge-package/delete?id=${id}`);
}
