<script lang="ts" setup>
import type { RuleSceneApi } from '#/api/iot/rule/scene';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import {
  CommonStatusEnum,
  IotRuleSceneActionTypeEnum,
  IotRuleSceneTriggerConditionTypeEnum,
  IotRuleSceneTriggerTimeOperatorEnum,
  IotRuleSceneTriggerTypeEnum,
  isDeviceTrigger,
} from '@vben/constants';
import { CronUtils } from '@vben/utils';

import { Form, message } from 'ant-design-vue';

import {
  createSceneRule,
  getSceneRule,
  updateSceneRule,
} from '#/api/iot/rule/scene';
import { $t } from '#/locales';

import ActionSection from '../form/sections/action-section.vue';
import BasicInfoSection from '../form/sections/basic-info-section.vue';
import TriggerSection from '../form/sections/trigger-section.vue';

defineOptions({ name: 'IoTRuleSceneForm' });

const emit = defineEmits(['success']);

const formRef = ref();
const formData = ref<RuleSceneApi.SceneRule>(buildEmptyFormData());

const getTitle = computed(() =>
  formData.value.id
    ? $t('ui.actionTitle.edit', ['场景规则'])
    : $t('ui.actionTitle.create', ['场景规则']),
);

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    drawerApi.lock();
    try {
      const data = { ...formData.value } as RuleSceneApi.SceneRule;
      await (data.id ? updateSceneRule(data) : createSceneRule(data));
      await drawerApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      drawerApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = drawerApi.getData<RuleSceneApi.SceneRule>();
    // 先用列表传入的数据立即回填，避免 await 期间表单显示空白
    formData.value = data?.id ? normalizeFormData(data) : buildEmptyFormData();
    await nextTick();
    formRef.value?.clearValidate?.();
    // 再异步拉取详情，覆盖以保证字段最新
    if (data?.id) {
      drawerApi.lock();
      try {
        const fresh = await getSceneRule(data.id);
        formData.value = normalizeFormData(fresh);
      } finally {
        drawerApi.unlock();
      }
    }
  },
});

/** 构造空白表单数据 */
function buildEmptyFormData(): RuleSceneApi.SceneRule {
  return {
    name: '',
    description: '',
    status: CommonStatusEnum.ENABLE,
    triggers: [
      {
        type: IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST,
        productId: undefined,
        deviceId: undefined,
        identifier: undefined,
        operator: undefined,
        value: undefined,
        cronExpression: undefined,
        conditionGroups: [],
      },
    ],
    actions: [],
  };
}

/** 回显时兜底，保证触发器/执行器数组不为空 */
function normalizeFormData(result: any): RuleSceneApi.SceneRule {
  const triggers: RuleSceneApi.Trigger[] = result.triggers?.length
    ? result.triggers
    : buildEmptyFormData().triggers!;
  const actions: RuleSceneApi.Action[] = result.actions || [];
  return {
    ...result,
    triggers,
    actions,
  };
}

