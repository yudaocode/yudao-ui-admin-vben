<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiOcrApi } from '#/api/ai/ocr';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { AiOcrStatusEnum } from '@vben/constants';

import { message, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteOcr, getOcrPage } from '#/api/ai/ocr';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';

/** AI 文字识别：识别记录管理 */
defineOptions({ name: 'AiOcrManager' });

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 查看详情 */
function handleDetail(row: AiOcrApi.Ocr) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 删除识别记录 */
async function handleDelete(row: AiOcrApi.Ocr) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.fileName]),
    duration: 0,
  });
  try {
    await deleteOcr(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.fileName]));
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
          return await getOcrPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    cellConfig: {
      height: 56, // 图片列含 40px 缩略图，默认行高会裁切
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<AiOcrApi.Ocr>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="AI 图片识别" url="https://doc.iocoder.cn/ai/ocr/" />
    </template>
    <DetailModal />
    <Grid table-title="图片识别管理列表">
      <template #status="{ row }">
        <Tag
          :color="row.status === AiOcrStatusEnum.SUCCESS ? 'success' : 'error'"
        >
          {{ row.status === AiOcrStatusEnum.SUCCESS ? '识别成功' : '识别失败' }}
        </Tag>
      </template>
      <template #errorMessage="{ row }">
        <span v-if="row.status === AiOcrStatusEnum.FAIL" class="text-red-500">
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
              auth: ['ai:ocr:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['ai:ocr:delete'],
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
