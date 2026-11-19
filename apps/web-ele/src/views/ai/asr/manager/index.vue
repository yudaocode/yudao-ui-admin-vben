<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiAsrApi } from '#/api/ai/asr';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { AiAsrStatusEnum } from '@vben/constants';

import { ElLoading, ElMessage, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteAsr, getAsrPage } from '#/api/ai/asr';
import { $t } from '#/locales';

import { getAsrStatusLabel, useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';

/** AI 语音识别：识别记录管理 */
defineOptions({ name: 'AiAsrManager' });

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查看详情 */
function handleDetail(row: AiAsrApi.Asr) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 删除识别记录 */
async function handleDelete(row: AiAsrApi.Asr) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.fileName]),
  });
  try {
    await deleteAsr(row.id);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.fileName]));
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
          return await getAsrPage({
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
  } as VxeTableGridOptions<AiAsrApi.Asr>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="AI 语音识别" url="https://doc.iocoder.cn/ai/asr/" />
    </template>
    <DetailModal />
    <Grid table-title="语音识别管理列表">
      <template #status="{ row }">
        <ElTag
          :type="row.status === AiAsrStatusEnum.SUCCESS ? 'success' : 'danger'"
        >
          {{ getAsrStatusLabel(row.status) }}
        </ElTag>
      </template>
      <template #originalText="{ row }">
        <span
          v-if="row.status === AiAsrStatusEnum.FAIL"
          class="text-[var(--el-color-danger)]"
        >
          {{ row.errorMessage || '-' }}
        </span>
        <span v-else>{{ row.originalText }}</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['ai:asr:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['ai:asr:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.fileName]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
