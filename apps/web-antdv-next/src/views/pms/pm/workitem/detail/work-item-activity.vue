<script lang="ts" setup>
import type { PmsWorkItemActivityApi } from '#/api/pms/pm/workitem/activity';

import { onMounted, ref } from 'vue';

import { formatDateTime } from '@vben/utils';

import { Avatar, Empty } from 'antdv-next';

import { getWorkItemActivityList } from '#/api/pms/pm/workitem/activity';

defineOptions({ name: 'PmsWorkItemActivity' });

// TODO @AI：动态时间线可以保留自定义；antd/antdv-next 不要用 v-loading。

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
  <div v-if="showTitle" class="mb-3 font-semibold">工作项动态</div>
  <div v-loading="loading">
    <Empty v-if="activityList.length === 0" description="暂无动态" />
    <div v-else>
      <div
        v-for="activity in activityList"
        :key="activity.id"
        class="flex gap-2.5 border-b border-solid border-border py-2.5 last:border-b-0"
      >
        <Avatar :size="32" :src="activity.operatorUserAvatar">
          {{ activity.operatorUserName?.slice(0, 1) }}
        </Avatar>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span>{{ activity.operatorUserName }}</span>
            <span class="text-xs text-muted-foreground">
              {{ formatDateTime(activity.createTime) }}
            </span>
          </div>
          <div class="mt-1 text-[13px] text-foreground">
            {{ activity.content }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
