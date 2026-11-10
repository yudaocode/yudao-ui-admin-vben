<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiMusicApi } from '#/api/ai/music';

import { onBeforeUnmount, onDeactivated, ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import {
  AiMusicStatusEnum,
  DICT_TYPE,
  isAiMusicRunning,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { Button, message, Popover, Progress } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteMusic, getMusicPage, updateMusic } from '#/api/ai/music';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import { getMusicTitle } from '#/views/ai/utils/format';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';

defineOptions({ name: 'AiMusicManager' });

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查看详情 */
function handleDetail(row: AiMusicApi.Music) {
  stopPlay();
  detailModalApi.setData({ id: row.id }).open();
}

/** 删除音乐 */
async function handleDelete(row: AiMusicApi.Music) {
  const title = getMusicTitle(row.title);
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [title]),
    duration: 0,
  });
  try {
    await deleteMusic(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [title]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 修改是否公开 */
async function handleUpdatePublicStatusChange(
  newStatus: boolean,
  row: AiMusicApi.Music,
): Promise<boolean | undefined> {
  const text = newStatus ? '公开' : '取消公开';
  try {
    await confirm(`确认要"${text}"该音乐吗?`);
  } catch {
    return false;
  }
  await updateMusic({ id: row.id, publicStatus: newStatus });
  message.success($t('ui.actionMessage.operationSuccess'));
  return true;
}

// ========== 试听：同一时间只播放一首 ==========

const audioRef = ref<HTMLAudioElement>();
const playingId = ref<number>(); // 正在播放的音乐编号

/** 是否可播放：已完成且有音频 */
function canPlay(row: AiMusicApi.Music) {
  return row.status === AiMusicStatusEnum.SUCCESS && !!row.audioUrl;
}

/** 播放 / 暂停 */
function handlePlay(row: AiMusicApi.Music) {
  const audio = audioRef.value;
  if (!audio || !canPlay(row)) {
    return;
  }
  if (playingId.value === row.id) {
    audio.pause();
    return;
  }
  audio.src = row.audioUrl!;
  audio
    .play()
    .then(() => (playingId.value = row.id))
    .catch(() => message.error('音频加载失败'));
}

/** 停止播放 */
function stopPlay() {
  audioRef.value?.pause();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(handleUpdatePublicStatusChange),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMusicPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    cellConfig: {
      height: 64, // 音乐列含 42px 封面与「查看歌词」两行，默认行高会裁切
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<AiMusicApi.Music>,
});

onBeforeUnmount(stopPlay);
onDeactivated(stopPlay);
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="AI 音乐创作" url="https://doc.iocoder.cn/ai/music/" />
    </template>
    <DetailModal />
    <Grid table-title="音乐管理列表">
      <template #music="{ row }">
        <div class="flex items-center gap-2">
          <div
            class="relative size-[42px] flex-shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-gray-800"
            :class="{ 'cursor-pointer': canPlay(row) }"
            @click="handlePlay(row)"
          >
            <img
              v-if="row.coverUrl"
              :src="row.coverUrl"
              class="size-full object-cover"
            />
            <div
              v-if="isAiMusicRunning(row.status)"
              class="absolute inset-0 flex items-center justify-center bg-white/70"
            >
              <IconifyIcon
                icon="lucide:loader-circle"
                class="animate-spin text-primary"
              />
            </div>
            <div
              v-else-if="row.status === AiMusicStatusEnum.FAIL"
              class="absolute inset-0 flex items-center justify-center bg-white/80"
            >
              <IconifyIcon icon="lucide:circle-alert" class="text-red-500" />
            </div>
            <div
              v-else-if="canPlay(row)"
              class="absolute inset-0 flex items-center justify-center bg-black/25 text-white"
            >
              <IconifyIcon
                :icon="playingId === row.id ? 'lucide:pause' : 'lucide:play'"
              />
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate" :title="getMusicTitle(row.title)">
              {{ getMusicTitle(row.title) }}
            </div>
            <Popover v-if="row.lyric" placement="right" trigger="click">
              <template #content>
                <div
                  class="max-h-[360px] w-[360px] overflow-y-auto whitespace-pre-wrap text-[13px] leading-5"
                >
                  {{ row.lyric }}
                </div>
              </template>
              <Button type="link" size="small" class="!h-auto !p-0 !text-xs">
                查看歌词
              </Button>
            </Popover>
            <span v-else class="text-xs text-gray-400">-</span>
          </div>
        </div>
      </template>
      <template #status="{ row }">
        <DictTag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="row.status" />
        <Progress
          v-if="isAiMusicRunning(row.status)"
          :percent="row.progress || 0"
          :show-info="false"
          size="small"
          class="!mb-0 !mt-1"
        />
      </template>
      <template #errorMessage="{ row }">
        <span v-if="row.status === AiMusicStatusEnum.FAIL" class="text-red-500">
          {{ row.errorMessage || '-' }}
        </span>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['ai:music:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['ai:music:delete'],
              disabled: isAiMusicRunning(row.status),
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [
                  getMusicTitle(row.title),
                ]),
                disabled: isAiMusicRunning(row.status),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
    <!-- 列表试听：同一时间只播放一首 -->
    <audio
      ref="audioRef"
      class="hidden"
      @ended="playingId = undefined"
      @pause="playingId = undefined"
    ></audio>
  </Page>
</template>
