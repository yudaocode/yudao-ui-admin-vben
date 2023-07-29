<!-- <template>
  <Card title="用户增减数据" :loading="loading">
    <div ref="chartRef" :style="{ width, height }"></div>
  </Card>
</template>
<script lang="ts" setup>
import { Ref, onMounted, ref, watch } from 'vue'
import { Card } from 'ant-design-vue'
import { useECharts } from '@/hooks/web/useECharts'
import { propTypes } from '@/utils/propTypes'
import { getUserSummary } from '@/api/mp/statistics'
import { addTime, beginOfDay, betweenDay, endOfDay, formatDate, formatToDateTime } from '@/utils/dateUtil'

const props = defineProps({
  loading: Boolean,
  accountId: propTypes.number,
  dataTime: {
    type: Array as PropType<Date[]>,
    default: () => [
      beginOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24 * 7)), // -7 天
      endOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24))
    ]
  },
  width: propTypes.string.def('100%'),
  height: propTypes.string.def('300px')
})

const chartRef = ref<HTMLDivElement | null>(null)
const { setOptions } = useECharts(chartRef as Ref<HTMLDivElement>)

const optionsData = ref()

const xAxisDate = ref()

async function initData() {
  const res = await getUserSummary({
    accountId: props.accountId,
    date: [formatToDateTime(props.dataTime[0]), formatToDateTime(props.dataTime[1])]
  })
  optionsData.value = res
  xAxisDate.value = []
  const days = betweenDay(props.dataTime[0], props.dataTime[1]) // 相差天数
  for (let i = 0; i <= days; i++) {
    xAxisDate.value.push(formatDate(addTime(props.dataTime[0], 3600 * 1000 * 24 * i), 'yyyy-MM-dd'))
  }
}
watch(
  () => props.loading,
  () => {
    if (props.loading) {
      return
    }
    setOptions({
      color: ['#67C23A', '#e5323e'],
      legend: {
        data: ['新增用户', '取消关注的用户']
      },
      tooltip: {},
      xAxis: {
        data: xAxisDate.value // X 轴的日期范围
      },
      yAxis: {
        minInterval: 1
      },
      series: [
        {
          name: '新增用户',
          type: 'bar',
          barGap: 0,
          data: optionsData.value.newUserData // 新增用户的数据
        },
        {
          name: '取消关注的用户',
          type: 'bar',
          data: optionsData.value.cancelUserData // 取消关注的用户的数据
        }
      ]
    })
  },
  { immediate: true }
)

onMounted(async () => {
  await initData()
})
</script> -->
<template>
  <div>开发中</div>
</template>
