<script lang="ts" setup>
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { ElInput, ElTabPane, ElTabs } from 'element-plus';

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
  <div class="relative">
    <ElTabs
      v-model="activeTab"
      class="performance-main-tabs"
      @tab-change="emit('mainChange')"
    >
      <ElTabPane v-for="item in mainTabs" :key="item.name" :name="item.name">
        <template #label>
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
      </ElTabPane>
    </ElTabs>
    <!-- ElInput 自带 position:relative，需包一层对齐到 Tab 标题行 -->
    <div class="absolute right-0 top-0 z-10 flex h-10 items-center">
      <ElInput
        v-model="keyword"
        clearable
        class="!w-[280px]"
        placeholder="请输入姓名/工号/考核名称"
        @clear="emit('query')"
        @keyup.enter="emit('query')"
      >
        <template #prefix>
          <IconifyIcon icon="lucide:search" />
        </template>
      </ElInput>
    </div>
  </div>

  <ElTabs v-model="activeStatus" @tab-change="emit('statusChange')">
    <ElTabPane v-for="item in statusTabs" :key="item.name" :name="item.name">
      <template #label>
        <span>
          {{ item.label }}
          <span v-if="item.count > 0" class="text-primary ml-1">
            {{ item.count }}
          </span>
        </span>
      </template>
    </ElTabPane>
  </ElTabs>
</template>

<style scoped>
.performance-main-tabs :deep(.el-tabs__header) {
  margin-right: 296px;
}
</style>
