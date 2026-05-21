import { requestClient } from '#/api/request';

export namespace MesMdWorkstationMachineApi {
  /** MES 工作站设备资源 */
  export interface WorkstationMachine {
    id?: number; // 资源编号
    workstationId?: number; // 工作站编号
    machineryId?: number; // 设备编号
    machineryCode?: string; // 设备编码
    machineryName?: string; // 设备名称
    quantity?: number; // 数量
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询工作站设备资源列表 */
export function getWorkstationMachineList(workstationId: number) {
  return requestClient.get<MesMdWorkstationMachineApi.WorkstationMachine[]>(
    '/mes/md-workstation-machine/list-by-workstation',
    { params: { workstationId } },
  );
}

/** 新增工作站设备资源 */
export function createWorkstationMachine(
  data: MesMdWorkstationMachineApi.WorkstationMachine,
) {
  return requestClient.post('/mes/md-workstation-machine/create', data);
}

/** 删除工作站设备资源 */
export function deleteWorkstationMachine(id: number) {
  return requestClient.delete(`/mes/md-workstation-machine/delete?id=${id}`);
}
