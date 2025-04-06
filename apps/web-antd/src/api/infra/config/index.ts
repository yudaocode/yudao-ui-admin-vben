import { requestClient } from '#/api/request';
import type { PageParam, PageResult } from '@vben/request';

export namespace InfraConfigApi {
  /** 参数配置信息 */
  export interface InfraConfig {
    id?: number;
    category: string;
    name: string;
    key: string;
    value: string;
    type: number;
    visible: boolean;
    remark: string;
    createTime?: Date;
  }
}

/** 查询参数列表 */
export function getConfigPage(params: PageParam) {
  return requestClient.get<PageResult<InfraConfigApi.InfraConfig>>('/infra/config/page', {
    params
  });
}

/** 查询参数详情 */
export function getConfig(id: number) {
  return requestClient.get<InfraConfigApi.InfraConfig>(`/infra/config/get?id=${id}`);
}

/** 根据参数键名查询参数值 */
export function getConfigKey(configKey: string) {
  return requestClient.get<string>(`/infra/config/get-value-by-key?key=${configKey}`);
}

/** 新增参数 */
export function createConfig(data: InfraConfigApi.InfraConfig) {
  return requestClient.post('/infra/config/create', data);
}

/** 修改参数 */
export function updateConfig(data: InfraConfigApi.InfraConfig) {
  return requestClient.put('/infra/config/update', data);
}

/** 删除参数 */
export function deleteConfig(id: number) {
  return requestClient.delete(`/infra/config/delete?id=${id}`);
}

/** 导出参数 */
export function exportConfig(params: any) {
  return requestClient.download('/infra/config/export', {
    params
  });
}
