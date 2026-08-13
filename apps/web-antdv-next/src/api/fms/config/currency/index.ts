import { requestClient } from '#/api/request';

export namespace FmsCurrencyApi {
  /** 币别 */
  export interface Currency {
    id?: number; // 币别编号
    accountSetId: number; // 账套编号
    code: string; // 币别编码
    name: string; // 币别名称
    exchangeRate: number; // 汇率
    standard?: boolean; // 是否本位币
    createTime?: Date; // 创建时间
  }
}

/** 查询币别列表 */
export function getCurrencyList(accountSetId: number) {
  return requestClient.get<FmsCurrencyApi.Currency[]>(
    '/fms/config/currency/list',
    { params: { accountSetId } },
  );
}

/** 查询币别精简列表 */
export function getCurrencySimpleList(accountSetId: number) {
  return requestClient.get<FmsCurrencyApi.Currency[]>(
    '/fms/config/currency/simple-list',
    { params: { accountSetId } },
  );
}

/** 新增币别 */
export function createCurrency(data: FmsCurrencyApi.Currency) {
  return requestClient.post<number>('/fms/config/currency/create', data);
}

/** 修改币别 */
export function updateCurrency(data: FmsCurrencyApi.Currency) {
  return requestClient.put<boolean>('/fms/config/currency/update', data);
}

/** 删除币别 */
export function deleteCurrency(accountSetId: number, id: number) {
  return requestClient.delete<boolean>('/fms/config/currency/delete', {
    params: { accountSetId, id },
  });
}
