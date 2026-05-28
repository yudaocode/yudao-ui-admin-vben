<!-- 属性选择器组件 -->
<script setup lang="ts">
import type { ThingModelApi } from '#/api/iot/thingmodel';

import { computed, ref, watch } from 'vue';

import {
  getAccessModeLabel,
  getDataTypeName,
  getEventTypeLabel,
  getThingModelServiceCallTypeLabel,
  IotRuleSceneTriggerTypeEnum,
  IoTThingModelTypeEnum,
  THING_MODEL_GROUP_LABELS,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { useVModel } from '@vueuse/core';
import { Button, Popover, Select, Tag } from 'ant-design-vue';

import { getThingModelTSLByProductId } from '#/api/iot/thingmodel';

/** 属性选择器组件 */
defineOptions({ name: 'PropertySelector' });

const props = defineProps<{
  deviceId?: number;
  modelValue?: string;
  productId?: number;
  triggerType: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: { config: any; type: string }): void;
}>();

/** 属性选择器内部使用的统一数据结构 */
interface PropertySelectorItem {
  identifier: string;
  name: string;
  description?: string;
  dataType: string;
  type: number; // IoTThingModelTypeEnum
  accessMode?: string;
  required?: boolean;
  unit?: string;
  range?: string;
  eventType?: string;
  callType?: string;
  inputParams?: ThingModelApi.Param[];
  outputParams?: ThingModelApi.Param[];
  property?: ThingModelApi.Property;
  event?: ThingModelApi.Event;
  service?: ThingModelApi.Service;
}

const localValue = useVModel(props, 'modelValue', emit);

const loading = ref(false);
const propertyList = ref<PropertySelectorItem[]>([]);

/** 触发类型 → 物模型类型 + 分组标签 */
const TRIGGER_TYPE_TO_GROUP: Record<
  number,
  { label: string; modelType: number }
> = {
  [IotRuleSceneTriggerTypeEnum.DEVICE_PROPERTY_POST]: {
    label: THING_MODEL_GROUP_LABELS.PROPERTY,
    modelType: IoTThingModelTypeEnum.PROPERTY,
  },
  [IotRuleSceneTriggerTypeEnum.TIMER]: {
    label: THING_MODEL_GROUP_LABELS.PROPERTY,
    modelType: IoTThingModelTypeEnum.PROPERTY,
  },
  [IotRuleSceneTriggerTypeEnum.DEVICE_EVENT_POST]: {
    label: THING_MODEL_GROUP_LABELS.EVENT,
    modelType: IoTThingModelTypeEnum.EVENT,
  },
  [IotRuleSceneTriggerTypeEnum.DEVICE_SERVICE_INVOKE]: {
    label: THING_MODEL_GROUP_LABELS.SERVICE,
    modelType: IoTThingModelTypeEnum.SERVICE,
  },
};

/** 属性分组：按触发类型筛选属性 / 事件 / 服务 */
const propertyGroups = computed(() => {
  const config = TRIGGER_TYPE_TO_GROUP[props.triggerType];
  if (!config) return [];
  const options = propertyList.value.filter(
    (item) => item.type === config.modelType,
  );
  return options.length > 0 ? [{ label: config.label, options }] : [];
});

/** 当前选中的属性 */
const selectedProperty = computed(() =>
  propertyList.value.find(
    (property) => property.identifier === localValue.value,
  ),
);

/** 处理选择变化事件 */
function handleChange(value: any) {
  const property = propertyList.value.find((item) => item.identifier === value);
  if (property) {
    emit('change', { type: property.dataType, config: property });
  }
}

/** 获取物模型 TSL 数据 */
async function loadThingModelTSL() {
  if (!props.productId) {
    propertyList.value = [];
    return;
  }
  loading.value = true;
  try {
    const tsl = await getThingModelTSLByProductId(props.productId);
    propertyList.value = parseThingModelData(tsl);
  } catch (error) {
    console.error('获取物模型 TSL 失败 ：', error);
    propertyList.value = [];
  } finally {
    loading.value = false;
  }
}

/** 把 TSL 树展平为 PropertySelectorItem[] */
function parseThingModelData(
  tsl?: null | ThingModelApi.ThingModelTSL,
): PropertySelectorItem[] {
  if (!tsl) return [];
  const properties = (tsl.properties ?? []).map<PropertySelectorItem>(
    (prop) => ({
      identifier: prop.identifier!,
      name: prop.name!,
      description: prop.description,
      dataType: prop.dataType!,
      type: IoTThingModelTypeEnum.PROPERTY,
      accessMode: prop.accessMode,
      required: prop.required,
      unit: prop.dataSpecs?.unit,
      range: getPropertyRange(prop),
      property: prop,
    }),
  );
  const events = (tsl.events ?? []).map<PropertySelectorItem>((event) => ({
    identifier: event.identifier!,
    name: event.name!,
    description: event.description,
    dataType: 'struct',
    type: IoTThingModelTypeEnum.EVENT,
    eventType: event.type,
    required: event.required,
    outputParams: event.outputParams,
    event,
  }));
  const services = (tsl.services ?? []).map<PropertySelectorItem>(
    (service) => ({
      identifier: service.identifier!,
      name: service.name!,
      description: service.description,
      dataType: 'struct',
      type: IoTThingModelTypeEnum.SERVICE,
      callType: service.callType,
      required: service.required,
      inputParams: service.inputParams,
      outputParams: service.outputParams,
      service,
    }),
  );
  return [...properties, ...events, ...services];
}

