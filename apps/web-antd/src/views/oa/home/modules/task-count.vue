<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { IconifyIcon } from '@vben/icons';

import { Spin } from 'ant-design-vue';

import { getReceivedAnnouncementPage } from '#/api/oa/announcement';
import { getTaskStatusCount } from '#/api/oa/task';
import { OA_TASK_STATUS } from '#/views/oa/utils/constants';

defineOptions({ name: 'OaHomeTaskCount' });

const { hasAccessByCodes } = useAccess();
const { push } = useRouter(); // 路由跳转
const loading = ref(false); // 区块加载中
const loadError = ref(false); // 区块加载失败
const count = ref(0); // 新任务数量
const unreadCount = ref(0); // 未读公告数量
const unreadLoading = ref(false); // 未读公告加载中
const unreadError = ref(false); // 未读公告加载失败

/** 查询未读公告数量 */
async function getUnreadCount() {
  unreadLoading.value = true;
  unreadError.value = false;
  try {
    const queryParams = { pageNo: 1, pageSize: 1, readStatus: false };
    unreadCount.value = (await getReceivedAnnouncementPage(queryParams)).total;
  } catch {
    unreadError.value = true;
  } finally {
    unreadLoading.value = false;
  }
}

/** 查询当前区块数据 */
async function getList() {
  if (loading.value) return;
  loading.value = true;
  loadError.value = false;
  try {
    count.value = (await getTaskStatusCount())[OA_TASK_STATUS.NEW] || 0;
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  if (hasAccessByCodes(['oa:announcement:query'])) {
    getUnreadCount();
  }
  getList();
});
</script>

<template>
  <Spin
    :spinning="loading"
    wrapper-class-name="h-full [&>.ant-spin-container]:h-full"
  >
    <div
      class="relative flex h-full min-h-[116px] cursor-pointer items-center gap-4 overflow-hidden rounded-lg bg-[linear-gradient(135deg,#f56c6c,#f78989)] p-5 text-white shadow-md transition-transform duration-200 hover:-translate-y-0.5"
      @click="push('/oa/task/my')"
    >
      <!-- 数据区与图标区分开，窄屏时优先保留数据 -->
      <div class="min-w-0 flex-1">
        <div class="mb-1 text-sm opacity-90">新任务</div>
        <div
          v-if="loadError"
          class="mt-1 truncate text-xs opacity-85"
          @click.stop="getList"
        >
          加载失败，点击重试
        </div>
        <div v-else class="truncate text-[28px] font-semibold">{{ count }}</div>
        <div
          v-if="hasAccessByCodes(['oa:announcement:query'])"
          class="mt-1 truncate text-xs opacity-85"
        >
          <span v-if="unreadError" @click.stop="getUnreadCount">
            未读公告加载失败，点击重试
          </span>
          <span v-else>
            {{
              unreadLoading ? '未读公告加载中' : `另有 ${unreadCount} 条未读公告`
            }}
          </span>
        </div>
      </div>
      <div
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20"
      >
        <IconifyIcon icon="ep:finished" class="text-[30px]" />
      </div>
    </div>
  </Spin>
</template>
