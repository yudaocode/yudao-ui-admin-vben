<!-- 执行器配置组件 -->
<script setup lang="ts">
import type { RuleSceneApi } from '#/api/iot/rule/scene';

import {
  getActionTypeLabel,
  getActionTypeOptions,
  IotRuleSceneActionTypeEnum,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { getStableObjectKey } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { Button, Card, Empty, Form, Select, Tag } from 'ant-design-vue';

import AlertConfig from '../configs/alert-config.vue';
import DeviceControlConfig from '../configs/device-control-config.vue';

/** 执行器配置组件 */
defineOptions({ name: 'ActionSection' });

const props = defineProps<{
  actions: RuleSceneApi.Action[];
}>();

const emit = defineEmits<{
  (e: 'update:actions', value: RuleSceneApi.Action[]): void;
}>();

const actions = useVModel(props, 'actions', emit);

/** 获取执行器标签颜色（antd Tag `color`） */
function getActionTypeColor(
  type: number,
): 'default' | 'error' | 'processing' | 'success' | 'warning' {
  const actionTypeTags: Record<
    number,
    'default' | 'error' | 'processing' | 'success' | 'warning'
  > = {
    [IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET]: 'processing',
    [IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE]: 'success',
    [IotRuleSceneActionTypeEnum.ALERT_TRIGGER]: 'error',
    [IotRuleSceneActionTypeEnum.ALERT_RECOVER]: 'warning',
  } as const;
  return actionTypeTags[type] || 'default';
}

/** 判断是否为设备执行器类型 */
function isDeviceAction(type: number): boolean {
  const deviceActionTypes = [
    IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET,
    IotRuleSceneActionTypeEnum.DEVICE_SERVICE_INVOKE,
  ] as number[];
  return deviceActionTypes.includes(type);
}

/** 判断是否为告警执行器类型 */
function isAlertAction(type: number): boolean {
  const alertActionTypes = [
    IotRuleSceneActionTypeEnum.ALERT_TRIGGER,
    IotRuleSceneActionTypeEnum.ALERT_RECOVER,
  ] as number[];
  return alertActionTypes.includes(type);
}

/**
 * 创建默认的执行器数据
 * @returns 默认执行器对象
 */
function createDefaultActionData(): RuleSceneApi.Action {
  return {
    type: IotRuleSceneActionTypeEnum.DEVICE_PROPERTY_SET, // 默认为设备属性设置
    productId: undefined,
    deviceId: undefined,
    identifier: undefined, // 物模型标识符（服务调用时使用）
    params: undefined,
    alertConfigId: undefined,
  };
}

/**
 * 添加执行器
 */
function addAction() {
  const newAction = createDefaultActionData();
  actions.value.push(newAction);
}

/**
 * 删除执行器
 * @param index 执行器索引
 */
function removeAction(index: number) {
  actions.value.splice(index, 1);
}

/**
 * 更新执行器类型
 * @param index 执行器索引
 * @param type 执行器类型
 */
function updateActionType(index: number, type: number) {
  const action = actions.value[index] as RuleSceneApi.Action;
  onActionTypeChange(action, type); // 须在赋新值前调用 ，内部依赖 action.type 旧值
  action.type = type;
}

/**
 * 更新执行器
 * @param index 执行器索引
 * @param action 执行器对象
 */
function updateAction(index: number, action: RuleSceneApi.Action) {
  actions.value[index] = action;
}

/**
 * 更新告警配置
 * @param index 执行器索引
 * @param alertConfigId 告警配置ID
 */
function updateActionAlertConfig(index: number, alertConfigId?: number) {
  actions.value[index]!.alertConfigId = alertConfigId;
}

/**
 * 监听执行器类型变化
 * @param action 执行器对象
 * @param type 执行器类型
 */
function onActionTypeChange(action: RuleSceneApi.Action, type: number) {
  if (isDeviceAction(type)) {
    // 设备控制类型：清理告警配置，确保设备参数存在
    action.alertConfigId = undefined;
    if (!action.params) {
      action.params = '';
    }
    // 切换到设备控制类型时清空 identifier，让用户重新选择
    if (action.identifier) {
      action.identifier = undefined;
    }
  } else if (isAlertAction(type)) {
    action.productId = undefined;
    action.deviceId = undefined;
    action.identifier = undefined;
    action.params = undefined;
    action.alertConfigId = undefined;
  }
}
</script>

<template>
  <Card class="rounded-lg border border-primary" shadow="never">
    <template #title>
      <div class="flex items-center justify-between">
        <div class="gap-[8px] flex items-center">
          <IconifyIcon icon="ep:setting" class="text-[18px] text-primary" />
          <span class="text-[16px] font-semibold text-foreground">
            执行器配置
          </span>
          <Tag color="default"> {{ actions.length }} 个执行器 </Tag>
        </div>
        <div class="gap-[8px] flex items-center">
          <Button type="primary" size="small" @click="addAction">
            <IconifyIcon icon="ep:plus" />
            添加执行器
          </Button>
        </div>
      </div>
    </template>

    <div class="p-0">
      <!-- 空状态 -->
      <div v-if="actions.length === 0">
        <Empty description="暂无执行器配置">
          <Button type="primary" @click="addAction">
            <IconifyIcon icon="ep:plus" />
            添加第一个执行器
          </Button>
        </Empty>
      </div>

      <!-- 执行器列表 -->
      <div v-else class="space-y-[24px]">
        <div
          v-for="(action, index) in actions"
          :key="getStableObjectKey(action)"
          class="rounded-lg border border-blue-200 bg-blue-50/40 shadow-sm transition-shadow hover:shadow-md dark:border-blue-900/40 dark:bg-blue-950/20"
        >
          <!-- 执行器头部（蓝色主题） -->
          <div
            class="flex items-center justify-between rounded-t-lg border-b border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 px-4 py-[10px] dark:border-blue-900/40 dark:from-blue-950/30 dark:to-sky-950/30"
          >
            <div class="gap-[10px] flex items-center">
              <div
                class="font-semibold flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300"
              >
                <div
                  class="flex w-[22px] h-[22px] items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white"
                >
                  {{ index + 1 }}
                </div>
                <span>执行器 {{ index + 1 }}</span>
              </div>
              <Tag
                :color="getActionTypeColor(action.type as number)"
                class="font-medium"
              >
                {{ getActionTypeLabel(action.type as number) }}
              </Tag>
            </div>
            <div class="gap-[8px] flex items-center">
              <Button
                v-if="actions.length > 1"
                danger
                size="small"
                type="link"
                class="hover:bg-red-50"
                @click="removeAction(index)"
              >
                <IconifyIcon icon="lucide:trash-2" />
                删除
              </Button>
            </div>
          </div>

          <!-- 执行器内容区域 -->
          <div class="p-[16px] space-y-[16px]">
            <!-- 执行类型选择 -->
            <div class="w-full">
              <Form.Item label="执行类型" required>
                <Select
                  :value="action.type"
                  @change="(value) => updateActionType(index, value as number)"
                  placeholder="请选择执行类型"
                  class="w-full"
                >
                  <Select.Option
                    v-for="option in getActionTypeOptions()"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </Select.Option>
                </Select>
              </Form.Item>
            </div>

            <!-- 设备控制配置 -->
            <DeviceControlConfig
              v-if="isDeviceAction(action.type as number)"
              :model-value="action"
              @update:model-value="(value) => updateAction(index, value)"
            />

            <!-- 告警配置 - 只有恢复告警时才显示 -->
            <AlertConfig
              v-if="action.type === IotRuleSceneActionTypeEnum.ALERT_RECOVER"
              :model-value="action.alertConfigId"
              @update:model-value="
                (value) => updateActionAlertConfig(index, value)
              "
            />

            <!-- 触发告警提示 - 触发告警时显示 -->
            <div
              v-if="action.type === IotRuleSceneActionTypeEnum.ALERT_TRIGGER"
              class="bg-fill-color-blank rounded-lg border border-border p-4"
            >
              <div class="mb-2 flex items-center gap-2">
                <IconifyIcon icon="ep:warning" class="text-base text-warning" />
                <span class="font-semibold text-sm text-foreground">
                  触发告警
                </span>
                <Tag color="warning">自动执行</Tag>
              </div>
              <div class="text-xs leading-relaxed text-muted-foreground">
                当触发条件满足时，系统将自动发送告警通知，可在菜单 [告警中心 ->
                告警配置] 管理。
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加提示 -->
      <div v-if="actions.length > 0" class="py-[16px] text-center">
        <Button type="primary" plain @click="addAction">
          <IconifyIcon icon="ep:plus" />
          继续添加执行器
        </Button>
      </div>
    </div>
  </Card>
</template>
