<script lang="ts" setup>
import type { EChartsOption, EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

defineOptions({ name: 'PmsFavoriteTrendChart' });

const props = defineProps<{ options: EChartsOption }>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

watch(
  () => props.options,
  (options) => renderEcharts(options),
  { deep: true },
);

onMounted(() => renderEcharts(props.options));
</script>

<template>
  <EchartsUI ref="chartRef" height="56px" />
</template>
