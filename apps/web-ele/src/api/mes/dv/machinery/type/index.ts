import { requestClient } from '#/api/request';

export namespace MesDvMachineryTypeApi {
  /** MES 设备类型 */
  export interface MachineryType {
    id?: number; // 设备类型编号
    parentId?: number; // 父类型编号
    code?: string; // 类型编码
    name?: string; // 类型名称
    sort?: number; // 显示排序
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
    children?: MachineryType[]; // 子类型
  }
}

/** 查询设备类型列表 */
export function getMachineryTypeList(params?: any) {
  return requestClient.get<MesDvMachineryTypeApi.MachineryType[]>(
    '/mes/dv/machinery-type/list',
    { params },
  );
}

/** 查询设备类型精简列表 */
export function getMachineryTypeSimpleList() {
  return requestClient.get<MesDvMachineryTypeApi.MachineryType[]>(
    '/mes/dv/machinery-type/simple-list',
  );
}

/** 查询设备类型详情 */
export function getMachineryType(id: number) {
  return requestClient.get<MesDvMachineryTypeApi.MachineryType>(
    `/mes/dv/machinery-type/get?id=${id}`,
  );
}

/** 新增设备类型 */
export function createMachineryType(data: MesDvMachineryTypeApi.MachineryType) {
  return requestClient.post('/mes/dv/machinery-type/create', data);
}

/** 修改设备类型 */
export function updateMachineryType(data: MesDvMachineryTypeApi.MachineryType) {
  return requestClient.put('/mes/dv/machinery-type/update', data);
}

/** 删除设备类型 */
export function deleteMachineryType(id: number) {
  return requestClient.delete(`/mes/dv/machinery-type/delete?id=${id}`);
}
