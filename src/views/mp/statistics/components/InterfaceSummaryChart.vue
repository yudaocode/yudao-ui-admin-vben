<!-- <template>
  <Card title="接口分析数据" :loading="loading">
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
      color: ['#67C23A', '#e5323e', '#E6A23C', '#409EFF'],
      legend: {
        data: ['被动回复用户消息的次数', '失败次数', '最大耗时', '总耗时']
      },
      tooltip: {},
      xAxis: {
        data: [] // X 轴的日期范围
      },
      yAxis: {},
      series: [
        {
          name: '被动回复用户消息的次数',
          type: 'bar',
          barGap: 0,
          data: [] // 被动回复用户消息的次数的数据
        },
        {
          name: '失败次数',
          type: 'bar',
          data: [] // 失败次数的数据
        },
        {
          name: '最大耗时',
          type: 'bar',
          data: [] // 最大耗时的数据
        },
        {
          name: '总耗时',
          type: 'bar',
          data: [] // 总耗时的数据
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
