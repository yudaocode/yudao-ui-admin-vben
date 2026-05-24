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
import { Col, Form, Input, Row, Select } from 'ant-design-vue';

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
    <Form.Item label="触发事件类型" required>
      <Select
        :value="triggerType"
        @change="(value: any) => handleTriggerTypeChange(value)"
        placeholder="请选择触发事件类型"
        class="w-full"
      >
        <Select.Option
          v-for="option in triggerTypeOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </Select.Option>
      </Select>
    </Form.Item>

    <!-- 设备属性条件配置 -->
    <div v-if="isDevicePropertyTrigger" class="space-y-4">
      <!-- 产品设备选择 -->
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="产品" required>
            <ProductSelector
              :model-value="condition.productId"
              @update:model-value="
                (value) => updateConditionField('productId', value)
              "
              @change="handleProductChange"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="设备" required>
            <DeviceSelector
              :model-value="condition.deviceId"
              @update:model-value="
                (value) => updateConditionField('deviceId', value)
              "
              :product-id="condition.productId"
              @change="handleDeviceChange"
            />
          </Form.Item>
        </Col>
      </Row>

      <!-- 属性配置 -->
      <Row :gutter="16">
        <!-- 属性/事件/服务选择 -->
        <Col :span="6">
          <Form.Item label="监控项" required>
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
          </Form.Item>
        </Col>

        <!-- 操作符选择 - 服务调用和事件上报不需要操作符 -->
        <Col v-if="needsOperatorSelector" :span="6">
          <Form.Item label="操作符" required>
            <OperatorSelector
              :model-value="condition.operator"
              @update:model-value="
                (value) => updateConditionField('operator', value)
              "
              :property-type="propertyType"
            />
          </Form.Item>
        </Col>

        <!-- 值输入 -->
        <Col :span="isWideValueColumn ? 18 : 12">
          <Form.Item :label="valueInputLabel" required>
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
            <Input
              v-else-if="
                triggerType === IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST
              "
              :value="condition.value"
              @update:value="
                (value) => updateConditionField('value', value)
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
          </Form.Item>
        </Col>
      </Row>
    </div>

    <!-- 设备状态条件配置 -->
    <div v-else-if="isDeviceStatusTrigger" class="space-y-4">
      <!-- 设备状态触发器使用简化的配置 -->
      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="产品" required>
            <ProductSelector
              :model-value="condition.productId"
              @update:model-value="
                (value) => updateConditionField('productId', value)
              "
              @change="handleProductChange"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="设备" required>
            <DeviceSelector
              :model-value="condition.deviceId"
              @update:model-value="
                (value) => updateConditionField('deviceId', value)
              "
              :product-id="condition.productId"
              @change="handleDeviceChange"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row :gutter="16">
        <Col :span="6">
          <Form.Item label="操作符" required>
            <Select
              :value="condition.operator"
              @change="(value: any) => updateConditionField('operator', value)"
              placeholder="请选择操作符"
              class="w-full"
            >
              <Select.Option
                :value="
                  IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.value
                "
              >
                {{
                  IotRuleSceneTriggerConditionParameterOperatorEnum.EQUALS.name
                }}
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col :span="6">
          <Form.Item label="参数" required>
            <Select
              :value="condition.value"
              @change="(value: any) => updateConditionField('value', value)"
              placeholder="请选择操作符"
              class="w-full"
            >
              <Select.Option
                v-for="option in deviceStatusChangeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </div>

    <!-- 其他触发类型的提示 -->
    <div v-else class="py-5 text-center">
      <p class="mb-1 text-sm text-muted-foreground">
        当前触发事件类型：{{ getTriggerTypeLabel(triggerType) }}
      </p>
      <p class="text-xs text-muted-foreground">
        此触发类型暂不需要配置额外条件
      </p>
    </div>
  </div>
</template>
