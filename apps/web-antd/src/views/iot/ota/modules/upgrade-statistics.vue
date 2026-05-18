<script setup lang="ts">
import { computed } from 'vue';

import { Card, Col, Row } from 'ant-design-vue';

import { IoTOtaTaskRecordStatusEnum } from '#/views/iot/utils/constants';

/** OTA 升级设备统计卡片 */
defineOptions({ name: 'IoTOtaUpgradeStatistics' });

const props = defineProps<{
  loading?: boolean;
  statistics: Record<string, number>;
}>();

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
    label: '待推送',
    span: 3,
    color: 'text-gray-400',
    value: props.statistics[IoTOtaTaskRecordStatusEnum.PENDING.value] || 0,
  },
  {
    label: '已推送',
    span: 3,
    color: 'text-blue-400',
    value: props.statistics[IoTOtaTaskRecordStatusEnum.PUSHED.value] || 0,
  },
  {
    label: '正在升级',
    span: 3,
    color: 'text-yellow-500',
    value: props.statistics[IoTOtaTaskRecordStatusEnum.UPGRADING.value] || 0,
  },
  {
    label: '升级成功',
    span: 3,
    color: 'text-green-500',
    value: props.statistics[IoTOtaTaskRecordStatusEnum.SUCCESS.value] || 0,
  },
  {
    label: '升级失败',
    span: 3,
    color: 'text-red-500',
    value: props.statistics[IoTOtaTaskRecordStatusEnum.FAILURE.value] || 0,
  },
  {
    label: '升级取消',
    span: 3,
    color: 'text-gray-400',
    value: props.statistics[IoTOtaTaskRecordStatusEnum.CANCELED.value] || 0,
  },
]);
</script>

<template>
  <Card title="升级设备统计" class="mb-5" :loading="loading">
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
