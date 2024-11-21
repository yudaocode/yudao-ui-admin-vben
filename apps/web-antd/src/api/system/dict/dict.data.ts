import { requestClient } from '#/api/request';

export type DictDataVO = {
  colorType: string;
  createTime: Date;
  cssClass: string;
  dictType: string;
  id: number | undefined;
  label: string;
  remark: string;
  sort: number | undefined;
  status: number;
  value: string;
};

// 查询字典数据（精简)列表
export function getSimpleDictDataList() {
  return requestClient.get('/system/dict-data/simple-list');
}

// 查询字典数据列表
export function getDictDataPage(params: any) {
  return requestClient.get('/system/dict-data/page', params);
}

// 查询字典数据详情
export function getDictData(id: number) {
  return requestClient.get(`/system/dict-data/get?id=${id}`);
}

// 新增字典数据
export function createDictData(data: DictDataVO) {
  return requestClient.post('/system/dict-data/create', data);
}

// 修改字典数据
export function updateDictData(data: DictDataVO) {
  return requestClient.put('/system/dict-data/update', data);
}

// 删除字典数据
export function deleteDictData(id: number) {
  return requestClient.delete(`/system/dict-data/delete?id=${id}`);
}

// 导出字典类型数据
export function exportDictData(params: any) {
  return requestClient.download('/system/dict-data/export', params);
}
