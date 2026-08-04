<script lang="ts" setup>
import type { HrmRecruitCandidateApi } from '#/api/hrm/recruit/candidate';

import { computed } from 'vue';

import {
  downloadFileFromUrl,
  getFileNameFromUrl,
  openWindow,
} from '@vben/utils';

import { ElButton, ElEmpty } from 'element-plus';

const props = defineProps<{
  candidate: HrmRecruitCandidateApi.RecruitCandidate;
}>();

const resumeUrls = computed(() => props.candidate.resumeUrls || []);

/** 预览附件 */
function handlePreview(url: string) {
  openWindow(url);
}

/** 下载附件 */
function handleDownload(url: string) {
  downloadFileFromUrl({ source: url, fileName: getFileNameFromUrl(url) });
}
</script>

<template>
  <div v-if="resumeUrls.length" class="space-y-2">
    <div
      v-for="url in resumeUrls"
      :key="url"
      class="flex items-center justify-between gap-4 border-b py-3 last:border-b-0"
    >
      <span class="min-w-0 truncate">{{ getFileNameFromUrl(url) }}</span>
      <div class="shrink-0">
        <ElButton link type="primary" @click="handlePreview(url)">
          预览
        </ElButton>
        <ElButton link type="primary" @click="handleDownload(url)">
          下载
        </ElButton>
      </div>
    </div>
  </div>
  <ElEmpty v-else description="暂无材料附件" />
</template>
