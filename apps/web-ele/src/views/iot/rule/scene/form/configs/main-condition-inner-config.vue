<script setup lang="ts">
import type { RuleSceneApi } from '#/api/iot/rule/scene';

import { computed, ref } from 'vue';

import {
  getTriggerTypeLabel,
  IoTDeviceStatusEnum,
  IotRuleSceneTriggerConditionParameterOperatorEnum,
  IotRuleSceneTriggerTypeEnum,
  triggerTypeOptions,
} from '@vben/constants';

import { useVModel } from '@vueuse/core';
import {
  ElCol,
  ElFormItem,
  ElInput,
  ElOption,
  ElRow,
  ElSelect,
} from 'element-plus';

import JsonParamsInput from '../inputs/json-params-input.vue';
import ValueInput from '../inputs/value-input.vue';
import DeviceSelector from '../selectors/device-selector.vue';
import OperatorSelector from '../selectors/operator-selector.vue';
import ProductSelector from '../selectors/product-selector.vue';
import PropertySelector from '../selectors/property-selector.vue';

/** 主条件内部配置组件 */
defineOptions({ name: 'MainConditionInnerConfig' });

const props = defineProps<{
  modelValue: RuleSceneApi.Trigger;
  triggerType: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: RuleSceneApi.Trigger): void;
  (e: 'triggerTypeChange', value: number): void;
}>();

/** 获取设备状态变更选项（用于触发器配置） */
const deviceStatusChangeOptions = [
  {
    label: IoTDeviceStatusEnum.ONLINE.label,
    value: IoTDeviceStatusEnum.ONLINE.value,
  },
  {
    label: IoTDeviceStatusEnum.OFFLINE.label,
    value: IoTDeviceStatusEnum.OFFLINE.value,
  },
];

const condition = useVModel(props, 'modelValue', emit);
const propertyType = ref(''); // 属性类型
const propertyConfig = ref<any>(null); // 属性配置

// 计算属性：是否为设备属性触发器
const isDevicePropertyTrigger = computed(() => {
  return (
    props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST ||
    props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST ||
    props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
  );
});

// 计算属性：是否为设备状态触发器
const isDeviceStatusTrigger = computed(() => {
  return props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_STATE_UPDATE;
});

// 计算属性：是否需要操作符选择（服务调用和事件上报不需要操作符）
const needsOperatorSelector = computed(() => {
  const noOperatorTriggerTypes = [
    IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE,
    IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST,
  ] as number[];
  return !noOperatorTriggerTypes.includes(props.triggerType);
});

// 计算属性：是否需要宽列布局（服务调用和事件上报不需要操作符列，所以值输入列更宽）
const isWideValueColumn = computed(() => {
  const wideColumnTriggerTypes = [
    IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE,
    IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST,
  ] as number[];
  return wideColumnTriggerTypes.includes(props.triggerType);
});

// 计算属性：值输入字段的标签文本
const valueInputLabel = computed(() => {
  return props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
    ? '服务参数'
    : '比较值';
});

// 计算属性：服务配置 - 用于 JsonParamsInput
const serviceConfig = computed(() => {
  if (
    propertyConfig.value &&
    props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
  ) {
    return {
      service: {
        name: propertyConfig.value.name || '服务',
        inputParams: propertyConfig.value.inputParams || [],
      },
    };
  }
  return undefined;
});

/**
 * 更新条件字段
 * @param field 字段名
 * @param value 字段值
 */
function updateConditionField(field: any, value: any) {
  (condition.value as any)[field] = value;
}

/**
 * 处理触发器类型变化事件
 * @param type 触发器类型
 */
function handleTriggerTypeChange(type: number) {
  emit('triggerTypeChange', type);
}

/** 处理产品变化事件 */
function handleProductChange() {
  const trigger = condition.value;
  trigger.deviceId = undefined;
  trigger.identifier = '';
  trigger.operator = undefined;
  // 主条件比较值字段是 Trigger.value（不是 TriggerCondition.param）
  trigger.value = '';
  propertyType.value = '';
  propertyConfig.value = null;
}

/** 处理设备变化事件 */
function handleDeviceChange() {
  const trigger = condition.value;
  trigger.identifier = '';
  trigger.operator = undefined;
  trigger.value = '';
  propertyType.value = '';
  propertyConfig.value = null;
}

/**
 * 处理属性变化事件
 * @param propertyInfo 属性信息对象
 */
