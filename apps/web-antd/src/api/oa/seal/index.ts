import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaSealApi {
  /** OA 印章 */
  export interface Seal {
    id?: number; // 编号
    deptId?: number; // 所属部门编号
    deptName?: string; // 所属部门
    no?: string; // 印章编号
    name?: string; // 印章名称
    type?: number; // 印章类型
    category?: number; // 印章分类
    keeperUserId?: number; // 保管人用户编号
    keeperDeptId?: number; // 保管部门编号
    status?: number; // 印章台账状态
    purchaseTime?: string; // 购买时间
    enableTime?: string; // 启用时间
    disableTime?: string; // 停用时间
    picUrl?: string; // 印章照片地址
    keeperName?: string; // 保管人
    keeperDeptName?: string; // 保管部门
    sort?: number; // 显示顺序
    remark?: string; // 备注
    createTime?: string; // 创建时间
  }
}

/** 查询印章分页 */
export function getSealPage(params: PageParam) {
  return requestClient.get<PageResult<OaSealApi.Seal>>('/oa/seal/page', {
    params,
  });
}

/** 查询印章详情 */
export function getSeal(id: number) {
  return requestClient.get<OaSealApi.Seal>('/oa/seal/get', { params: { id } });
}

/** 新增印章 */
export function createSeal(data: Partial<OaSealApi.Seal>) {
  return requestClient.post<number>('/oa/seal/create', data);
}

/** 修改印章 */
export function updateSeal(data: Partial<OaSealApi.Seal>) {
  return requestClient.put<boolean>('/oa/seal/update', data);
}

/** 删除印章 */
export function deleteSeal(id: number) {
  return requestClient.delete<boolean>('/oa/seal/delete', { params: { id } });
}
