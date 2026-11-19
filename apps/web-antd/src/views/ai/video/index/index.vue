<script lang="ts" setup>
import type { AiVideoApi } from '#/api/ai/video';

import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  reactive,
  ref,
} from 'vue';
import { useRoute } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE, isAiVideoRunning } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import {
  Card,
  Input,
  message,
  Pagination,
  Select,
  TabPane,
  Tabs,
} from 'ant-design-vue';

import {
  deleteVideoMy,
  getVideoMyPage,
  getVideoPublicPage,
} from '#/api/ai/video';
import { $t } from '#/locales';

import CreatePanel from './modules/create-panel.vue';
import DetailModal from './modules/detail.vue';
import VideoList from './modules/video-list.vue';

/** AI 视频：用户创作页 */
defineOptions({ name: 'AiVideo' });

const route = useRoute();

const POLL_INTERVAL = 5000; // 有未结束作品时的刷新间隔

const createPanelRef = ref<InstanceType<typeof CreatePanel>>();

const [Detail, detailApi] = useVbenModal({
  connectedComponent: DetailModal,
  destroyOnClose: true,
});

const activeTab = ref<'my' | 'public'>('my');

// ========== 我的作品 ==========

const myLoading = ref(false);
const myList = ref<AiVideoApi.Video[]>([]);
const myTotal = ref(0);
const myQuery = reactive({
  pageNo: 1,
  pageSize: 10,
  type: undefined as number | undefined,
});
const hasRunning = computed(() =>
  myList.value.some((item) => isAiVideoRunning(item.status)),
);
let myRequestId = 0; // 请求序号：只采用最后一次请求的结果，避免轮询的旧响应覆盖翻页、提交后的刷新

/** 查询我的作品；silent 为 true 时不显示加载状态（轮询使用） */
async function getMyList(silent = false) {
  const requestId = ++myRequestId;
  if (!silent) {
    myLoading.value = true;
  }
  try {
    const data = await getVideoMyPage(myQuery);
    if (requestId !== myRequestId) {
      return;
    }
    myList.value = data.list;
    myTotal.value = data.total;
  } finally {
    if (requestId === myRequestId) {
      myLoading.value = false;
    }
  }
}

/** 提交成功：回到我的作品第一页 */
function handleSubmitted() {
  activeTab.value = 'my';
  myQuery.pageNo = 1;
  getMyList();
}

// ========== 公开作品 ==========

const publicLoading = ref(false);
const publicList = ref<AiVideoApi.Video[]>([]);
const publicTotal = ref(0);
const publicQuery = reactive({
  pageNo: 1,
  pageSize: 10,
  type: undefined as number | undefined,
  prompt: undefined as string | undefined,
});
let publicRequestId = 0; // 请求序号：只采用最后一次请求的结果

async function getPublicList() {
  const requestId = ++publicRequestId;
  publicLoading.value = true;
  try {
    const data = await getVideoPublicPage(publicQuery);
    if (requestId !== publicRequestId) {
      return;
    }
    publicList.value = data.list;
    publicTotal.value = data.total;
  } finally {
    if (requestId === publicRequestId) {
      publicLoading.value = false;
    }
  }
}

/** 当前页签的查询条件 */
const currentQuery = computed(() =>
  activeTab.value === 'my' ? myQuery : publicQuery,
);

function handleSearch() {
  currentQuery.value.pageNo = 1;
  handleTabChange();
}

/** 清空搜索提示词时重新查询 */
function handlePromptChange() {
  if (!publicQuery.prompt) {
    handleSearch();
  }
}

function handleTabChange() {
  if (activeTab.value === 'my') {
    getMyList();
  } else {
    getPublicList();
  }
}

// ========== 作品操作 ==========

/** 详情 */
function openDetail(item: AiVideoApi.Video) {
  detailApi.setData({ id: item.id }).open();
}

/** 做同款：带回左侧表单 */
function handleSame(item: AiVideoApi.Video) {
  createPanelRef.value?.applySame(item);
  message.success('已带入类型、模型与参数，请上传素材后生成');
}

