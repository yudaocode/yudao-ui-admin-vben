<script lang="ts" setup>
import type { ThingModelApi } from '#/api/iot/thingmodel';

import {
  getEventTypeLabel,
  getThingModelServiceCallTypeLabel,
  IoTDataSpecsDataTypeEnum,
  IoTThingModelTypeEnum,
} from '@vben/constants';

defineProps<{ data: ThingModelApi.ThingModel }>();
const NUMBER_TYPES = new Set<string>([
  IoTDataSpecsDataTypeEnum.DOUBLE,
  IoTDataSpecsDataTypeEnum.FLOAT,
  IoTDataSpecsDataTypeEnum.INT,
]);
const PLACEHOLDER_TYPES = new Set<string>([
  IoTDataSpecsDataTypeEnum.ARRAY,
  IoTDataSpecsDataTypeEnum.DATE,
  IoTDataSpecsDataTypeEnum.STRUCT,
]);
const LIST_TYPES = new Set<string>([
  IoTDataSpecsDataTypeEnum.BOOL,
  IoTDataSpecsDataTypeEnum.ENUM,
]);
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
      <div>
        {{
          data.property?.dataType === IoTDataSpecsDataTypeEnum.BOOL
            ? '布尔值'
            : '枚举值'
        }}：
      </div>
      <div
        v-for="item in data.property?.dataSpecsList || []"
        :key="String(item.value)"
      >
        {{ item.name }}-{{ item.value }}
      </div>
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
