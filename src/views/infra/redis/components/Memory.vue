<template>
  <Card title="内存信息" :loading="loading">
    <div ref="chartRef" :style="{ width, height }"></div>
  </Card>
</template>
<script lang="ts" setup>
import { Ref, ref, watch } from 'vue'
import { Card } from 'ant-design-vue'
import { useECharts } from '@/hooks/web/useECharts'
import { propTypes } from '@/utils/propTypes'

const props = defineProps({
  loading: Boolean,
  memoryHuman: String,
  width: propTypes.string.def('100%'),
  height: propTypes.string.def('300px')
})

const chartRef = ref<HTMLDivElement | null>(null)
const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>)

watch(
  () => props.loading,
  () => {
    if (props.loading) {
      return
    }
    setOptions({
      tooltip: {
        formatter: '{b} <br/>{a} : ' + props.memoryHuman
      },
      series: [
        {
          name: '峰值',
          type: 'gauge',
          min: 0,
          max: 100,
          detail: {
            formatter: props.memoryHuman
          },
          data: [
            {
              value: parseFloat(props.memoryHuman as unknown as number),
              name: '内存消耗'
            }
          ]
        }
      ]
    })
  },
  { immediate: true }
)
</script>
