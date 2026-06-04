<script lang="ts" setup>
import type { RuleSceneApi } from '#/api/iot/rule/scene';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { CommonStatusEnum, IotRuleSceneTriggerTypeEnum } from '@vben/constants';

import { Form, message } from 'ant-design-vue';

import {
  createSceneRule,
  getSceneRule,
  updateSceneRule,
} from '#/api/iot/rule/scene';
import { $t } from '#/locales';
import {
  validateSceneRuleActions,
  validateSceneRuleTriggers,
} from '#/views/iot/utils/scene-rule';

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
    const triggerError = validateSceneRuleTriggers(formData.value.triggers);
    if (triggerError) {
      message.error(triggerError);
      return;
    }
    const actionError = validateSceneRuleActions(formData.value.actions);
    if (actionError) {
      message.error(actionError);
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
  const error = validateSceneRuleTriggers(value);
  if (error) {
    callback(new Error(error));
    return;
  }
  callback();
}

/** 执行器校验 */
function validateActions(_rule: any, value: any, callback: any) {
  const error = validateSceneRuleActions(value);
  if (error) {
    callback(new Error(error));
    return;
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
