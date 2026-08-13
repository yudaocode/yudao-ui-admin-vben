<script lang="ts" setup>
import type { FmsHomeApi } from '#/api/fms/home';

import { nextTick, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button } from 'ant-design-vue';

import { formatAmount } from '#/views/fms/utils/format';

defineOptions({ name: 'FmsHomeMetricCards' });

const props = defineProps<{
  home?: FmsHomeApi.Home;
  selectedMetricKey?: string;
}>();

const emit = defineEmits<{
  select: [metric: FmsHomeApi.HomeMetric];
}>();

const cardScrollerRef = ref<HTMLElement>(); // 指标卡片横向滚动容器
const canScrollLeft = ref(false); // 是否可以向左滚动
const canScrollRight = ref(false); // 是否可以向右滚动
const CARD_SCROLL_OFFSET = 468; // 单次滚动的卡片组宽度（两个卡片宽度 + 间距）

watch(
  () => props.home?.metrics,
  () => nextTick(updateScrollState),
  { immediate: true },
);

/** 更新左右滚动按钮的可用状态 */
function updateScrollState() {
  const scroller = cardScrollerRef.value;
  if (!scroller) return;
  canScrollLeft.value = scroller.scrollLeft > 1;
  canScrollRight.value =
    scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1;
}

/** 按一个卡片组的宽度滚动指标卡片 */
function scrollCards(direction: -1 | 1) {
  cardScrollerRef.value?.scrollBy({
    left: direction * CARD_SCROLL_OFFSET,
    behavior: 'smooth',
  });
}
</script>

<template>
  <div>
    <div class="border-border flex items-center justify-between border-b pb-3.5">
      <div class="text-[18px] font-semibold">财务指标</div>
      <div class="text-muted-foreground text-[13px]">
        {{ home?.currentMonth }} 当期数据
      </div>
    </div>

    <div class="mt-6 flex items-center gap-3">
      <Button
        :disabled="!canScrollLeft"
        shape="circle"
        @click="scrollCards(-1)"
      >
        <IconifyIcon icon="lucide:arrow-left" />
      </Button>
      <div
        ref="cardScrollerRef"
        class="metric-card-scroller flex min-w-0 flex-1 gap-3.5 overflow-x-auto py-1"
        @scroll="updateScrollState"
      >
        <button
          v-for="metric in home?.metrics || []"
          :key="metric.key"
          class="border-border bg-card hover:border-primary h-[108px] w-[220px] flex-none rounded-md border px-5 text-left shadow-sm transition-all"
          :class="{
            'border-primary bg-primary text-white shadow-md':
              selectedMetricKey === metric.key,
          }"
          type="button"
          @click="emit('select', metric)"
        >
          <div class="truncate text-[15px] font-semibold">
            {{ metric.name }}
          </div>
          <div class="mt-2.5 truncate text-[22px] font-semibold">
            {{ formatAmount(metric.amount) }}
          </div>
        </button>
      </div>
      <Button :disabled="!canScrollRight" shape="circle" @click="scrollCards(1)">
        <IconifyIcon icon="lucide:arrow-right" />
      </Button>
    </div>
  </div>
</template>

<style scoped>
.metric-card-scroller {
  scrollbar-width: none;
}

.metric-card-scroller::-webkit-scrollbar {
  display: none;
}
</style>
