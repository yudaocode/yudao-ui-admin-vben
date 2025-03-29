import { requestClient } from '#/api/request';

export namespace SystemDeptApi {
  /** 部门信息 */
  export interface SystemDept {
    id?: number;
    name: string;
    parentId?: number;
    status: number;
    sort: number;
    leaderUserId: number;
    phone: string;
    email: string;
    createTime: Date;
    children?: SystemDept[];
  }
}

/** 查询部门（精简)列表 */
export async function getSimpleDeptList() {
  return requestClient.get<SystemDeptApi.SystemDept[]>('/system/dept/simple-list');
}

/** 查询部门列表 */
export async function getDeptList() {
  return requestClient.get('/system/dept/list');
}

/** 查询部门详情 */
export async function getDept(id: number) {
  return requestClient.get<SystemDeptApi.SystemDept>(`/system/dept/get?id=${id}`);
}

/** 新增部门 */
export async function createDept(data: SystemDeptApi.SystemDept) {
  return requestClient.post('/system/dept/create', data);
}

/** 修改部门 */
export async function updateDept(data: SystemDeptApi.SystemDept) {
  return requestClient.put('/system/dept/update', data);
}

/** 删除部门 */
export async function deleteDept(id: number) {
  return requestClient.delete(`/system/dept/delete?id=${id}`);
}
