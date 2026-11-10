<script lang="ts" setup>
import type { AiMusicApi } from '#/api/ai/music';

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

import { confirm, Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { isAiMusicRunning } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  Card,
  Input,
  message,
  Pagination,
  TabPane,
  Tabs,
} from 'ant-design-vue';

import {
  concatMusic,
  deleteMusicMy,
  getMusicMyPage,
  getMusicPublicPage,
  updateMyMusic,
} from '#/api/ai/music';
import { $t } from '#/locales';
import { getMusicTitle } from '#/views/ai/utils/format';

import CreatePanel from './modules/create-panel.vue';
import DetailDrawer from './modules/detail-drawer.vue';
import EditForm from './modules/edit-form.vue';
import MusicList from './modules/music-list.vue';
import MusicPlayer from './modules/music-player.vue';

/** AI 音乐：用户创作页 */
defineOptions({ name: 'AiMusic' });

const route = useRoute();

const POLL_INTERVAL = 5000; // 有未结束作品时的刷新间隔

const createPanelRef = ref<InstanceType<typeof CreatePanel>>();
const playerRef = ref<InstanceType<typeof MusicPlayer>>();
const playerState = ref<{ id?: number; playing: boolean }>({
  playing: false,
}); // 播放器状态

const [Detail, detailApi] = useVbenDrawer({
  connectedComponent: DetailDrawer,
  destroyOnClose: true,
});

const [EditModal, editModalApi] = useVbenModal({
  connectedComponent: EditForm,
  destroyOnClose: true,
});

const activeTab = ref<'my' | 'square'>('my');

// ========== 我的作品 ==========

const myLoading = ref(false);
const myList = ref<AiMusicApi.Music[]>([]);
const myTotal = ref(0);
const myQuery = reactive({ pageNo: 1, pageSize: 10 });
const hasRunning = computed(() =>
  myList.value.some((item) => isAiMusicRunning(item.status)),
);
let myRequestId = 0; // 请求序号：只采用最后一次请求的结果，避免轮询的旧响应覆盖翻页、提交后的刷新

/** 查询我的作品；silent 为 true 时不显示加载状态（轮询使用） */
async function getMyList(silent = false) {
  const requestId = ++myRequestId;
  if (!silent) {
    myLoading.value = true;
  }
  try {
    const data = await getMusicMyPage(myQuery);
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

// ========== 音乐广场 ==========

const squareLoading = ref(false);
const squareList = ref<AiMusicApi.Music[]>([]);
const squareTotal = ref(0);
const squareQuery = reactive({
  pageNo: 1,
  pageSize: 10,
  title: undefined as string | undefined,
});
let squareRequestId = 0; // 请求序号：只采用最后一次请求的结果

async function getSquareList() {
  const requestId = ++squareRequestId;
  squareLoading.value = true;
  try {
    const data = await getMusicPublicPage(squareQuery);
    if (requestId !== squareRequestId) {
      return;
    }
    squareList.value = data.list;
    squareTotal.value = data.total;
  } finally {
    if (requestId === squareRequestId) {
      squareLoading.value = false;
    }
  }
}

function handleSquareSearch() {
  squareQuery.pageNo = 1;
  getSquareList();
}

/** 清空搜索名称时重新查询 */
function handleSquareTitleChange() {
  if (!squareQuery.title) {
    handleSquareSearch();
  }
}

function handleTabChange() {
  if (activeTab.value === 'my') {
    getMyList();
  } else {
    getSquareList();
  }
}

// ========== 作品操作 ==========

/** 播放：播放列表为当前列表中同状态（已完成）的作品 */
function handlePlay(item: AiMusicApi.Music) {
  const list = activeTab.value === 'my' ? myList.value : squareList.value;
  playerRef.value?.play(
    item,
    list.filter((music) => music.status === item.status),
  );
}

/** 详情 */
function openDetail(item: AiMusicApi.Music) {
  detailApi.setData({ id: item.id }).open();
}

/** 续写：带入左侧面板 */
function handleExtend(item: AiMusicApi.Music) {
  createPanelRef.value?.setExtendSource(item);
}

/** 合并为完整歌曲 */
async function handleConcat(item: AiMusicApi.Music) {
  try {
    await confirm(
      `确认将续写作品《${getMusicTitle(item.title)}》与原曲合并为完整歌曲？` +
        '合并需中转支持 /suno/submit/concat 扩展路径（官方 SunoAPI 插件不支持）。',
    );
  } catch {
    return;
  }
  await concatMusic(item.id);
  message.success('合并任务已提交');
  handleSubmitted();
}

/** 编辑名称与封面 */
function openEdit(item: AiMusicApi.Music) {
  editModalApi.setData(item).open();
}

/** 删除 */
async function handleDelete(item: AiMusicApi.Music) {
  const title = getMusicTitle(item.title);
  try {
    await confirm(`确认删除作品《${title}》？删除后不可恢复。`);
  } catch {
    return;
  }
  await deleteMusicMy(item.id);
  message.success($t('ui.actionMessage.deleteSuccess', [title]));
  if (playerState.value.id === item.id) {
    playerRef.value?.close();
  }
  await getMyList();
}

/** 公开 / 取消公开 */
async function handlePublic(item: AiMusicApi.Music, value: boolean) {
  await updateMyMusic({ id: item.id, publicStatus: value });
  item.publicStatus = value;
  message.success(value ? '已公开到音乐广场' : '已取消公开');
}

// ========== 轮询 ==========

let pollTimer: ReturnType<typeof setInterval> | undefined;
let polling = false; // 静默轮询是否进行中：上一次未返回时不再发起，避免慢响应时轮询互相作废

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
    <div class="flex h-full flex-col overflow-hidden">
      <div class="flex min-h-0 flex-1 gap-4">
        <!-- 左：创作面板 -->
        <div class="h-full w-[360px] flex-shrink-0">
          <CreatePanel ref="createPanelRef" @submitted="handleSubmitted" />
        </div>

        <!-- 右：我的作品 / 音乐广场 -->
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
              <TabPane key="square" tab="音乐广场" />
            </Tabs>
            <div class="flex items-center gap-2 pb-4">
              <Input
                v-if="activeTab === 'square'"
                v-model:value="squareQuery.title"
                placeholder="搜索名称"
                allow-clear
                class="!w-[200px]"
                @press-enter="handleSquareSearch"
                @change="handleSquareTitleChange"
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
            <MusicList
              v-if="activeTab === 'my'"
              :list="myList"
              :loading="myLoading"
              :current-id="playerState.id"
              :playing="playerState.playing"
              @play="handlePlay"
              @detail="openDetail"
              @extend="handleExtend"
              @concat="handleConcat"
              @edit="openEdit"
              @delete="handleDelete"
              @public="handlePublic"
            />
            <MusicList
              v-else
              square
              :list="squareList"
              :loading="squareLoading"
              :current-id="playerState.id"
              :playing="playerState.playing"
              @play="handlePlay"
              @detail="openDetail"
            />
          </div>
          <div class="flex justify-end pt-3">
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
              v-model:current="squareQuery.pageNo"
              v-model:page-size="squareQuery.pageSize"
              :total="squareTotal"
              :show-total="(total: number) => `共 ${total} 条`"
              show-size-changer
              @change="() => getSquareList()"
            />
          </div>
        </Card>
      </div>

      <!-- 底：播放器 -->
      <MusicPlayer ref="playerRef" @change="(state) => (playerState = state)" />
    </div>

    <!-- 详情、编辑 -->
    <Detail @play="handlePlay" />
    <EditModal @success="getMyList" />
  </Page>
</template>
