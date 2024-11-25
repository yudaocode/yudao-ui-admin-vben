import { type PageParam, requestClient } from '#/api/request';

export namespace DictDataApi {
  /**
   * 字典数据信息 Response VO
   */
  export type DictDataRespVO = {
    colorType?: string;
    createTime?: Date;
    cssClass?: string;
    dictType: string;
    id?: number;
    label: string;
    remark?: string;
    sort?: number;
    status?: number;
    value: string;
  };

  /**
   * 字典类型分页列表 Request VO
   */
  export interface DictDataPageReqVO extends PageParam {
    dictType?: string;
    label?: string;
    status?: number;
  }

  /**
   * 字典数据创建/修改 Request VO
   */
  export interface DictDataSaveReqVO {
    colorType?: string;
    cssClass?: string;
    dictType: string;
    id?: number;
    label: string;
    remark?: string;
    sort?: number;
    status?: number;
    value: string;
  }

  /**
   * 字典数据（精简) Response VO
   */
  export interface DictDataSimpleRespVO {
    colorType?: string;
    cssClass?: string;
    dictType: string;
    label: string;
    value: string;
  }
}

// 查询字典数据（精简)列表
export const getSimpleDictDataList = () => {
  return requestClient.get('/system/dict-data/simple-list');
};

// 查询字典数据列表
export const getDictDataPage = (params: PageParam) => {
  return requestClient.get('/system/dict-data/page', { params });
};

// 查询字典数据详情
export const getDictData = (id: number) => {
  return requestClient.get(`/system/dict-data/get?id=${id}`);
};

// 新增字典数据
export const createDictData = (data: DictDataApi.DictDataSaveReqVO) => {
  return requestClient.post('/system/dict-data/create', data);
};

// 修改字典数据
export const updateDictData = (data: DictDataApi.DictDataSaveReqVO) => {
  return requestClient.put('/system/dict-data/update', data);
};

// 删除字典数据
export const deleteDictData = (id: number) => {
  return requestClient.delete(`/system/dict-data/delete?id=${id}`);
};

// 导出字典类型数据
export const exportDictData = (params: DictDataApi.DictDataPageReqVO) => {
  return requestClient.download('/system/dict-data/export', { params });
};