function handlePropertyChange(propertyInfo: any) {
  if (propertyInfo) {
    propertyType.value = propertyInfo.type;
    propertyConfig.value = propertyInfo.config;

    // 对于事件上报和服务调用，自动设置操作符为 '='
    if (
      props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST ||
      props.triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
    ) {
      condition.value.operator =
        IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.value;
    }
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- 触发事件类型选择 -->
    <ElFormItem label="触发事件类型" required>
      <ElSelect
        :model-value="triggerType"
        @update:model-value="handleTriggerTypeChange"
        placeholder="请选择触发事件类型"
        class="w-full"
      >
        <ElOption
          v-for="option in triggerTypeOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
    </ElFormItem>

    <!-- 设备属性条件配置 -->
    <div v-if="isDevicePropertyTrigger" class="space-y-4">
      <!-- 产品设备选择 -->
      <ElRow :gutter="16">
        <ElCol :span="12">
          <ElFormItem label="产品" required>
            <ProductSelector
              :model-value="condition.productId"
              @update:model-value="
                (value) => updateConditionField('productId', value)
              "
              @change="handleProductChange"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="设备" required>
            <DeviceSelector
              :model-value="condition.deviceId"
              @update:model-value="
                (value) => updateConditionField('deviceId', value)
              "
              :product-id="condition.productId"
              @change="handleDeviceChange"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <!-- 属性配置 -->
      <ElRow :gutter="16">
        <!-- 属性/事件/服务选择 -->
        <ElCol :span="6">
          <ElFormItem label="监控项" required>
            <PropertySelector
              :model-value="condition.identifier"
              @update:model-value="
                (value) => updateConditionField('identifier', value)
              "
              :trigger-type="triggerType"
              :product-id="condition.productId"
              :device-id="condition.deviceId"
              @change="handlePropertyChange"
            />
          </ElFormItem>
        </ElCol>

        <!-- 操作符选择 - 服务调用和事件上报不需要操作符 -->
        <ElCol v-if="needsOperatorSelector" :span="6">
          <ElFormItem label="操作符" required>
            <OperatorSelector
              :model-value="condition.operator"
              @update:model-value="
                (value) => updateConditionField('operator', value)
              "
              :property-type="propertyType"
            />
          </ElFormItem>
        </ElCol>

        <!-- 值输入 -->
        <ElCol :span="isWideValueColumn ? 18 : 12">
          <ElFormItem :label="valueInputLabel" required>
            <!-- 服务调用参数配置 -->
            <JsonParamsInput
              v-if="
                triggerType ===
                IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE
              "
              v-model="condition.value"
              type="service"
              :config="serviceConfig as any"
              placeholder="请输入 JSON 格式的服务参数"
            />
            <!-- 事件上报参数配置：源项目允许标量值或留空表示事件发生即匹配 -->
            <ElInput
              v-else-if="
                triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST
              "
              :model-value="condition.value"
              @update:model-value="
                (value: any) => updateConditionField('value', value)
              "
              placeholder="留空则事件发生即匹配"
            />
            <!-- 普通值输入 -->
            <ValueInput
              v-else
              :model-value="condition.value"
              @update:model-value="
                (value) => updateConditionField('value', value)
              "
              :property-type="propertyType"
              :operator="condition.operator"
              :property-config="propertyConfig"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </div>

    <!-- 设备状态条件配置 -->
    <div v-else-if="isDeviceStatusTrigger" class="space-y-4">
      <!-- 设备状态触发器使用简化的配置 -->
      <ElRow :gutter="16">
        <ElCol :span="12">
          <ElFormItem label="产品" required>
            <ProductSelector
              :model-value="condition.productId"
              @update:model-value="
                (value) => updateConditionField('productId', value)
              "
              @change="handleProductChange"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="设备" required>
            <DeviceSelector
              :model-value="condition.deviceId"
              @update:model-value="
                (value) => updateConditionField('deviceId', value)
              "
              :product-id="condition.productId"
              @change="handleDeviceChange"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="16">
        <ElCol :span="6">
          <ElFormItem label="操作符" required>
            <ElSelect
              :model-value="condition.operator"
              @update:model-value="
                (value: any) => updateConditionField('operator', value)
              "
              placeholder="请选择操作符"
              class="w-full"
            >
              <ElOption
                :label="
                  IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.name
                "
                :value="
                  IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.value
                "
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="参数" required>
            <ElSelect
              :model-value="condition.value"
              @update:model-value="
                (value: any) => updateConditionField('value', value)
              "
              placeholder="请选择操作符"
              class="w-full"
            >
              <ElOption
                v-for="option in deviceStatusChangeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
      </ElRow>
    </div>

    <!-- 其他触发类型的提示 -->
    <div v-else class="py-5 text-center">
      <p class="mb-1 text-sm text-[var(--el-text-color-secondary)]">
        当前触发事件类型：{{ getTriggerTypeLabel(triggerType) }}
      </p>
      <p class="text-xs text-[var(--el-text-color-secondary)]">
        此触发类型暂不需要配置额外条件
      </p>
    </div>
  </div>
</template>
