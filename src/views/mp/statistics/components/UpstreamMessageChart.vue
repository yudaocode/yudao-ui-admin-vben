<!-- <template>
  <Card title="消息概况数据" :loading="loading">
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
  newUser: propTypes.array,
  cancelUser: propTypes.array,
  width: propTypes.string.def('100%'),
  height: propTypes.string.def('300px')
})

const chartRef = ref<HTMLDivElement | null>(null)
const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>)

const newUserData = ref<any[]>(props.newUser)
const cancelUserData = ref<any[]>(props.cancelUser)

watch(
  () => props.loading,
  () => {
    if (props.loading) {
      return
    }
    setOptions({
      color: ['#67C23A', '#e5323e'],
      legend: {
        data: ['用户发送人数', '用户发送条数']
      },
      tooltip: {},
      xAxis: {
        data: [] // X 轴的日期范围
      },
      yAxis: {
        minInterval: 1
      },
      series: [
        {
          name: '用户发送人数',
          type: 'line',
          smooth: true,
          data: newUserData.value // 用户发送人数的数据
        },
        {
          name: '用户发送条数',
          type: 'line',
          smooth: true,
          data: cancelUserData.value // 用户发送条数的数据
        }
      ]
    })
  },
  { immediate: true }
)
</script> -->
<template>
  <div>开发中</div>
</template>
