<script lang="ts" setup>
import { computed } from 'vue';

import { DICT_TYPE, IoTOtaTaskRecordStatusEnum } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { Card, Col, Row } from 'ant-design-vue';

const props = defineProps<{
  loading?: boolean;
  statistics: Record<string, number>;
}>();

/** 取字典标签（同步） */
function dictLabel(value: number) {
  return getDictLabel(DICT_TYPE.IOT_OTA_TASK_RECORD_STATUS, value);
}

/** 统计项配置 */
const items = computed(() => [
  {
    label: '升级设备总数',
    span: 6,
    color: 'text-blue-500',
    value: Object.values(props.statistics).reduce(
      (sum, count) => sum + (count || 0),
      0,
    ),
  },
  {
    label: dictLabel(IoTOtaTaskRecordStatusEnum.PENDING.value),
    span: 3,
    color: 'text-gray-400',
    value: props.statistics[IoTOtaTaskRecordStatusEnum.PENDING.value] || 0,
  },
  {
    label: dictLabel(IoTOtaTaskRecordStatusEnum.PUSHED.value),
    span: 3,
    color: 'text-blue-400',
    value: props.statistics[IoTOtaTaskRecordStatusEnum.PUSHED.value] || 0,
  },
  {
    label: dictLabel(IoTOtaTaskRecordStatusEnum.UPGRADING.value),
    span: 3,
    color: 'text-yellow-500',
    value: props.statistics[IoTOtaTaskRecordStatusEnum.UPGRADING.value] || 0,
  },
  {
    label: dictLabel(IoTOtaTaskRecordStatusEnum.SUCCESS.value),
    span: 3,
    color: 'text-green-500',
    value: props.statistics[IoTOtaTaskRecordStatusEnum.SUCCESS.value] || 0,
  },
  {
    label: dictLabel(IoTOtaTaskRecordStatusEnum.FAILURE.value),
    span: 3,
    color: 'text-red-500',
    value: props.statistics[IoTOtaTaskRecordStatusEnum.FAILURE.value] || 0,
  },
  {
    label: dictLabel(IoTOtaTaskRecordStatusEnum.CANCELED.value),
    span: 3,
    color: 'text-gray-400',
    value: props.statistics[IoTOtaTaskRecordStatusEnum.CANCELED.value] || 0,
  },
]);
</script>

<template>
  <Card title="升级设备统计" :loading="loading">
    <Row :gutter="20" class="py-5">
      <Col v-for="item in items" :key="item.label" :span="item.span">
        <div
          class="rounded border border-solid border-gray-200 bg-gray-50 p-5 text-center"
        >
          <div class="mb-2 text-3xl font-bold" :class="item.color">
            {{ item.value }}
          </div>
          <div class="text-sm text-gray-600">{{ item.label }}</div>
        </div>
      </Col>
    </Row>
  </Card>
</template>
