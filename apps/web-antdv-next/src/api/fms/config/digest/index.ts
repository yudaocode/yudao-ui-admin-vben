import { requestClient } from '#/api/request';

export namespace FmsDigestApi {
  /** 常用摘要 */
  export interface Digest {
    id?: number; // 摘要编号
    accountSetId: number; // 账套编号
    content: string; // 摘要内容
    createTime?: Date; // 创建时间
  }
}

/** 查询常用摘要列表 */
export function getDigestList(accountSetId: number) {
  return requestClient.get<FmsDigestApi.Digest[]>('/fms/config/digest/list', {
    params: { accountSetId },
  });
}

/** 查询常用摘要精简列表 */
export function getDigestSimpleList(accountSetId: number) {
  return requestClient.get<FmsDigestApi.Digest[]>(
    '/fms/config/digest/simple-list',
    { params: { accountSetId } },
  );
}

/** 新增常用摘要 */
export function createDigest(data: FmsDigestApi.Digest) {
  return requestClient.post<number>('/fms/config/digest/create', data);
}

/** 修改常用摘要 */
export function updateDigest(data: FmsDigestApi.Digest) {
  return requestClient.put<boolean>('/fms/config/digest/update', data);
}

/** 删除常用摘要 */
export function deleteDigest(accountSetId: number, id: number) {
  return requestClient.delete('/fms/config/digest/delete', {
    params: { accountSetId, id },
  });
}
