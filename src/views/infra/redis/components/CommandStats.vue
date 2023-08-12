<script lang="ts" setup>
import type { Ref } from 'vue'
import { ref, watch } from 'vue'
import { Card } from 'ant-design-vue'
import { useECharts } from '@/hooks/web/useECharts'
import { propTypes } from '@/utils/propTypes'

const props = defineProps({
  loading: propTypes.bool.def(true),
  commandStats: propTypes.array.def([]),
  width: propTypes.string.def('100%'),
  height: propTypes.string.def('300px'),
})

const chartRef = ref<HTMLDivElement | null>(null)
const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>)

const optionsData = ref<any[]>(props.commandStats)

watch(
  () => props.loading,
  () => {
    if (props.loading)
      return

    setOptions({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b} : {c} ({d}%)',
      },
      series: [
        {
          name: '命令',
          type: 'pie',
          roseType: 'radius',
          radius: [15, 95],
          center: ['50%', '38%'],
          data: optionsData.value,
          animationEasing: 'cubicInOut',
          animationDuration: 1000,
        },
      ],
    })
  },
  { immediate: true },
)
</script>

<template>
  <Card title="命令统计" :loading="loading">
    <div ref="chartRef" :style="{ width, height }" />
  </Card>
</template>
