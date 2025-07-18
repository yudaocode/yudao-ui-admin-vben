<script setup lang="ts">
import type { AnalysisOverviewItem } from '../typing';

import { computed } from 'vue';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  VbenCountToAnimator,
  VbenIcon,
} from '@vben-core/shadcn-ui';

interface Props {
  items?: AnalysisOverviewItem[];
  modelValue?: AnalysisOverviewItem[];
  columnsNumber?: number;
}

defineOptions({
  name: 'AnalysisOverview',
});

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  modelValue: () => [],
  columnsNumber: 4,
});

const emit = defineEmits(['update:modelValue']);

const itemsData = computed({
  get: () => (props.modelValue?.length ? props.modelValue : props.items),
  set: (value) => emit('update:modelValue', value),
});

// 计算动态的grid列数类名
const gridColumnsClass = computed(() => {
  const colNum = props.columnsNumber;
  return {
    'lg:grid-cols-1': colNum === 1,
    'lg:grid-cols-2': colNum === 2,
    'lg:grid-cols-3': colNum === 3,
    'lg:grid-cols-4': colNum === 4,
    'lg:grid-cols-5': colNum === 5,
    'lg:grid-cols-6': colNum === 6,
  };
});

// 计算环比增长率
const calculateGrowthRate = (
  currentValue: number,
  previousValue: number,
): { isPositive: boolean; rate: number } => {
  if (previousValue === 0) {
    return { rate: currentValue > 0 ? 100 : 0, isPositive: currentValue >= 0 };
  }

  const rate = ((currentValue - previousValue) / previousValue) * 100;
  return { rate: Math.abs(rate), isPositive: rate >= 0 };
};

// 格式化增长率显示
const formatGrowthRate = (rate: number): string => {
  return rate.toFixed(1);
};
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2" :class="gridColumnsClass">
    <template v-for="item in itemsData" :key="item.title">
      <Card :title="item.title" class="w-full">
        <CardHeader>
          <CardTitle class="text-xl">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span>{{ item.title }}</span>
                <span v-if="item.tooltip" class="ml-1 inline-block">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div
                          class="inline-flex h-4 w-4 translate-y-[-3px] items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600"
                        >
                          !
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{{ item.tooltip }}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
              </div>

              <!-- 环比增长率显示在右上角 -->
              <div
                v-if="item.showGrowthRate && item.totalValue !== undefined"
                class="flex items-center space-x-1"
              >
                <VbenIcon
                  :icon="
                    calculateGrowthRate(item.value, item.totalValue).isPositive
                      ? 'lucide:trending-up'
                      : 'lucide:trending-down'
                  "
                  class="size-4"
                  :class="[
                    calculateGrowthRate(item.value, item.totalValue).isPositive
                      ? 'text-green-500'
                      : 'text-red-500',
                  ]"
                />
                <span
                  class="text-sm font-medium"
                  :class="[
                    calculateGrowthRate(item.value, item.totalValue).isPositive
                      ? 'text-green-500'
                      : 'text-red-500',
                  ]"
                >
                  {{
                    calculateGrowthRate(item.value, item.totalValue).isPositive
                      ? '+'
                      : '-'
                  }}{{
                    formatGrowthRate(
                      calculateGrowthRate(item.value, item.totalValue).rate,
                    )
                  }}%
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent class="flex items-center justify-between">
          <VbenCountToAnimator
            :end-val="item.value"
            :start-val="1"
            class="text-xl"
            prefix=""
          />
          <VbenIcon :icon="item.icon" class="size-8 flex-shrink-0" />
        </CardContent>
        <CardFooter v-if="item.totalTitle" class="justify-between">
          <span>{{ item.totalTitle }}</span>
          <VbenCountToAnimator
            :end-val="item.totalValue"
            :start-val="1"
            prefix=""
          />
        </CardFooter>
      </Card>
    </template>
  </div>
</template>
