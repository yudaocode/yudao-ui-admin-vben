import type { RuleSceneApi } from '#/api/iot/rule/scene';

import {
  IotRuleSceneActionTypeEnum,
  IotRuleSceneTriggerConditionTypeEnum,
  IotRuleSceneTriggerTimeOperatorEnum,
  IotRuleSceneTriggerTypeEnum,
  isDeviceTrigger,
} from '@vben/constants';
import { CronUtils, isEmptyVal, isObject } from '@vben/utils';

/**
 * 判断普通 ID 选择值是否缺失。
 *
 * 产品、告警配置等普通业务 ID 应为正数；`0` 不代表有效业务数据。
 *
 * @param value 普通业务 ID
 * @returns 是否缺失
 */
function isRequiredIdMissing(value: unknown): boolean {
  return !value;
}

/**
 * 判断设备 ID 选择值是否缺失。
 *
 * 场景联动的设备选择器中，`0` 表示「全部设备」，是合法值；因此这里只能把
 * `undefined`、`null`、空字符串视为未选择，不能使用普通 falsy 判断。
 *
 * @param value 设备 ID
 * @returns 是否缺失
 */
function isDeviceIdMissing(value: unknown): boolean {
  return isEmptyVal(value);
}

/**
 * 判断执行器参数是否为空。
 *
 * 参数配置当前以 JSON 字符串为主，同时兼容历史对象值：
 * - 空字符串、空白字符串视为空；
 * - 空对象 `{}` 视为空；
 * - 非空 JSON 对象视为已配置；
 * - 非法 JSON 不在这里判空，交给 JSON 格式校验返回更准确的错误。
 *
 * @param params 执行器参数
 * @returns 是否为空
 */
export function isActionParamsEmpty(params?: unknown): boolean {
  if (isEmptyVal(params)) {
    return true;
  }

  if (typeof params === 'string') {
    if (!params.trim()) {
      return true;
    }
    try {
      const parsed = JSON.parse(params);
      if (isObject(parsed) && !Array.isArray(parsed)) {
        return Object.keys(parsed).length === 0;
      }
    } catch {
      return false;
    }
    return false;
  }

  if (isObject(params) && !Array.isArray(params)) {
    return Object.keys(params).length === 0;
  }

  return false;
}

/**
 * 判断执行器参数是否为合法 JSON。
 *
 * 参数编辑组件正常会保存 JSON 字符串；编辑旧数据时可能仍然是对象，对象可直接视为合法。
 *
 * @param params 执行器参数
 * @returns 是否合法
 */
function isActionParamsJsonValid(params?: unknown): boolean {
  if (isObject(params)) {
    return true;
  }
  try {
    JSON.parse(String(params));
    return true;
  } catch {
    return false;
  }
}

/**
 * 校验单个附加子条件。
 *
 * 该方法用于提交前兜底校验，错误提示会带上 path，方便定位到第几个触发器、
 * 第几个条件组和第几个条件。
 *
 * @param condition 子条件配置
 * @param path 错误提示前缀
 * @returns 错误信息，通过则返回 null
 */
