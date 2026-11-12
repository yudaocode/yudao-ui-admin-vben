<script lang="ts" setup>
import type { AiPptApi } from '#/api/ai/ppt';

import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  reactive,
  ref,
} from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import {
  AiPptExportFormatEnum,
  AiPptStatusEnum,
  DICT_TYPE,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart, formatDate } from '@vben/utils';

import {
  Button,
  Card,
  Dropdown,
  Empty,
  Menu,
  message,
  Pagination,
  Popover,
  Spin,
} from 'ant-design-vue';

import {
  deletePptMy,
  exportPptMy,
  getPptMyPage,
  resumePptMy,
} from '#/api/ai/ppt';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';

import Outline from '../components/outline-modal.vue';
import Preview from '../components/preview-modal.vue';
import CreatePanel from './modules/create-panel.vue';

/** AI PPT：用户创作页 */
defineOptions({ name: 'AiPpt' });

const POLL_INTERVAL = 3000; // 有生成中任务时的刷新间隔
const EXPORT_MENU_ITEMS = [
  { key: AiPptExportFormatEnum.PPTX, label: '导出 PPTX（16:9，每页一张图）' },
  { key: AiPptExportFormatEnum.PDF, label: '导出 PDF（16:9，每页一张图）' },
];

const [PreviewModal, previewModalApi] = useVbenModal({
  connectedComponent: Preview,
  destroyOnClose: true,
});

const [OutlineModal, outlineModalApi] = useVbenModal({
  connectedComponent: Outline,
  destroyOnClose: true,
});

const loading = ref(false); // 列表的加载中
const list = ref<AiPptApi.Ppt[]>([]); // 列表的数据
const total = ref(0); // 列表的总数
const queryParams = reactive({ pageNo: 1, pageSize: 10 });
/** 是否有生成中的任务：有则轮询刷新 */
const hasRunning = computed(() =>
  list.value.some((item) => item.status === AiPptStatusEnum.IN_PROGRESS),
);
let requestId = 0; // 请求序号：只采用最后一次请求的结果，避免轮询的旧响应覆盖翻页、提交后的刷新

