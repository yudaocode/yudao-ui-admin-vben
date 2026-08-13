import { requestClient } from '#/api/request';

export namespace FmsAuxiliaryTypeApi {
  /** 辅助核算类别 */
  export interface AuxiliaryType {
    id?: number; // 类别编号
    accountSetId: number; // 账套编号
    name: string; // 类别名称
    type?: number; // 辅助核算类型
    systemPreset?: boolean; // 是否系统预置
  }

  /** 辅助核算类别下拉选项 */
  export type AuxiliaryTypeOption = AuxiliaryType & { id: number };
}

/** 查询辅助核算类别列表 */
export function getAuxiliaryTypeList(accountSetId: number) {
  return requestClient.get<FmsAuxiliaryTypeApi.AuxiliaryType[]>(
    '/fms/config/auxiliary-type/list',
    { params: { accountSetId } },
  );
}

/** 查询辅助核算类别精简列表 */
export function getAuxiliaryTypeSimpleList(accountSetId: number) {
  return requestClient.get<FmsAuxiliaryTypeApi.AuxiliaryTypeOption[]>(
    '/fms/config/auxiliary-type/simple-list',
    { params: { accountSetId } },
  );
}

/** 新增辅助核算类别 */
export function createAuxiliaryType(data: FmsAuxiliaryTypeApi.AuxiliaryType) {
  return requestClient.post<number>('/fms/config/auxiliary-type/create', data);
}

/** 修改辅助核算类别 */
export function updateAuxiliaryType(data: FmsAuxiliaryTypeApi.AuxiliaryType) {
  return requestClient.put<boolean>('/fms/config/auxiliary-type/update', data);
}

/** 删除辅助核算类别 */
export function deleteAuxiliaryType(accountSetId: number, id: number) {
  return requestClient.delete<boolean>('/fms/config/auxiliary-type/delete', {
    params: { accountSetId, id },
  });
}
