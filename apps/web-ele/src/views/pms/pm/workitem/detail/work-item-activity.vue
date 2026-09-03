<script lang="ts" setup>
import type { PmsWorkItemActivityApi } from '#/api/pms/pm/workitem/activity';

import { onMounted, ref } from 'vue';

import { formatDateTime } from '@vben/utils';

import { ElAvatar, ElDivider, ElEmpty } from 'element-plus';

import { getWorkItemActivityList } from '#/api/pms/pm/workitem/activity';

defineOptions({ name: 'PmsWorkItemActivity' });

const props = withDefaults(
  defineProps<{ showTitle?: boolean; workItemId: number }>(),
  { showTitle: true },
);

const loading = ref(false); // 动态加载中
const activityList = ref<PmsWorkItemActivityApi.WorkItemActivity[]>([]); // 动态列表

/** 查询工作项动态列表 */
async function getActivityList() {
  loading.value = true;
  try {
    activityList.value = await getWorkItemActivityList(props.workItemId);
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getActivityList();
});

defineExpose({ getActivityList }); // 提供 getActivityList 方法，用于刷新动态
</script>

<template>
  <!-- 工作项活动记录 -->
  <ElDivider v-if="showTitle" content-position="left">工作项动态</ElDivider>
  <div v-loading="loading">
    <ElEmpty
      v-if="activityList.length === 0"
      :image-size="60"
      description="暂无动态"
    />
    <div v-else>
      <div
        v-for="activity in activityList"
        :key="activity.id"
        class="flex gap-2.5 border-b border-solid border-[var(--el-border-color-lighter)] py-2.5 last:border-b-0"
      >
        <ElAvatar :size="32" :src="activity.operatorUserAvatar">
          {{ activity.operatorUserName?.slice(0, 1) }}
        </ElAvatar>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span>{{ activity.operatorUserName }}</span>
            <span class="text-xs text-[var(--el-text-color-secondary)]">
              {{ formatDateTime(activity.createTime) }}
            </span>
          </div>
          <div class="mt-1 text-[13px] text-[var(--el-text-color-regular)]">
            {{ activity.content }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