/** 触发器校验 */
function validateTriggers(_rule: any, value: any, callback: any) {
  if (!value || !Array.isArray(value) || value.length === 0) {
    callback(new Error('至少需要一个触发器'));
    return;
  }
  for (const [i, trigger] of value.entries()) {
    if (!trigger.type) {
      callback(new Error(`触发器 ${i + 1}：触发器类型不能为空`));
      return;
    }
    if (isDeviceTrigger(trigger.type)) {
      if (!trigger.productId) {
        callback(new Error(`触发器 ${i + 1}：产品不能为空`));
        return;
      }
      // deviceId = 0 表示「全部设备」（DEVICE_SELECTOR_OPTIONS.ALL_DEVICES），是合法值；仅 undefined / null 视为未选
      if (trigger.deviceId === undefined || trigger.deviceId === null) {
        callback(new Error(`触发器 ${i + 1}：设备不能为空`));
        return;
      }
      const isStateUpdate =
        trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE;
      if (!isStateUpdate && !trigger.identifier) {
        callback(new Error(`触发器 ${i + 1}：物模型标识符不能为空`));
        return;
      }
      // 事件上报 / 服务调用：operator 由前端自动设为 '='，参数值留空表示「事件 / 调用发生即匹配」
      const isEventOrService =
        trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST ||
        trigger.type === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE;
      if (!isEventOrService) {
        if (!trigger.operator) {
          callback(new Error(`触发器 ${i + 1}：操作符不能为空`));
          return;
        }
        if (
          trigger.value === undefined ||
          trigger.value === null ||
          trigger.value === ''
        ) {
          callback(new Error(`触发器 ${i + 1}：参数值不能为空`));
          return;
        }
      }
    }
    if (trigger.type === IotRuleSceneTriggerTypeEnum.TIMER) {
      if (!trigger.cronExpression) {
        callback(new Error(`触发器 ${i + 1}：CRON 表达式不能为空`));
        return;
      }
      if (!CronUtils.validate(trigger.cronExpression)) {
        callback(new Error(`触发器 ${i + 1}：CRON 表达式格式不正确`));
        return;
      }
    }
    // 递归校验 conditionGroups（嵌套条件组）
    if (trigger.conditionGroups?.length) {
      for (const [gi, group] of trigger.conditionGroups.entries()) {
        if (!Array.isArray(group) || group.length === 0) {
          callback(
            new Error(`触发器 ${i + 1}：条件组 ${gi + 1} 不能为空`),
          );
          return;
        }
        for (const [ci, condition] of group.entries()) {
          const prefix = `触发器 ${i + 1} 条件组 ${gi + 1} 条件 ${ci + 1}`;
          if (!condition.type) {
            callback(new Error(`${prefix}：条件类型不能为空`));
            return;
          }
          const isDeviceStatus =
            condition.type ===
            IotRuleSceneTriggerConditionTypeEnum.DEVICE_STATUS;
          const isDeviceProperty =
            condition.type ===
            IotRuleSceneTriggerConditionTypeEnum.DEVICE_PROPERTY;
          const isCurrentTime =
            condition.type ===
            IotRuleSceneTriggerConditionTypeEnum.CURRENT_TIME;
          if (isDeviceStatus || isDeviceProperty) {
            if (!condition.productId) {
              callback(new Error(`${prefix}：产品不能为空`));
              return;
            }
            // deviceId = 0 表示「全部设备」（DEVICE_SELECTOR_OPTIONS.ALL_DEVICES），是合法值
            if (
              condition.deviceId === undefined ||
              condition.deviceId === null
            ) {
              callback(new Error(`${prefix}：设备不能为空`));
              return;
            }
            if (isDeviceProperty && !condition.identifier) {
              callback(new Error(`${prefix}：物模型标识符不能为空`));
              return;
            }
          }
          if (!condition.operator) {
            callback(new Error(`${prefix}：操作符不能为空`));
            return;
          }
          // 设备状态：param 是状态值（必填）；设备属性：param 是比较值（必填）
          if (
            (isDeviceStatus || isDeviceProperty) &&
            (condition.param === undefined ||
              condition.param === null ||
              condition.param === '')
          ) {
            callback(
              new Error(
                `${prefix}：${isDeviceStatus ? '设备状态' : '比较值'}不能为空`,
              ),
            );
            return;
          }
          // 当前时间：TODAY 不需要 param；BETWEEN_TIME 需要双段「v1,v2」；其它需要单段
          if (isCurrentTime) {
            const op = condition.operator;
            if (op === IotRuleSceneTriggerTimeOperatorEnum.TODAY.value) {
              // TODAY 无需 param
            } else if (
              op === IotRuleSceneTriggerTimeOperatorEnum.BETWEEN_TIME.value
            ) {
              const parts = condition.param
                ? String(condition.param).split(',')
                : [];
              if (parts.length < 2 || !parts[0] || !parts[1]) {
                callback(new Error(`${prefix}：起止时间不能为空`));
                return;
              }
            } else if (!condition.param) {
              callback(new Error(`${prefix}：时间值不能为空`));
              return;
            }
          }
        }
      }
    }
  }
  callback();
}

/** 执行器校验 */
function validateActions(_rule: any, value: any, callback: any) {
  if (!value || !Array.isArray(value) || value.length === 0) {
    callback(new Error('至少需要一个执行器'));
    return;
  }
  for (const [i, action] of value.entries()) {
    if (!action.type) {
      callback(new Error(`执行器 ${i + 1}：执行器类型不能为空`));
      return;
    }
    if (
      action.type === IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET ||
      action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE
    ) {
      if (!action.productId) {
        callback(new Error(`执行器 ${i + 1}：产品不能为空`));
        return;
      }
      // deviceId = 0 表示「全部设备」（DEVICE_SELECTOR_OPTIONS.ALL_DEVICES）；
      // 后端 IotDevicePropertySetSceneRuleAction / IotDeviceServiceInvokeSceneRuleAction
      // 均支持广播执行，因此 0 是合法值，仅 undefined / null 视为未选
      if (action.deviceId === undefined || action.deviceId === null) {
        callback(new Error(`执行器 ${i + 1}：设备不能为空`));
        return;
      }
      if (
        action.type === IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE &&
        !action.identifier
      ) {
        callback(new Error(`执行器 ${i + 1}：服务不能为空`));
        return;
      }
      if (!action.params || Object.keys(action.params).length === 0) {
        callback(new Error(`执行器 ${i + 1}：参数配置不能为空`));
        return;
      }
    }
    // 仅恢复告警动作需要选择已有告警配置；触发告警动作不需要预选 alertConfigId
    if (
      action.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER &&
      !action.alertConfigId
    ) {
      callback(new Error(`执行器 ${i + 1}：告警配置不能为空`));
      return;
    }
  }
  callback();
}

const formRules = reactive({
  name: [
    { required: true, message: '场景名称不能为空', trigger: 'blur' },
    {
      type: 'string',
      min: 1,
      max: 50,
      message: '场景名称长度应在 1-50 个字符之间',
      trigger: 'blur',
    },
  ],
  status: [{ required: true, message: '场景状态不能为空', trigger: 'change' }],
  description: [
    {
      type: 'string',
      max: 200,
      message: '场景描述不能超过 200 个字符',
      trigger: 'blur',
    },
  ],
  triggers: [
    { required: true, validator: validateTriggers, trigger: 'change' },
  ],
  actions: [{ required: true, validator: validateActions, trigger: 'change' }],
});
</script>

<template>
  <Drawer :title="getTitle" class="w-4/5">
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules as any"
      class="mx-4"
      label-width="110px"
    >
      <BasicInfoSection v-model="formData" />
      <TriggerSection v-model:triggers="formData.triggers as any" />
      <ActionSection v-model:actions="formData.actions as any" />
    </Form>
  </Drawer>
</template>
