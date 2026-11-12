<script lang="ts" setup>
import type { AiImageApi } from '#/api/ai/image';

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

import { confirm, useVbenModal } from '@vben/common-ui';
import { AiImageStatusEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElCard,
  ElEmpty,
  ElMessage,
  ElPagination,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import {
  deleteImageMy,
  getImagePageMy,
  getImagePagePublic,
  updateImagePublicMy,
} from '#/api/ai/image';
import { $t } from '#/locales';

import ImageCard from './card.vue';
import Detail from './detail.vue';
import Mask from './mask-modal.vue';

/** AI 绘图：右侧作品区（我的作品 / 公开画廊；不搜索、不筛选） */
defineOptions({ name: 'AiImageWorks' });

const emit = defineEmits<{
  regenerate: [image: AiImageApi.Image];
}>();

const route = useRoute();

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

const [MaskModal, maskModalApi] = useVbenModal({
  connectedComponent: Mask,
  destroyOnClose: true,
});

const POLL_INTERVAL = 3000; // 有生成中任务时的刷新间隔

const activeTab = ref(route.query.works === 'public' ? 'public' : 'mine'); // 页签：mine - 我的作品；public - 公开画廊
const loading = ref(false); // 列表的加载中
const list = ref<AiImageApi.Image[]>([]); // 列表的数据
const total = ref(0); // 列表的总数
const queryParams = reactive({ pageNo: 1, pageSize: 10 });
/** 是否有生成中的任务：只在我的作品轮询 */
const hasRunning = computed(
  () =>
    activeTab.value === 'mine' &&
    list.value.some((item) => item.status === AiImageStatusEnum.IN_PROGRESS),
);
let requestId = 0; // 请求序号：只采用最后一次请求的结果，避免轮询、切换页签的旧响应覆盖

/** 查询列表；silent 为 true 时不显示加载状态（轮询使用） */
async function getList(silent = false) {
  const currentRequestId = ++requestId;
  const tab = activeTab.value;
  if (!silent) {
    loading.value = true;
  }
  try {
    const data =
      tab === 'mine'
        ? await getImagePageMy(queryParams)
        : await getImagePagePublic(queryParams);
    if (currentRequestId !== requestId) {
      return;
    }
    list.value = data.list;
    total.value = data.total;
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false;
    }
  }
}

/** 切换页签：回到第 1 页 */
function handleTabChange() {
  list.value = [];
  queryParams.pageNo = 1;
  getList();
}

/** 提交成功（创作、Midjourney 动作、局部重绘）：新记录在我的作品第 1 页，回到第 1 页 */
function refreshMine() {
  activeTab.value = 'mine';
  handleTabChange();
}

/** 详情 */
function handleDetail(image: AiImageApi.Image) {
  detailModalApi.setData({ id: image.id, scope: activeTab.value }).open();
}

/** 公开、取消公开 */
async function handlePublic(image: AiImageApi.Image) {
  const publicStatus = !image.publicStatus;
  try {
    await confirm(
      publicStatus
        ? '确认公开该作品？公开后同租户的用户可在公开画廊看到'
        : '确认取消公开？取消后公开画廊不再展示',
    );
  } catch {
    return;
  }
  await updateImagePublicMy(image.id, publicStatus);
  ElMessage.success(publicStatus ? '已公开' : '已取消公开');
  await getList(true);
}

/** 删除 */
async function handleDelete(image: AiImageApi.Image) {
  try {
    await confirm('确定删除该作品吗？派生作品与图片文件不随之删除。');
  } catch {
    return;
  }
  await deleteImageMy(image.id);
  ElMessage.success($t('ui.actionMessage.deleteSuccess', [`#${image.id}`]));
  await getList();
}

/** 局部重绘 */
function handleInpaint(image: AiImageApi.Image) {
  maskModalApi.setData(image).open();
}

// ========== 轮询 ==========

let pollTimer: ReturnType<typeof setInterval> | undefined; // 轮询定时器
let polling = false; // 静默轮询是否进行中：上一次未返回时不再发起

/** 开始轮询：有生成中的任务时，静默刷新当前页（不重置页码） */
function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    if (!hasRunning.value || loading.value || polling) {
      return;
    }
    polling = true;
    try {
      await getList(true);
    } finally {
      polling = false;
    }
  }, POLL_INTERVAL);
}

/** 停止轮询 */
function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }
}

defineExpose({ refreshMine });

/** 初始化 */
onMounted(() => {
  getList();
  startPolling();
});
onActivated(startPolling);
onDeactivated(stopPolling);
onBeforeUnmount(stopPolling);
</script>

<template>
  <ElCard
    :body-style="{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: '8px',
    }"
  >
    <ElTabs v-model="activeTab" @tab-change="handleTabChange">
      <ElTabPane label="我的作品" name="mine" />
      <ElTabPane label="公开画廊" name="public" />
    </ElTabs>
    <div class="mb-3 flex items-center justify-between">
      <span class="text-xs text-gray-500">
        共 {{ total }} 条
        <template v-if="hasRunning"> · 有生成中任务时每 3 秒刷新</template>
      </span>
      <ElButton
        type="primary"
        link
        size="small"
        :loading="loading"
        @click="getList()"
      >
        <IconifyIcon
          v-if="!loading"
          icon="lucide:refresh-cw"
          class="mr-1 inline-block"
        />
        刷新
      </ElButton>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto pr-1">
      <div v-loading="loading" class="min-h-[200px]">
        <ElEmpty
          v-if="!loading && list.length === 0"
          :description="
            activeTab === 'mine'
              ? '暂无作品，在左侧开始创作吧～'
              : '暂无公开作品'
          "
          class="pt-10"
        />
        <div
          v-else
          class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3"
        >
          <ImageCard
            v-for="item in list"
            :key="item.id"
            :image="item"
            :scope="activeTab"
            @detail="handleDetail"
            @public="handlePublic"
            @regenerate="(image) => emit('regenerate', image)"
            @delete="handleDelete"
            @inpaint="handleInpaint"
            @acted="refreshMine"
          />
        </div>
      </div>
    </div>
    <!-- 分页：固定在作品区右下角，不随列表滚动 -->
    <div class="flex flex-shrink-0 justify-end pt-3">
      <ElPagination
        v-model:current-page="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList()"
        @current-change="getList()"
      />
    </div>

    <!-- 详情、局部重绘 -->
    <DetailModal />
    <MaskModal @success="refreshMine" />
  </ElCard>
</template>
