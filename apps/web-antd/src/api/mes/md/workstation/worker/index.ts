import { requestClient } from '#/api/request';

export namespace MesMdWorkstationWorkerApi {
  /** MES 工作站人力资源 */
  export interface WorkstationWorker {
    id?: number; // 资源编号
    workstationId?: number; // 工作站编号
    postId?: number; // 岗位编号
    postName?: string; // 岗位名称
    quantity?: number; // 数量
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询工作站人力资源列表 */
export function getWorkstationWorkerList(workstationId: number) {
  return requestClient.get<MesMdWorkstationWorkerApi.WorkstationWorker[]>(
    '/mes/md-workstation-worker/list-by-workstation',
    { params: { workstationId } },
  );
}

/** 新增工作站人力资源 */
export function createWorkstationWorker(
  data: MesMdWorkstationWorkerApi.WorkstationWorker,
) {
  return requestClient.post('/mes/md-workstation-worker/create', data);
}

/** 修改工作站人力资源 */
export function updateWorkstationWorker(
  data: MesMdWorkstationWorkerApi.WorkstationWorker,
) {
  return requestClient.put('/mes/md-workstation-worker/update', data);
}

/** 删除工作站人力资源 */
export function deleteWorkstationWorker(id: number) {
  return requestClient.delete(`/mes/md-workstation-worker/delete?id=${id}`);
}
