<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiSpeechApi } from '#/api/ai/speech';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message, Tag } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteSpeech, getSpeechPage } from '#/api/ai/speech';
import { $t } from '#/locales';
import {
  AiSpeechStatusEnum,
  AiSpeechStatusLabels,
  isSpeechRunning,
} from '#/views/ai/utils/speech';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';

/** AI 语音 列表 */
defineOptions({ name: 'AiSpeechManager' });

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 状态的标签颜色 */
function getStatusColor(status: number) {
  if (status === AiSpeechStatusEnum.SUCCESS) {
    return 'success';
  }
  return status === AiSpeechStatusEnum.FAIL ? 'error' : 'processing';
}

/** 查看详情 */
function handleDetail(row: AiSpeechApi.Speech) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 删除语音 */
async function handleDelete(row: AiSpeechApi.Speech) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deleteSpeech(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSpeechPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<AiSpeechApi.Speech>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="AI 语音生成" url="https://doc.iocoder.cn/ai/speech/" />
    </template>
    <DetailModal />
    <Grid table-title="语音生成管理列表">
      <template #status="{ row }">
        <Tag :color="getStatusColor(row.status)">
          {{ AiSpeechStatusLabels[row.status] || '-' }}
        </Tag>
      </template>
      <template #errorMessage="{ row }">
        <span
          v-if="row.status === AiSpeechStatusEnum.FAIL"
          class="text-red-500"
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
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['ai:speech:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['ai:speech:delete'],
              disabled: isSpeechRunning(row),
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                disabled: isSpeechRunning(row),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
