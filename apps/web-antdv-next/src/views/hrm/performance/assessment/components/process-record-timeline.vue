<script lang="ts" setup>
import type { HrmPerformanceAssessmentApi } from '#/api/hrm/performance/assessment';

import { formatDateTime } from '@vben/utils';

import { Timeline, TimelineItem } from 'antdv-next';

defineOptions({ name: 'HrmPerformanceProcessRecordTimeline' });

defineProps<{
  loading?: boolean;
  records: HrmPerformanceAssessmentApi.PerformanceProcessRecord[];
}>();
</script>

<template>
  <Timeline v-if="records.length">
    <TimelineItem v-for="(record, index) in records" :key="index">
      <div class="font-medium">{{ record.title }}</div>
      <div class="text-sm text-gray-500">
        {{ record.operatorName }} · {{ formatDateTime(record.operateTime) }}
      </div>
      <div v-if="record.content" class="mt-1">{{ record.content }}</div>
      <div v-if="record.fileUrls?.length" class="mt-2 flex flex-wrap gap-2">
        <a
          v-for="(url, fileIndex) in record.fileUrls"
          :key="fileIndex"
          :href="url"
          class="text-primary"
          rel="noopener noreferrer"
          target="_blank"
        >
          附件 {{ fileIndex + 1 }}
        </a>
      </div>
    </TimelineItem>
  </Timeline>
  <div v-else-if="!loading" class="py-8 text-center text-gray-400">
    暂无考核记录
  </div>
</template>
