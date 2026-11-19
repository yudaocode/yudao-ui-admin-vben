<script lang="ts" setup>
import type { AiSpeechApi } from '#/api/ai/speech';
import type { SpeechModel } from '#/views/ai/utils/speech';

import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  reactive,
  ref,
} from 'vue';

import { confirm, DocAlert, Page, useVbenDrawer } from '@vben/common-ui';
import { AiModelTypeEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { ElButton, ElMessage, ElPagination } from 'element-plus';

import { getModelSimpleList } from '#/api/ai/model/model';
import { deleteSpeechMy, getSpeechMy, getSpeechMyPage } from '#/api/ai/speech';
import { $t } from '#/locales';
import { buildSpeechModels, isSpeechRunning } from '#/views/ai/utils/speech';

import CreatePanel from './modules/create-panel.vue';
import Detail from './modules/detail-drawer.vue';
import SpeechList from './modules/list.vue';
import SpeechPlayer from './modules/player.vue';

/** AI 语音：用户合成页 */
defineOptions({ name: 'AiSpeech' });

const POLL_INTERVAL = 3000; // 有生成中的语音时的刷新间隔

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: Detail,
  destroyOnClose: true,
});

const createPanelRef = ref<InstanceType<typeof CreatePanel>>();
const playerRef = ref<InstanceType<typeof SpeechPlayer>>();
const playerState = ref<{ id?: number; playing: boolean }>({ playing: false }); // 播放器状态
const latestSpeech = ref<AiSpeechApi.Speech>(); // 轮询拿到的最新结果，同步给详情抽屉

// ========== 模型 ==========

const modelLoading = ref(true);
const models = ref<SpeechModel[]>([]); // 已启用的语音模型：只保留支持语音合成的平台

async function getModels() {
  modelLoading.value = true;
  try {
    models.value = buildSpeechModels(
      await getModelSimpleList(AiModelTypeEnum.VOICE),
    );
  } finally {
    modelLoading.value = false;
  }
}

// ========== 我的语音 ==========

const loading = ref(false); // 列表的加载中
const list = ref<AiSpeechApi.Speech[]>([]); // 列表的数据
const total = ref(0); // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
});
const hasRunning = computed(() =>
  list.value.some((item) => isSpeechRunning(item)),
); // 是否有生成中的语音

let listSeq = 0; // 请求序号：只采用最后一次请求的结果，丢弃过期响应
let pollGen = 0; // 轮询代号：刷新列表、停止轮询后，过期的轮询结果不再写入

/** 查询列表 */
async function getList() {
  pollGen++;
  const seq = ++listSeq;
  loading.value = true;
  try {
    const data = await getSpeechMyPage(queryParams);
    if (seq !== listSeq) {
      return;
    }
    list.value = data.list;
    total.value = data.total;
  } finally {
    if (seq === listSeq) {
      loading.value = false;
    }
  }
}

/** 提交成功：回到第一页 */
function handleSubmitted() {
  queryParams.pageNo = 1;
  getList();
}

// ========== 操作 ==========

function handlePlay(item: AiSpeechApi.Speech) {
  playerRef.value?.play(item);
}

function openDetail(item: AiSpeechApi.Speech) {
  detailDrawerApi.setData({ id: item.id }).open();
}

/** 再次生成：带入左侧面板 */
function handleAgain(item: AiSpeechApi.Speech) {
  createPanelRef.value?.fill(item);
}

/** 删除：删除后刷新当前页 */
async function handleDelete(item: AiSpeechApi.Speech) {
  try {
    await confirm('确认删除该语音？删除后不可恢复。');
  } catch {
    return;
  }
  await deleteSpeechMy(item.id);
  ElMessage.success($t('ui.actionMessage.deleteSuccess', [item.id]));
  if (playerState.value.id === item.id) {
    playerRef.value?.close();
  }
  // 正在查看的详情一并关闭
  if (
    (detailDrawerApi.getData() as undefined | { id: number })?.id === item.id
  ) {
    await detailDrawerApi.close();
  }
  await getList();
}

// ========== 轮询：逐条查询生成中的语音，后端会同步一次结果 ==========

let pollTimer: ReturnType<typeof setInterval> | undefined;
let polling = false; // 上一轮未结束时不再发起，避免慢响应时请求堆积

async function poll() {
  if (polling || loading.value || !hasRunning.value) {
    return;
  }
  polling = true;
  const gen = pollGen;
  try {
    for (const running of list.value.filter((item) => isSpeechRunning(item))) {
      const speech = await getSpeechMy(running.id).catch(() => undefined);
      // 期间刷新了列表、停止了轮询：不再写入
      if (gen !== pollGen) {
        break;
      }
      // 已翻页、刷新的，列表中找不到，不再更新
      const index = list.value.findIndex((item) => item.id === running.id);
      if (speech && index !== -1) {
        list.value[index] = speech;
        latestSpeech.value = speech;
      }
    }
  } finally {
    polling = false;
  }
}

function startPolling() {
  stopPolling();
  pollGen++;
  pollTimer = setInterval(poll, POLL_INTERVAL);
}

function stopPolling() {
  pollGen++;
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }
}

/** 初始化 */
onMounted(() => {
  getModels();
  getList();
  startPolling();
});
onActivated(startPolling);
onDeactivated(stopPolling);
onBeforeUnmount(stopPolling);
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="AI 语音生成" url="https://doc.iocoder.cn/ai/speech/" />
    </template>
    <div class="flex h-full flex-col overflow-hidden">
      <div class="flex min-h-0 flex-1 gap-4">
        <!-- 左：合成面板 -->
        <div class="h-full w-[380px] flex-shrink-0">
          <CreatePanel
            ref="createPanelRef"
            :models="models"
            :model-loading="modelLoading"
            @submitted="handleSubmitted"
          />
        </div>

        <!-- 右：我的语音 -->
        <div class="flex h-full min-w-0 flex-1 flex-col rounded-lg bg-card p-4">
          <div class="mb-3 flex items-center justify-between">
            <span class="text-base font-bold">我的语音</span>
            <div class="flex items-center gap-2">
              <span
                v-if="hasRunning"
                class="text-xs text-[var(--el-text-color-secondary)]"
              >
                自动刷新中
              </span>
              <ElButton
                link
                type="primary"
                :loading="loading"
                @click="getList()"
              >
                <IconifyIcon icon="ep:refresh" class="mr-0.5" /> 刷新
              </ElButton>
            </div>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto pr-1">
            <SpeechList
              :list="list"
              :loading="loading"
              :current-id="playerState.id"
              :playing="playerState.playing"
              @play="handlePlay"
              @detail="openDetail"
              @again="handleAgain"
              @delete="handleDelete"
            />
          </div>
          <div class="flex justify-end pt-3">
            <ElPagination
              v-model:current-page="queryParams.pageNo"
              v-model:page-size="queryParams.pageSize"
              :total="total"
              :page-sizes="[10, 20, 30, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @change="getList()"
            />
          </div>
        </div>
      </div>

      <!-- 底：播放器 -->
      <SpeechPlayer
        ref="playerRef"
        @change="(state) => (playerState = state)"
      />

      <!-- 详情 -->
      <DetailDrawer
        :latest="latestSpeech"
        @play="handlePlay"
        @again="handleAgain"
      />
    </div>
  </Page>
</template>
