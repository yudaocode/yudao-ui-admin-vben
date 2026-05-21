<script lang="ts" setup>
import type { IotSceneRule, RuleSceneApi } from '#/api/iot/rule/scene';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import {
  CommonStatusEnum,
  IotRuleSceneActionTypeEnum,
  IotRuleSceneTriggerTypeEnum,
  isDeviceTrigger,
} from '@vben/constants';

import { ElForm, ElMessage } from 'element-plus';

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
const formData = ref<IotSceneRule>(buildEmptyFormData());

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
      const data = { ...formData.value } as IotSceneRule;
      await (data.id ? updateSceneRule(data) : createSceneRule(data));
      await drawerApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
function buildEmptyFormData(): IotSceneRule {
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
function normalizeFormData(result: any): IotSceneRule {
  return {
    ...result,
    triggers: result.triggers?.length
      ? result.triggers
      : buildEmptyFormData().triggers,
    actions: result.actions || [],
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
      if (!trigger.deviceId) {
        callback(new Error(`触发器 ${i + 1}：设备不能为空`));
        return;
      }
      if (!trigger.identifier) {
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
    if (
      trigger.type === IotRuleSceneTriggerTypeEnum.TIMER &&
      !trigger.cronExpression
    ) {
      callback(new Error(`触发器 ${i + 1}：CRON 表达式不能为空`));
      return;
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
      if (!action.deviceId) {
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
    if (
      (action.type === IotRuleSceneActionTypeEnum.ALERT_TRIGGER ||
        action.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER) &&
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
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules as any"
      class="mx-4"
      label-width="110px"
    >
      <BasicInfoSection v-model="formData" />
      <TriggerSection v-model:triggers="formData.triggers as any" />
      <ActionSection v-model:actions="formData.actions as any" />
    </ElForm>
  </Drawer>
</template>