export function validateTriggerCondition(
  condition: RuleSceneApi.TriggerCondition,
  path: string,
): null | string {
  if (!condition.type) {
    return `${path}：条件类型不能为空`;
  }

  const isDeviceStatus =
    condition.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS;
  const isDeviceProperty =
    condition.type === IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY;

  // 设备状态和设备属性都必须先选择产品、设备；deviceId = 0 表示全部设备。
  if (isDeviceStatus || isDeviceProperty) {
    if (isRequiredIdMissing(condition.productId)) {
      return `${path}：产品不能为空`;
    }
    if (isDeviceIdMissing(condition.deviceId)) {
      return `${path}：设备不能为空`;
    }
  }

  // 设备状态只校验操作符和状态枚举值。
  if (isDeviceStatus) {
    if (!condition.operator) {
      return `${path}：操作符不能为空`;
    }
    if (isEmptyVal(condition.param)) {
      return `${path}：设备状态不能为空`;
    }
    return null;
  }

  // 设备属性需要校验物模型标识符、操作符和比较值。
  if (isDeviceProperty) {
    if (!condition.identifier) {
      return `${path}：监控项不能为空`;
    }
    if (!condition.operator) {
      return `${path}：操作符不能为空`;
    }
    if (isEmptyVal(condition.param)) {
      return `${path}：比较值不能为空`;
    }
    return null;
  }

  // 当前时间按操作符动态判断 param 是否需要填写。
  if (condition.type === IotRuleSceneTriggerConditionTypeEnum.CURRENT_TIME) {
    if (!condition.operator) {
      return `${path}：时间条件不能为空`;
    }

    if (
      condition.operator === IotRuleSceneTriggerTimeOperatorEnum.TODAY.value
    ) {
      return null;
    }

    if (isEmptyVal(condition.param)) {
      return `${path}：时间值不能为空`;
    }

    if (
      condition.operator ===
      IotRuleSceneTriggerTimeOperatorEnum.BETWEEN_TIME.value
    ) {
      const parts = String(condition.param).split(',');
      if (!parts[0]?.trim() || !parts[1]?.trim()) {
        return `${path}：开始和结束时间不能为空`;
      }
    }
  }

  return null;
}

/**
 * 校验触发器的附加条件组。
 *
 * 条件组结构是二维数组：外层是 OR 关系的条件组，内层是 AND 关系的条件列表。
 * 这里逐组、逐条件返回第一条错误，避免一次性弹出过多提示。
 *
 * @param groups 附加条件组
 * @param triggerIndex 触发器在列表中的下标，用于生成可定位的错误提示
 * @returns 错误信息，通过则返回 null
 */
export function validateTriggerConditionGroups(
  groups: RuleSceneApi.TriggerCondition[][] | undefined,
  triggerIndex: number,
): null | string {
  if (!groups?.length) {
    return null;
  }

  for (const [groupIndex, group] of groups.entries()) {
    // 空条件组没有实际过滤条件，提交后语义不明确，需要拦截。
    if (!Array.isArray(group) || group.length === 0) {
      return `触发器 ${triggerIndex + 1}：条件组 ${groupIndex + 1} 不能为空`;
    }

    for (const [conditionIndex, condition] of group.entries()) {
      const error = validateTriggerCondition(
        condition,
        `触发器 ${triggerIndex + 1} 条件组 ${groupIndex + 1} 条件 ${
          conditionIndex + 1
        }`,
      );
      if (error) {
        return error;
      }
    }
  }

  return null;
}

/**
 * 校验单个触发器配置。
 *
 * 该方法用于场景联动表单提交前兜底校验，避免触发器配置没有独立表单项 prop 时漏掉必填项。
 * 校验逻辑需要和触发器主条件 UI 保持一致，同时继续校验附加条件组。
 *
 * @param trigger 触发器配置
 * @param index 触发器在列表中的下标，用于生成可定位的错误提示
 * @returns 错误信息，通过则返回 null
 */
