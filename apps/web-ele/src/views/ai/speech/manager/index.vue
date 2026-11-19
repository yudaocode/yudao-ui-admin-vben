<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiSpeechApi } from '#/api/ai/speech';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteSpeech, getSpeechPage } from '#/api/ai/speech';
import { $t } from '#/locales';
import {
  AiSpeechStatusEnum,
  AiSpeechStatusLabels,
  isSpeechRunning,
} from '#/views/ai/utils/speech';

import {
  getSpeechStatusTagType,
  useGridColumns,
  useGridFormSchema,
} from './data';
import Detail from './modules/detail.vue';

/** AI 语音生成：语音管理 */
defineOptions({ name: 'AiSpeechManager' });

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查看详情 */
function handleDetail(row: AiSpeechApi.Speech) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 删除语音 */
async function handleDelete(row: AiSpeechApi.Speech) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.id]),
  });
  try {
    await deleteSpeech(row.id);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    loadingInstance.close();
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
        <ElTag :type="getSpeechStatusTagType(row.status)">
          {{ AiSpeechStatusLabels[row.status] || '-' }}
        </ElTag>
      </template>
      <template #errorMessage="{ row }">
        <span
          v-if="row.status === AiSpeechStatusEnum.FAIL"
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
              auth: ['ai:speech:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
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
