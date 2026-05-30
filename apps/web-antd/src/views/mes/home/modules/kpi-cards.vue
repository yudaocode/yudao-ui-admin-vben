<script lang="ts" setup>
import type { MesHomeApi } from '#/api/mes/home';

import { computed } from 'vue';

import { CountTo } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Card, Col, Divider, Row } from 'ant-design-vue';

defineOptions({ name: 'MesHomeKpiCards' });

const props = defineProps<{
  summary: MesHomeApi.Summary;
}>();

const emit = defineEmits<{
  navigate: [name: string];
}>();

/** 是否有质量数据（合格品 + 不良品 > 0） */
const hasQualityData = computed(
  () =>
    props.summary.todayQualifiedQuantity +
      props.summary.todayUnqualifiedQuantity >
    0,
);

/** 质量合格率 = 合格品 / (合格品 + 不良品) * 100，无数据时为 0 */
const qualityRate = computed(() => {
  const total =
    props.summary.todayQualifiedQuantity +
    props.summary.todayUnqualifiedQuantity;
  if (total === 0) {
    return 0;
  }
  return (props.summary.todayQualifiedQuantity / total) * 100;
});
</script>

<template>
  <Row :gutter="16">
    <Col :lg="6" :md="12" :sm="12" :xl="6" :xs="24" class="mb-4">
      <Card
        class="kpi-card cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
        @click="emit('navigate', 'MesProWorkOrder')"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex size-14 flex-shrink-0 items-center justify-center rounded-xl text-white"
            style="background: linear-gradient(135deg, #409eff, #66b1ff)"
          >
            <IconifyIcon class="size-7" icon="lucide:file-text" />
          </div>
          <div>
            <div class="text-muted-foreground mb-1 text-sm">生产工单</div>
            <div class="flex items-baseline gap-1">
              <CountTo
                class="text-2xl font-bold leading-tight text-[#409eff]"
                :end-val="summary.workOrderActiveCount"
                :duration="1500"
              />
              <span class="text-muted-foreground text-xs">进行中</span>
            </div>
            <div class="text-muted-foreground mt-1 text-xs">
              <span>待排产 {{ summary.workOrderPrepareCount }}</span>
              <Divider type="vertical" />
              <span>已完成 {{ summary.workOrderFinishedCount }}</span>
            </div>
          </div>
        </div>
      </Card>
    </Col>
    <Col :lg="6" :md="12" :sm="12" :xl="6" :xs="24" class="mb-4">
      <Card
        class="kpi-card cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
        @click="emit('navigate', 'MesProFeedback')"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex size-14 flex-shrink-0 items-center justify-center rounded-xl text-white"
            style="background: linear-gradient(135deg, #67c23a, #85ce61)"
          >
            <IconifyIcon class="size-7" icon="lucide:bar-chart-3" />
          </div>
          <div>
            <div class="text-muted-foreground mb-1 text-sm">今日产量</div>
            <div class="flex items-baseline gap-1">
              <CountTo
                class="text-2xl font-bold leading-tight text-[#67c23a]"
                :end-val="summary.todayOutput"
                :duration="1500"
              />
              <span class="text-muted-foreground text-xs">件</span>
            </div>
            <div class="text-muted-foreground mt-1 text-xs">
              <span>昨日 {{ summary.yesterdayOutput }} 件</span>
            </div>
          </div>
        </div>
      </Card>
    </Col>
    <Col :lg="6" :md="12" :sm="12" :xl="6" :xs="24" class="mb-4">
      <Card
        class="kpi-card cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
        @click="emit('navigate', 'MesProFeedback')"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex size-14 flex-shrink-0 items-center justify-center rounded-xl text-white"
            style="background: linear-gradient(135deg, #e6a23c, #ebb563)"
          >
            <IconifyIcon class="size-7" icon="lucide:circle-check" />
          </div>
          <div>
            <div class="text-muted-foreground mb-1 text-sm">质量合格率</div>
            <div class="flex items-baseline gap-1">
              <CountTo
                class="text-2xl font-bold leading-tight text-[#e6a23c]"
                :decimals="1"
                :end-val="qualityRate"
                :duration="1500"
              />
              <span class="text-muted-foreground text-xs">%</span>
            </div>
            <div class="text-muted-foreground mt-1 text-xs">
              <template v-if="hasQualityData">
                <span>合格 {{ summary.todayQualifiedQuantity }}</span>
                <Divider type="vertical" />
                <span>不良 {{ summary.todayUnqualifiedQuantity }}</span>
              </template>
              <span v-else>暂无数据</span>
            </div>
          </div>
        </div>
      </Card>
    </Col>
    <Col :lg="6" :md="12" :sm="12" :xl="6" :xs="24" class="mb-4">
      <Card
        class="kpi-card cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg"
        @click="emit('navigate', 'MesDvMachinery')"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex size-14 flex-shrink-0 items-center justify-center rounded-xl text-white"
            style="background: linear-gradient(135deg, #7c3aed, #9461f5)"
          >
            <IconifyIcon class="size-7" icon="lucide:cpu" />
          </div>
          <div>
            <div class="text-muted-foreground mb-1 text-sm">设备状态</div>
            <div class="flex items-baseline gap-1">
              <CountTo
                class="text-2xl font-bold leading-tight text-[#7c3aed]"
                :end-val="summary.machineryProducing"
                :duration="1500"
              />
              <span class="text-muted-foreground text-xs">
                / {{ summary.machineryTotal }} 运行中
              </span>
            </div>
            <div class="text-muted-foreground mt-1 text-xs">
              <span class="text-red-400">停机 {{ summary.machineryStop }}</span>
              <Divider type="vertical" />
              <span class="text-orange-400">
                维护 {{ summary.machineryMaintenance }}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Col>
  </Row>
</template>
