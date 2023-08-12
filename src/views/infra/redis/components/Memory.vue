<script lang="ts" setup>
import type { Ref } from 'vue'
import { ref, watch } from 'vue'
import { Card } from 'ant-design-vue'
import { useECharts } from '@/hooks/web/useECharts'
import { propTypes } from '@/utils/propTypes'

const props = defineProps({
  loading: propTypes.bool.def(true),
  memoryHuman: propTypes.string.def('0'),
  width: propTypes.string.def('100%'),
  height: propTypes.string.def('300px'),
})

const chartRef = ref<HTMLDivElement | null>(null)
const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>)

watch(
  () => props.loading,
  () => {
    if (props.loading)
      return

    setOptions({
      tooltip: {
        formatter: `{b} <br/>{a} : ${props.memoryHuman}`,
      },
      series: [
        {
          name: '峰值',
          type: 'gauge',
          min: 0,
          max: 100,
          detail: {
            formatter: props.memoryHuman,
          },
          data: [
            {
              value: Number.parseFloat(props.memoryHuman),
              name: '内存消耗',
            },
          ],
        },
      ],
    })
  },
  { immediate: true },
)
</script>

<template>
  <Card title="内存信息" :loading="loading">
    <div ref="chartRef" :style="{ width, height }" />
  </Card>
</template>
