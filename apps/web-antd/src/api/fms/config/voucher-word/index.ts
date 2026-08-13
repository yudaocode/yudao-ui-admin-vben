import { requestClient } from '#/api/request';

export namespace FmsVoucherWordApi {
  /** 凭证字 */
  export interface VoucherWord {
    id?: number; // 凭证字编号
    accountSetId: number; // 账套编号
    name: string; // 凭证字
    printTitle?: string; // 打印标题
    defaultStatus: boolean; // 是否默认凭证字
    sort?: number; // 显示顺序
    createTime?: Date; // 创建时间
  }
}

/** 查询凭证字列表 */
export function getVoucherWordList(accountSetId: number) {
  return requestClient.get<FmsVoucherWordApi.VoucherWord[]>(
    '/fms/config/voucher-word/list',
    { params: { accountSetId } },
  );
}

/** 查询凭证字精简列表 */
export function getVoucherWordSimpleList(accountSetId: number) {
  return requestClient.get<FmsVoucherWordApi.VoucherWord[]>(
    '/fms/config/voucher-word/simple-list',
    { params: { accountSetId } },
  );
}

/** 新增凭证字 */
export function createVoucherWord(data: FmsVoucherWordApi.VoucherWord) {
  return requestClient.post<number>('/fms/config/voucher-word/create', data);
}

/** 修改凭证字 */
export function updateVoucherWord(data: FmsVoucherWordApi.VoucherWord) {
  return requestClient.put<boolean>('/fms/config/voucher-word/update', data);
}

/** 删除凭证字 */
export function deleteVoucherWord(accountSetId: number, id: number) {
  return requestClient.delete('/fms/config/voucher-word/delete', {
    params: { accountSetId, id },
  });
}