/** 查询列表；silent 为 true 时不显示加载状态（轮询使用） */
async function getList(silent = false) {
  const currentRequestId = ++requestId;
  if (!silent) {
    loading.value = true;
  }
  try {
    const data = await getPptMyPage(queryParams);
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

/** 生成中的进度文案：分镜阶段没有页数；每页都有图时为单页重绘 */
function getProgressText(item: AiPptApi.Ppt) {
  if (!item.slideCount) {
    return '正在生成分镜…';
  }
  if (item.finishCount < item.slideCount) {
    return `正在生成第 ${item.finishCount + 1} 页`;
  }
  return '正在重绘…';
}

/** 提交成功：回到第一页 */
function handleSubmitted() {
  queryParams.pageNo = 1;
  getList();
}

/** 预览 */
function handlePreview(item: AiPptApi.Ppt) {
  previewModalApi.setData({ id: item.id }).open();
}

/** 查看大纲 */
function handleOutline(item: AiPptApi.Ppt) {
  outlineModalApi.setData({ id: item.id }).open();
}

/** 继续生成 */
const resumingId = ref<number>(); // 继续生成中的 PPT 编号
async function handleResume(item: AiPptApi.Ppt) {
  resumingId.value = item.id;
  try {
    await resumePptMy(item.id);
    message.success('已继续生成');
    await getList(true);
  } finally {
    resumingId.value = undefined;
  }
}

/** 导出：文件名取标题 */
const exportingId = ref<number>(); // 导出中的 PPT 编号
async function handleExport(item: AiPptApi.Ppt, format: string) {
  exportingId.value = item.id;
  try {
    const data = await exportPptMy(item.id, format);
    downloadFileFromBlobPart({
      fileName: `${item.title}.${format}`,
      source: data,
    });
  } finally {
    exportingId.value = undefined;
  }
}

/** 删除 */
async function handleDelete(item: AiPptApi.Ppt) {
  try {
    await confirm('确定删除该 PPT 吗？图片文件不随任务删除。');
  } catch {
    return;
  }
  await deletePptMy(item.id);
  message.success($t('ui.actionMessage.deleteSuccess', [item.title]));
  await getList();
}

// ========== 轮询 ==========

let pollTimer: ReturnType<typeof setInterval> | undefined; // 轮询定时器
let polling = false; // 静默轮询是否进行中：上一次未返回时不再发起

/** 开始轮询：有生成中的任务时，静默刷新列表 */
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
  <Page auto-content-height>
    <div class="flex h-full gap-4 overflow-hidden">
      <!-- 左：创建表单 -->
      <div class="h-full w-[420px] flex-shrink-0">
        <CreatePanel @submitted="handleSubmitted" />
      </div>

      <!-- 右：我的 PPT -->
      <Card
        class="h-full min-w-0 flex-1"
        :body-style="{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }"
      >
        <div class="mb-3 flex items-center justify-between">
          <div>
            <span class="text-base font-bold">我的 PPT</span>
            <span class="ml-2 text-xs text-gray-500">
              共 {{ total }} 条
              <template v-if="hasRunning">
                · 有生成中任务时每 3 秒刷新
              </template>
            </span>
          </div>
          <Button type="link" :loading="loading" @click="getList()">
            <template #icon>
              <IconifyIcon
                icon="lucide:refresh-cw"
                class="mr-1 inline-block"
              />
            </template>
            刷新
          </Button>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto pr-1">
          <Spin :spinning="loading">
            <div class="min-h-[200px]">
              <Empty
                v-if="!loading && list.length === 0"
                description="暂无任务，在左侧创建任务吧～"
                class="pt-10"
              />
              <div
                v-for="item in list"
                :key="item.id"
                class="mb-2.5 flex gap-3.5 rounded-lg border border-solid border-border p-3 hover:shadow-md"
              >
                <!-- 封面 -->
                <div
                  class="h-[90px] w-40 flex-shrink-0 cursor-pointer overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800"
                  @click="handlePreview(item)"
                >
                  <img
                    v-if="item.coverUrl"
                    :src="item.coverUrl"
                    loading="lazy"
                    class="size-full object-cover"
                  />
                  <div
                    v-else-if="item.status === AiPptStatusEnum.IN_PROGRESS"
                    class="flex size-full flex-col items-center justify-center gap-1 text-xs text-gray-500"
                  >
                    <IconifyIcon
                      icon="lucide:loader-circle"
                      class="animate-spin text-primary"
                    />
                    正在生成中
                  </div>
                  <div
                    v-else
                    class="flex size-full items-center justify-center text-xs text-gray-400"
                  >
                    暂无预览
                  </div>
                </div>
                <!-- 信息、操作 -->
                <div class="flex min-w-0 flex-1 flex-col gap-2">
                  <div class="flex items-start justify-between gap-3">
                    <span
                      class="line-clamp-2 min-w-0 flex-1 cursor-pointer text-[15px] font-medium hover:text-primary"
                      @click="handlePreview(item)"
                    >
                      {{ item.title }}
                    </span>
                    <span class="flex-shrink-0 text-xs text-gray-400">
                      {{ formatDate(item.createTime, 'MM-DD HH:mm') }}
                    </span>
                  </div>
                  <div
                    class="flex items-center justify-between gap-3 text-xs"
                  >
                    <div class="flex min-w-0 items-center gap-3">
                      <DictTag
                        :type="DICT_TYPE.AI_PPT_STATUS"
                        :value="item.status"
                      />
                      <span class="flex-shrink-0">
                        {{ item.finishCount }} / {{ item.slideCount }} 页
                      </span>
                      <span
                        v-if="item.status === AiPptStatusEnum.IN_PROGRESS"
                        class="truncate text-gray-500"
                      >
                        {{ getProgressText(item) }}
                      </span>
                    </div>
                    <div class="flex flex-shrink-0 items-center gap-3">
                      <Popover placement="bottomLeft" trigger="click">
                        <template #content>
                          <div
                            class="max-h-[240px] w-[340px] overflow-y-auto whitespace-pre-wrap break-all text-[13px]"
                          >
                            {{ item.prompt || '（无补充提示）' }}
                          </div>
                        </template>
                        <Button type="link" size="small" class="!px-0">
                          查看提示词
                        </Button>
                      </Popover>
                      <Button
                        type="text"
                        size="small"
                        class="!px-0"
                        @click="handleOutline(item)"
                      >
                        查看大纲
                      </Button>
                      <Button
                        v-if="item.status === AiPptStatusEnum.FAIL"
                        type="link"
                        size="small"
                        class="!px-0"
                        :loading="resumingId === item.id"
                        @click="handleResume(item)"
                      >
                        继续生成
                      </Button>
                      <Dropdown
                        v-if="item.status === AiPptStatusEnum.SUCCESS"
                        :trigger="['click']"
                        :disabled="exportingId === item.id"
                      >
                        <Button
                          type="link"
                          size="small"
                          class="!px-0"
                          :loading="exportingId === item.id"
                        >
                          导出
                          <IconifyIcon
                            icon="lucide:chevron-down"
                            class="ml-0.5 inline-block"
                          />
                        </Button>
                        <template #overlay>
                          <Menu
                            :items="EXPORT_MENU_ITEMS"
                            @click="({ key }) => handleExport(item, String(key))"
                          />
                        </template>
                      </Dropdown>
                      <Button
                        v-if="item.status !== AiPptStatusEnum.IN_PROGRESS"
                        type="link"
                        size="small"
                        danger
                        class="!px-0"
                        @click="handleDelete(item)"
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                  <div
                    v-if="
                      item.status === AiPptStatusEnum.FAIL && item.errorMessage
                    "
                    class="rounded bg-red-50 px-2.5 py-1.5 text-xs leading-[18px] text-red-500 dark:bg-red-950"
                  >
                    {{ item.errorMessage }}
                  </div>
                </div>
              </div>
            </div>
          </Spin>
        </div>
        <div class="flex justify-end pt-3">
          <Pagination
            v-model:current="queryParams.pageNo"
            v-model:page-size="queryParams.pageSize"
            :total="total"
            :show-total="(value: number) => `共 ${value} 条`"
            show-size-changer
            @change="() => getList()"
          />
        </div>
      </Card>
    </div>

    <!-- 预览、大纲 -->
    <PreviewModal @refresh="getList(true)" />
    <OutlineModal />
  </Page>
</template>
