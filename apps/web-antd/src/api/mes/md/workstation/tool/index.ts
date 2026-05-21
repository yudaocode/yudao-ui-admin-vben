import { requestClient } from '#/api/request';

export namespace MesMdWorkstationToolApi {
  /** MES 工作站工装夹具资源 */
  export interface WorkstationTool {
    id?: number; // 资源编号
    workstationId?: number; // 工作站编号
    toolTypeId?: number; // 工具类型编号
    toolTypeName?: string; // 工具类型名称
    quantity?: number; // 数量
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询工作站工装夹具资源列表 */
export function getWorkstationToolList(workstationId: number) {
  return requestClient.get<MesMdWorkstationToolApi.WorkstationTool[]>(
    '/mes/md-workstation-tool/list-by-workstation',
    { params: { workstationId } },
  );
}

/** 新增工作站工装夹具资源 */
export function createWorkstationTool(
  data: MesMdWorkstationToolApi.WorkstationTool,
) {
  return requestClient.post('/mes/md-workstation-tool/create', data);
}

/** 修改工作站工装夹具资源 */
export function updateWorkstationTool(
  data: MesMdWorkstationToolApi.WorkstationTool,
) {
  return requestClient.put('/mes/md-workstation-tool/update', data);
}

/** 删除工作站工装夹具资源 */
export function deleteWorkstationTool(id: number) {
  return requestClient.delete(`/mes/md-workstation-tool/delete?id=${id}`);
}
