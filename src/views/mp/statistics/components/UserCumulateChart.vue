<!-- <template>
  <Card title="累计用户数据" :loading="loading">
    <div ref="chartRef" :style="{ width, height }"></div>
  </Card>
</template>
<script lang="ts" setup>
import { Ref, onMounted, ref, watch } from 'vue'
import { Card } from 'ant-design-vue'
import { useECharts } from '@/hooks/web/useECharts'
import { propTypes } from '@/utils/propTypes'
import { getUserCumulate } from '@/api/mp/statistics'
import { beginOfDay, endOfDay, formatToDateTime } from '@/utils/dateUtil'

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

async function initData() {
  const res = await getUserCumulate({
    accountId: props.accountId,
    date: [formatToDateTime(props.dataTime[0]), formatToDateTime(props.dataTime[1])]
  })
  optionsData.value = res.cumulateUser
}
watch(
  () => props.loading,
  () => {
    if (props.loading) {
      return
    }
    setOptions({
      legend: {
        data: ['累计用户量']
      },
      xAxis: {
        type: 'category',
        data: optionsData.value
      },
      yAxis: {
        minInterval: 1
      },
      series: [
        {
          name: '累计用户量',
          data: [], // 累计用户量的数据
          type: 'line',
          smooth: true
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