/** 获取属性取值范围：数值型给 min~max；枚举 / 布尔给选项列表 */
function getPropertyRange(
  property: ThingModelApi.Property,
): string | undefined {
  const specs = property.dataSpecs;
  if (specs && specs.min !== undefined && specs.max !== undefined) {
    return `${specs.min}~${specs.max}`;
  }
  if (property.dataSpecsList?.length) {
    return property.dataSpecsList
      .map((item: any) => `${item.name}(${item.value})`)
      .join(', ');
  }
  return undefined;
}

/** 监听产品变化 */
watch(
  () => props.productId,
  () => {
    loadThingModelTSL();
  },
  { immediate: true },
);

/** 监听触发类型变化 */
watch(
  () => props.triggerType,
  () => {
    localValue.value = '';
  },
);
</script>

<template>
  <div class="gap-[8px] flex items-center">
    <Select
      v-model:value="localValue"
      placeholder="请选择监控项"
      show-search
      allow-clear
      @change="handleChange"
      class="!w-[150px]"
      option-label-prop="label"
      :loading="loading"
    >
      <Select.OptGroup
        v-for="group in propertyGroups"
        :key="group.label"
        :label="group.label"
      >
        <Select.Option
          v-for="property in group.options"
          :key="property.identifier"
          :label="property.name"
          :value="property.identifier"
        >
          <div class="py-[2px] flex w-full items-center justify-between">
            <span
              class="text-[14px] font-medium flex-1 truncate text-foreground"
            >
              {{ property.name }}
            </span>
            <Tag class="ml-[8px] flex-shrink-0">
              {{ property.identifier }}
            </Tag>
          </div>
        </Select.Option>
      </Select.OptGroup>
    </Select>

    <!-- 属性详情弹出层 -->
    <Popover
      v-if="selectedProperty"
      placement="rightTop"
      :overlay-style="{ width: '350px' }"
      trigger="click"
      :arrow="true"
      overlay-class-name="property-detail-popover"
    >
      <template #content>
        <!-- 弹出层内容 -->
        <div class="property-detail-content">
          <div class="gap-[8px] mb-[12px] flex items-center">
            <IconifyIcon icon="ep:info-filled" class="text-[16px] text-info" />
            <span class="text-[14px] font-medium text-foreground">
              {{ selectedProperty.name }}
            </span>
            <Tag>
              {{ getDataTypeName(selectedProperty.dataType) }}
            </Tag>
          </div>

          <div class="space-y-[8px] ml-[24px]">
            <div class="gap-[8px] flex items-start">
              <span
                class="text-[12px] min-w-[60px] flex-shrink-0 text-muted-foreground"
              >
                标识符：
              </span>
              <span class="text-[12px] flex-1 text-foreground">
                {{ selectedProperty.identifier }}
              </span>
            </div>

            <div
              v-if="selectedProperty.description"
              class="gap-[8px] flex items-start"
            >
              <span
                class="text-[12px] min-w-[60px] flex-shrink-0 text-muted-foreground"
              >
                描述：
              </span>
              <span class="text-[12px] flex-1 text-foreground">
                {{ selectedProperty.description }}
              </span>
            </div>

            <div
              v-if="selectedProperty.unit"
              class="gap-[8px] flex items-start"
            >
              <span
                class="text-[12px] min-w-[60px] flex-shrink-0 text-muted-foreground"
              >
                单位：
              </span>
              <span class="text-[12px] flex-1 text-foreground">
                {{ selectedProperty.unit }}
              </span>
            </div>

            <div
              v-if="selectedProperty.range"
              class="gap-[8px] flex items-start"
            >
              <span
                class="text-[12px] min-w-[60px] flex-shrink-0 text-muted-foreground"
              >
                取值范围：
              </span>
              <span class="text-[12px] flex-1 text-foreground">
                {{ selectedProperty.range }}
              </span>
            </div>

            <!-- 根据属性类型显示额外信息 -->
            <div
              v-if="
                selectedProperty.type === IoTThingModelTypeEnum.PROPERTY &&
                selectedProperty.accessMode
              "
              class="gap-[8px] flex items-start"
            >
              <span
                class="text-[12px] min-w-[60px] flex-shrink-0 text-muted-foreground"
              >
                访问模式：
              </span>
              <span class="text-[12px] flex-1 text-foreground">
                {{ getAccessModeLabel(selectedProperty.accessMode) }}
              </span>
            </div>

            <div
              v-if="
                selectedProperty.type === IoTThingModelTypeEnum.EVENT &&
                selectedProperty.eventType
              "
              class="gap-[8px] flex items-start"
            >
              <span
                class="text-[12px] min-w-[60px] flex-shrink-0 text-muted-foreground"
              >
                事件类型：
              </span>
              <span class="text-[12px] flex-1 text-foreground">
                {{ getEventTypeLabel(selectedProperty.eventType) }}
              </span>
            </div>

            <div
              v-if="
                selectedProperty.type === IoTThingModelTypeEnum.SERVICE &&
                selectedProperty.callType
              "
              class="gap-[8px] flex items-start"
            >
              <span
                class="text-[12px] min-w-[60px] flex-shrink-0 text-muted-foreground"
              >
                调用类型：
              </span>
              <span class="text-[12px] flex-1 text-foreground">
                {{
                  getThingModelServiceCallTypeLabel(selectedProperty.callType)
                }}
              </span>
            </div>
          </div>
        </div>
      </template>
      <Button
        type="link"
        shape="circle"
        size="small"
        class="flex-shrink-0"
        title="查看属性详情"
      >
        <IconifyIcon icon="ep:info-filled" />
      </Button>
    </Popover>
  </div>
</template>

<style scoped>
:deep(.ant-select-item-option-content) {
  height: auto;
  padding: 6px 20px;
}

.property-detail-content {
  padding: 4px 0;
}

:global(.property-detail-popover) {
  max-width: 400px !important;
}

:global(.property-detail-popover .ant-popover-inner-content) {
  padding: 16px !important;
}
</style>
