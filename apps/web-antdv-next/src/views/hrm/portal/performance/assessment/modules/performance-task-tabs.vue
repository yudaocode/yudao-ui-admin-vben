<script lang="ts" setup>
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input, TabPane, Tabs } from 'antdv-next';

import { HrmPerformanceStageType } from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmPortalPerformanceTaskTabs' });

const props = defineProps<{
  statusTabs: Array<{ count: number; label: string; name: number }>;
  taskCount: HrmPortalPerformanceAssessmentApi.TaskCount;
}>();

const emit = defineEmits<{
  mainChange: [];
  query: [];
  statusChange: [];
}>();

const activeTab = defineModel<number>('activeTab', { required: true });
const activeStatus = defineModel<number>('activeStatus', { required: true });
const keyword = defineModel<string>('keyword', { required: true });
const activeTabKey = computed({
  get: () => String(activeTab.value),
  set: (value: string) => {
    activeTab.value = Number(value);
  },
});
const activeStatusKey = computed({
  get: () => String(activeStatus.value),
  set: (value: string) => {
    activeStatus.value = Number(value);
  },
});

const mainTabs = computed(() => [
  {
    label: '指标填写',
    name: HrmPerformanceStageType.FILL_QUOTA,
    count: props.taskCount.fillPendingCount,
  },
  {
    label: '指标确认',
    name: HrmPerformanceStageType.TARGET_CONFIRM,
    count: props.taskCount.targetPendingCount,
  },
  {
    label: '指标评分',
    name: HrmPerformanceStageType.OTHER_SCORE,
    count: props.taskCount.reviewPendingCount,
  },
  {
    label: '结果审核',
    name: HrmPerformanceStageType.RESULT_AUDIT,
    count: props.taskCount.resultAuditPendingCount,
  },
  {
    label: '结果确认',
    name: HrmPerformanceStageType.RESULT_CONFIRM,
    count: props.taskCount.resultConfirmationPendingCount,
  },
  {
    label: '申诉确认',
    name: HrmPerformanceStageType.APPEAL_CONFIRM,
    count: props.taskCount.appealPendingCount,
  },
]);
</script>

<template>
  <Tabs v-model:active-key="activeTabKey" @change="emit('mainChange')">
    <template #rightExtra>
      <Input
        v-model:value="keyword"
        allow-clear
        class="w-[280px]"
        placeholder="请输入姓名/工号/考核名称"
        @clear="emit('query')"
        @press-enter="emit('query')"
      >
        <template #prefix>
          <IconifyIcon icon="lucide:search" />
        </template>
      </Input>
    </template>
    <TabPane v-for="item in mainTabs" :key="String(item.name)">
      <template #tab>
        <span>
          {{ item.label }}
          <i
            v-if="item.count"
            class="bg-primary ml-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] text-white not-italic"
          >
            {{ item.count }}
          </i>
        </span>
      </template>
    </TabPane>
  </Tabs>

  <Tabs v-model:active-key="activeStatusKey" @change="emit('statusChange')">
    <TabPane v-for="item in statusTabs" :key="String(item.name)">
      <template #tab>
        <span>
          {{ item.label }}
          <span v-if="item.count > 0" class="text-primary ml-1">
            {{ item.count }}
          </span>
        </span>
      </template>
    </TabPane>
  </Tabs>
</template>
