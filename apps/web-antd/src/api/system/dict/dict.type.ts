import { requestClient } from '#/api/request';

export type DictTypeVO = {
  createTime: Date;
  id: number | undefined;
  name: string;
  remark: string;
  status: number;
  type: string;
};

// 查询字典（精简)列表
export function getSimpleDictTypeList() {
  return requestClient.get('/system/dict-type/list-all-simple');
}

// 查询字典列表
export function getDictTypePage(params: any) {
  return requestClient.get('/system/dict-type/page', params);
}

// 查询字典详情
export function getDictType(id: number) {
  return requestClient.get(`/system/dict-type/get?id=${id}`);
}

// 新增字典
export function createDictType(data: DictTypeVO) {
  return requestClient.post('/system/dict-type/create', data);
}

// 修改字典
export function updateDictType(data: DictTypeVO) {
  return requestClient.put('/system/dict-type/update', data);
}

// 删除字典
export function deleteDictType(id: number) {
  return requestClient.delete(`/system/dict-type/delete?id=${id}`);
}
// 导出字典类型
export function exportDictType(params: any) {
  return requestClient.download('/system/dict-type/export', params);
}
