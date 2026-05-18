<script lang="ts" setup>
import type { ThingModelApi } from '#/api/iot/thingmodel';

import { computed } from 'vue';

import { Tooltip } from 'ant-design-vue';

import {
  getEventTypeLabel,
  getThingModelServiceCallTypeLabel,
  IoTDataSpecsDataTypeEnum,
  IoTThingModelTypeEnum,
} from '#/views/iot/utils/constants';

const NUMBER_TYPES = new Set<string>([
  IoTDataSpecsDataTypeEnum.INT,
  IoTDataSpecsDataTypeEnum.DOUBLE,
  IoTDataSpecsDataTypeEnum.FLOAT,
]);
const PLACEHOLDER_TYPES = new Set<string>([
  IoTDataSpecsDataTypeEnum.ARRAY,
  IoTDataSpecsDataTypeEnum.STRUCT,
  IoTDataSpecsDataTypeEnum.DATE,
]);
const LIST_TYPES = new Set<string>([
  IoTDataSpecsDataTypeEnum.BOOL,
  IoTDataSpecsDataTypeEnum.ENUM,
]);

const props = defineProps<{ data: ThingModelApi.ThingModel }>();

const formattedDataSpecsList = computed(() => {
  if (!props.data.property?.dataSpecsList?.length) {
    return '';
  }
  return props.data.property.dataSpecsList
    .map((item) => `${item.value}-${item.name}`)
    .join('、');
});

const shortText = computed(() => {
  const list = props.data.property?.dataSpecsList;
  if (!list?.length) {
    return '-';
  }
  const first = list[0];
  return list.length > 1
    ? `${first.value}-${first.name} 等 ${list.length} 项`
    : `${first.value}-${first.name}`;
});
</script>

<template>
  <!-- 属性 -->
  <template v-if="data.type === IoTThingModelTypeEnum.PROPERTY">
    <div v-if="NUMBER_TYPES.has(data.property?.dataType as any)">
      取值范围：{{
        `${data.property?.dataSpecs?.min}~${data.property?.dataSpecs?.max}`
      }}
    </div>
    <div v-if="data.property?.dataType === IoTDataSpecsDataTypeEnum.TEXT">
      数据长度：{{ data.property?.dataSpecs?.length }}
    </div>
    <div v-if="PLACEHOLDER_TYPES.has(data.property?.dataType as any)">-</div>
    <div v-if="LIST_TYPES.has(data.property?.dataType as any)">
      <Tooltip :title="formattedDataSpecsList" placement="topLeft">
        <span
          class="cursor-help border-b border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-500"
        >
          {{
            data.property?.dataType === IoTDataSpecsDataTypeEnum.BOOL
              ? '布尔值'
              : '枚举值'
          }}：{{ shortText }}
        </span>
      </Tooltip>
    </div>
  </template>
  <!-- 服务 -->
  <div v-if="data.type === IoTThingModelTypeEnum.SERVICE">
    调用方式：
    {{ getThingModelServiceCallTypeLabel(data.service?.callType as any) }}
  </div>
  <!-- 事件 -->
  <div v-if="data.type === IoTThingModelTypeEnum.EVENT">
    事件类型：{{ getEventTypeLabel(data.event?.type as any) }}
  </div>
</template>