export function validateTriggerItem(
  trigger: RuleSceneApi.Trigger,
  index: number,
): null | string {
  const prefix = `触发器 ${index + 1}`;

  if (!trigger.type) {
    return `${prefix}：触发器类型不能为空`;
  }

  // 设备类触发器都有产品、设备两个基础字段；deviceId = 0 表示全部设备。
  if (isDeviceTrigger(trigger.type)) {
    if (isRequiredIdMissing(trigger.productId)) {
      return `${prefix}：产品不能为空`;
    }
    if (isDeviceIdMissing(trigger.deviceId)) {
      return `${prefix}：设备不能为空`;
    }

    // 设备状态变化不依赖物模型标识符，只校验操作符和状态值。
    if (trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE) {
      if (!trigger.operator) {
        return `${prefix}：操作符不能为空`;
      }
      if (isEmptyVal(trigger.value)) {
        return `${prefix}：设备状态不能为空`;
      }
    } else {
      if (!trigger.identifier) {
        return `${prefix}：监控项不能为空`;
      }

      // 事件上报和服务调用只监听是否发生，不需要额外的操作符和比较值。
      const isEventOrService =
        trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST ||
        trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE;
      if (!isEventOrService) {
        if (!trigger.operator) {
          return `${prefix}：操作符不能为空`;
        }
        if (isEmptyVal(trigger.value)) {
          return `${prefix}：参数值不能为空`;
        }
      }
    }
  }

  // 定时触发器需要 CRON 表达式，并继续校验 CRON 格式。
  if (trigger.type === IotRuleSceneTriggerTypeEnum.TIMER) {
    if (!trigger.cronExpression) {
      return `${prefix}：CRON 表达式不能为空`;
    }
    if (!CronUtils.validate(trigger.cronExpression)) {
      return `${prefix}：CRON 表达式格式不正确`;
    }
  }

  return validateTriggerConditionGroups(trigger.conditionGroups, index);
}

/**
 * 校验触发器列表。
 *
 * 场景联动至少需要一个触发器；列表内逐条返回第一条错误，避免一次提交出现多条提示。
 *
 * @param triggers 触发器列表
 * @returns 错误信息，通过则返回 null
 */
export function validateSceneRuleTriggers(
  triggers?: RuleSceneApi.Trigger[],
): null | string {
  if (!triggers?.length) {
    return '至少需要一个触发器';
  }

  for (const [index, trigger] of triggers.entries()) {
    const error = validateTriggerItem(trigger, index);
    if (error) {
      return error;
    }
  }

  return null;
}

/**
 * 校验单个执行器配置。
 *
 * 该方法用于场景联动表单提交前兜底校验，避免执行器配置没有独立表单项 prop 时漏掉必填项。
 * 校验逻辑需要和执行器 UI 保持一致。
 *
 * @param action 执行器配置
 * @param index 执行器在列表中的下标，用于生成可定位的错误提示
 * @returns 错误信息，通过则返回 null
 */
export function validateActionItem(
  action: RuleSceneApi.Action,
  index: number,
): null | string {
  const prefix = `执行器 ${index + 1}`;

  if (!action.type) {
    return `${prefix}：执行器类型不能为空`;
  }

  // 设备属性设置和设备服务调用都需要指定设备，并填写物模型参数。
  if (
    action.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET ||
    action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE
  ) {
    if (isRequiredIdMissing(action.productId)) {
      return `${prefix}：产品不能为空`;
    }
    if (isDeviceIdMissing(action.deviceId)) {
      return `${prefix}：设备不能为空`;
    }
    if (
      action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE &&
      !action.identifier
    ) {
      return `${prefix}：服务不能为空`;
    }

    if (isActionParamsEmpty(action.params)) {
      return `${prefix}：参数配置不能为空`;
    }
    if (!isActionParamsJsonValid(action.params)) {
      return `${prefix}：参数格式须为合法 JSON`;
    }

    return null;
  }

  // 告警恢复执行器需要绑定具体告警配置；触发告警不需要预选告警配置。
  if (
    action.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER &&
    !action.alertConfigId
  ) {
    return `${prefix}：告警配置不能为空`;
  }

  return null;
}

/**
 * 校验执行器列表。
 *
 * 场景联动至少需要一个执行器；列表内逐条返回第一条错误，避免一次提交出现多条提示。
 *
 * @param actions 执行器列表
 * @returns 错误信息，通过则返回 null
 */
export function validateSceneRuleActions(
  actions?: RuleSceneApi.Action[],
): null | string {
  if (!actions?.length) {
    return '至少需要一个执行器';
  }

  for (const [index, action] of actions.entries()) {
    const error = validateActionItem(action, index);
    if (error) {
      return error;
    }
  }

  return null;
}