/** 删除 */
async function handleDelete(item: AiVideoApi.Video) {
  try {
    await confirm('确认删除该作品？删除后不可恢复。');
  } catch {
    return;
  }
  await deleteVideoMy(item.id);
  message.success($t('ui.actionMessage.deleteSuccess', [item.id]));
  await getMyList();
}

// ========== 轮询 ==========

let pollTimer: ReturnType<typeof setInterval> | undefined;
let polling = false; // 静默轮询是否进行中：上一次未返回时不再发起

function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    if (
      activeTab.value !== 'my' ||
      !hasRunning.value ||
      myLoading.value ||
      polling
    ) {
      return;
    }
    polling = true;
    try {
      await getMyList(true);
    } finally {
      polling = false;
    }
  }, POLL_INTERVAL);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }
}

/** 初始化：加载我的作品；?id= 深链打开详情 */
onMounted(() => {
  getMyList();
  startPolling();
  const id = Number(route.query.id);
  if (id) {
    detailApi.setData({ id }).open();
  }
});
onActivated(startPolling);
onDeactivated(stopPolling);
onBeforeUnmount(stopPolling);
</script>

<template>
  <Page auto-content-height>
    <!-- 高度占满可视区域：左侧表单、右侧作品各自滚动，生成按钮与分页始终可见 -->
    <div class="flex h-full gap-4 overflow-hidden">
      <!-- 左：创作面板 -->
      <div class="h-full w-[380px] flex-shrink-0">
        <CreatePanel ref="createPanelRef" @submitted="handleSubmitted" />
      </div>

      <!-- 右：我的作品 / 公开作品 -->
      <Card
        class="h-full min-w-0 flex-1"
        :body-style="{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '8px',
        }"
      >
        <div class="flex items-center justify-between">
          <Tabs
            v-model:active-key="activeTab"
            class="flex-1"
            @change="handleTabChange"
          >
            <TabPane key="my" tab="我的作品" />
            <TabPane key="public" tab="公开作品" />
          </Tabs>
          <div class="flex items-center gap-2 pb-4">
            <Select
              v-model:value="currentQuery.type"
              :options="getDictOptions(DICT_TYPE.AI_VIDEO_TYPE, 'number')"
              placeholder="全部类型"
              allow-clear
              class="!w-[130px]"
              @change="handleSearch"
            />
            <Input
              v-if="activeTab === 'public'"
              v-model:value="publicQuery.prompt"
              placeholder="搜索提示词"
              allow-clear
              class="!w-[200px]"
              @press-enter="handleSearch"
              @change="handlePromptChange"
            >
              <template #prefix>
                <IconifyIcon icon="lucide:search" />
              </template>
            </Input>
            <span
              v-if="activeTab === 'my' && hasRunning"
              class="text-xs text-gray-500"
            >
              自动刷新中
            </span>
          </div>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto pr-1">
          <VideoList
            v-if="activeTab === 'my'"
            :list="myList"
            :loading="myLoading"
            @detail="openDetail"
            @same="handleSame"
            @delete="handleDelete"
          />
          <VideoList
            v-else
            square
            :list="publicList"
            :loading="publicLoading"
            @detail="openDetail"
            @same="handleSame"
          />
        </div>
        <!-- 分页：固定在作品区右下角，不随列表滚动 -->
        <div class="flex flex-shrink-0 justify-end pt-3">
          <Pagination
            v-if="activeTab === 'my'"
            v-model:current="myQuery.pageNo"
            v-model:page-size="myQuery.pageSize"
            :total="myTotal"
            :show-total="(total: number) => `共 ${total} 条`"
            show-size-changer
            @change="() => getMyList()"
          />
          <Pagination
            v-else
            v-model:current="publicQuery.pageNo"
            v-model:page-size="publicQuery.pageSize"
            :total="publicTotal"
            :show-total="(total: number) => `共 ${total} 条`"
            show-size-changer
            @change="() => getPublicList()"
          />
        </div>
      </Card>
    </div>

    <!-- 详情 -->
    <Detail @same="handleSame" />
  </Page>
</template>
