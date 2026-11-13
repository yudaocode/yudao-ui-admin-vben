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

import {
  ElImage,
  ElLink,
  ElLoading,
  ElMessage,
  ElPopover,
  ElProgress,
} from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteMusic, getMusicPage, updateMusic } from '#/api/ai/music';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import { getMusicTitle } from '#/views/ai/utils/format';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';

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
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [getMusicTitle(row.title)]),
  });
  try {
    await deleteMusic(row.id);
    ElMessage.success(
      $t('ui.actionMessage.deleteSuccess', [getMusicTitle(row.title)]),
    );
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 修改是否公开 */
async function handlePublicStatusChange(
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
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  return true;
}

/** 试听：同一时间只播放一首 */
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
    .catch(() => ElMessage.error('音频加载失败'));
}

function stopPlay() {
  audioRef.value?.pause();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(handlePublicStatusChange),
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
      <DocAlert title="AI 音乐生成" url="https://doc.iocoder.cn/ai/music/" />
    </template>
    <DetailModal />
    <Grid table-title="音乐管理列表">
      <template #music="{ row }">
        <div class="flex items-center gap-2 py-1">
          <div
            class="relative size-[42px] flex-shrink-0 overflow-hidden rounded bg-[var(--el-fill-color)]"
            :class="{ 'cursor-pointer': canPlay(row) }"
            @click="handlePlay(row)"
          >
            <ElImage
              v-if="row.coverUrl"
              :src="row.coverUrl"
              fit="cover"
              class="size-full"
            />
            <div
              v-if="isAiMusicRunning(row.status)"
              class="absolute inset-0 flex items-center justify-center bg-white/70"
            >
              <IconifyIcon
                icon="ep:loading"
                class="animate-spin text-[var(--el-color-primary)]"
              />
            </div>
            <div
              v-else-if="row.status === AiMusicStatusEnum.FAIL"
              class="absolute inset-0 flex items-center justify-center bg-white/80"
            >
              <IconifyIcon
                icon="ep:warning-filled"
                class="text-[var(--el-color-danger)]"
              />
            </div>
            <div
              v-else-if="canPlay(row)"
              class="absolute inset-0 flex items-center justify-center bg-black/25 text-white"
            >
              <IconifyIcon
                :icon="
                  playingId === row.id ? 'ep:video-pause' : 'ep:video-play'
                "
              />
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate" :title="getMusicTitle(row.title)">
              {{ getMusicTitle(row.title) }}
            </div>
            <ElPopover
              v-if="row.lyric"
              placement="right"
              :width="360"
              trigger="click"
            >
              <template #reference>
                <ElLink type="primary" underline="never" class="!text-xs">
                  查看歌词
                </ElLink>
              </template>
              <div
                class="max-h-[360px] overflow-y-auto whitespace-pre-wrap text-[13px] leading-5"
              >
                {{ row.lyric }}
              </div>
            </ElPopover>
            <span
              v-else
              class="text-xs text-[var(--el-text-color-placeholder)]"
            >
              -
            </span>
          </div>
        </div>
      </template>
      <template #status="{ row }">
        <DictTag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="row.status" />
        <ElProgress
          v-if="isAiMusicRunning(row.status)"
          :percentage="row.progress || 0"
          :stroke-width="5"
          :show-text="false"
          class="mt-1"
        />
      </template>
      <template #errorMessage="{ row }">
        <span
          v-if="row.status === AiMusicStatusEnum.FAIL"
          class="text-[var(--el-color-danger)]"
        >
          {{ row.errorMessage || '-' }}
        </span>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['ai:music:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['ai:music:delete'],
              disabled: isAiMusicRunning(row.status),
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [
                  getMusicTitle(row.title),
                ]),
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
