import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace RuleSceneApi {
  /** 场景联动规则 */
  export interface SceneRule {
    id?: number;
    name: string;
    description?: string;
    status?: number;
    triggers?: Trigger[];
    actions?: Action[];
    lastTriggeredTime?: Date;
    createTime?: Date;
  }

  /** 场景联动规则的触发器 */
  export interface Trigger {
    type?: number;
    productId?: number;
    deviceId?: number;
    identifier?: string;
    operator?: string;
    value?: any;
    cronExpression?: string;
    conditionGroups?: TriggerCondition[][]; // 后端结构：List<List<TriggerCondition>>；外层「或」、组内「且」
  }

  /**  场景联动规则的触发条件 */
  export interface TriggerCondition {
    productId?: number;
    deviceId?: number;
    identifier?: string;
    operator?: string;
    value?: any;
    type?: number;
    param?: string;
  }

  /** 场景联动规则的动作 */
  export interface Action {
    type?: number;
    productId?: number;
    deviceId?: number;
    identifier?: string;
    value?: any;
    alertConfigId?: number;
    params?: string;
  }
}

/** 查询场景联动规则分页 */
export function getSceneRulePage(params: PageParam) {
  return requestClient.get<PageResult<RuleSceneApi.SceneRule>>(
    '/iot/scene-rule/page',
    { params },
  );
}

/** 查询场景联动规则详情 */
export function getSceneRule(id: number) {
  return requestClient.get<RuleSceneApi.SceneRule>(
    `/iot/scene-rule/get?id=${id}`,
  );
}

/** 新增场景联动规则 */
export function createSceneRule(data: RuleSceneApi.SceneRule) {
  return requestClient.post('/iot/scene-rule/create', data);
}

/** 修改场景联动规则 */
export function updateSceneRule(data: RuleSceneApi.SceneRule) {
  return requestClient.put('/iot/scene-rule/update', data);
}

/** 删除场景联动规则 */
export function deleteSceneRule(id: number) {
  return requestClient.delete(`/iot/scene-rule/delete?id=${id}`);
}

/** 更新场景联动规则状态 */
export function updateSceneRuleStatus(id: number, status: number) {
  return requestClient.put(`/iot/scene-rule/update-status`, {
    id,
    status,
  });
}

/** 获取场景联动规则简单列表 */
export function getSimpleRuleSceneList() {
  return requestClient.get<RuleSceneApi.SceneRule[]>(
    '/iot/scene-rule/simple-list',
  );
}
