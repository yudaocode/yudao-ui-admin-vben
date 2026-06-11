import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace AlertConfigApi {
  /** IoT 告警配置 */
  export interface AlertConfig {
    id?: number;
    name?: string;
    description?: string;
    level?: number;
    status?: number;
    sceneRuleIds?: number[];
    receiveUserIds?: number[];
    receiveUserNames?: string[];
    receiveTypes?: number[];
    smsTemplateCode?: string;
    mailTemplateCode?: string;
    notifyTemplateCode?: string;
    createTime?: Date;
  }
}

/** 查询告警配置分页 */
export function getAlertConfigPage(params: PageParam) {
  return requestClient.get<PageResult<AlertConfigApi.AlertConfig>>(
    '/iot/alert-config/page',
    { params },
  );
}

/** 查询告警配置详情 */
export function getAlertConfig(id: number) {
  return requestClient.get<AlertConfigApi.AlertConfig>(
    `/iot/alert-config/get?id=${id}`,
  );
}

/** 获取告警配置简单列表 */
export function getSimpleAlertConfigList() {
  return requestClient.get<AlertConfigApi.AlertConfig[]>(
    '/iot/alert-config/simple-list',
  );
}

/** 新增告警配置 */
export function createAlertConfig(data: AlertConfigApi.AlertConfig) {
  return requestClient.post('/iot/alert-config/create', data);
}

/** 修改告警配置 */
export function updateAlertConfig(data: AlertConfigApi.AlertConfig) {
  return requestClient.put('/iot/alert-config/update', data);
}

/** 删除告警配置 */
export function deleteAlertConfig(id: number) {
  return requestClient.delete(`/iot/alert-config/delete?id=${id}`);
}
