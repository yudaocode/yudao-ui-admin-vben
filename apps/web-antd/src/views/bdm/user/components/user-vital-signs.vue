<script setup lang="ts">
import type { VitalSignsApi } from '#/api/member/vitalsigns';

import { Card, Col, Row } from 'ant-design-vue';

import { useDescription } from '#/components/description';

withDefaults(
  defineProps<{ vitalSigns: undefined | VitalSignsApi.VitalSigns }>(),
  {},
);

const [Description] = useDescription({
  componentProps: {
    bordered: false,
    class: 'mx-4',
  },
  schema: [
    {
      field: 'temperature',
      label: '体温',
      content: (data) => data?.temperature || '无数据',
    },
    {
      field: 'pulse',
      label: '心率',
      content: (data) => data?.pulse || '无数据',
    },
    {
      field: 'respiration',
      label: '呼吸',
      content: (data) => data?.respiration || '无数据',
    },
    {
      field: 'bloodPressure',
      label: '血压',
      content: (data) => {
        let result = '';
        result += data?.systolicPressure || '无数据';
        result += ' / ';
        result += data?.diastolicPressure || '无数据';
        return result;
      },
    },
    {
      field: 'pulseOxygenSaturation',
      label: '血氧',
      content: (data) => data?.pulseOxygenSaturation || '无数据',
    },
  ],
});
</script>
<template>
  <Card>
    <template #title>
      <slot name="title"></slot>
    </template>
    <template #extra>
      <slot name="extra"></slot>
    </template>
    <Row>
      <Col>
        <Description :column="1" :data="vitalSigns" />
      </Col>
    </Row>
  </Card>
</template>
