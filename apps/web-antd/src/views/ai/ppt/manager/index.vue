<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiPptApi } from '#/api/ai/ppt';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { AiPptExportFormatEnum, AiPptStatusEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, Image, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deletePpt, exportPpt, getPptPage } from '#/api/ai/ppt';
import { $t } from '#/locales';

import Outline from '../components/outline-modal.vue';
import Preview from '../components/preview-modal.vue';
import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'AiPptManager' });

const [PreviewModal, previewModalApi] = useVbenModal({
  connectedComponent: Preview,
  destroyOnClose: true,
});

const [OutlineModal, outlineModalApi] = useVbenModal({
  connectedComponent: Outline,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 预览：只读 */
function handlePreview(row: AiPptApi.Ppt) {
  previewModalApi.setData({ id: row.id, readonly: true }).open();
}

/** 查看大纲：只读 */
function handleOutline(row: AiPptApi.Ppt) {
  outlineModalApi.setData({ id: row.id, readonly: true }).open();
}

/** 导出：文件名取标题 */
const exportingId = ref<number>(); // 导出中的 PPT 编号
async function handleExport(row: AiPptApi.Ppt, format: string) {
  exportingId.value = row.id;
  try {
    const data = await exportPpt(row.id, format);
    downloadFileFromBlobPart({
      fileName: `${row.title}.${format}`,
      source: data,
    });
  } finally {
    exportingId.value = undefined;
  }
}

/** 删除 PPT：只删除记录，图片文件不随之删除 */
async function handleDelete(row: AiPptApi.Ppt) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.title]),
    duration: 0,
  });
  try {
    await deletePpt(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.title]));
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
          return await getPptPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    cellConfig: {
      height: 72, // 封面列为 56px 高的缩略图，默认行高会裁切
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<AiPptApi.Ppt>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="AI PPT 生成" url="https://doc.iocoder.cn/ai/ppt/" />
    </template>
    <PreviewModal />
    <OutlineModal />
    <Grid table-title="PPT 列表">
      <template #cover="{ row }">
        <Image
          v-if="row.coverUrl"
          :src="row.coverUrl"
          :width="100"
          :height="56"
          class="rounded object-cover"
        />
        <span v-else>-</span>
      </template>
      <template #errorMessage="{ row }">
        <span v-if="row.status === AiPptStatusEnum.FAIL" class="text-red-500">
          {{ row.errorMessage || '-' }}
        </span>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '预览',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['ai:ppt:query'],
              onClick: handlePreview.bind(null, row),
            },
            {
              label: '查看大纲',
              type: 'link',
              auth: ['ai:ppt:query'],
              onClick: handleOutline.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['ai:ppt:delete'],
              disabled: row.status === AiPptStatusEnum.IN_PROGRESS,
              popConfirm: {
                title: '确定删除该 PPT 吗？只删除记录，图片文件不随之删除。',
                disabled: row.status === AiPptStatusEnum.IN_PROGRESS,
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
          :drop-down-actions="[
            {
              label: '导出 PPTX',
              auth: ['ai:ppt:query'],
              ifShow: row.status === AiPptStatusEnum.SUCCESS,
              disabled: exportingId === row.id,
              onClick: () => handleExport(row, AiPptExportFormatEnum.PPTX),
            },
            {
              label: '导出 PDF',
              auth: ['ai:ppt:query'],
              ifShow: row.status === AiPptStatusEnum.SUCCESS,
              disabled: exportingId === row.id,
              onClick: () => handleExport(row, AiPptExportFormatEnum.PDF),
            },
          ]"
        >
          <template #more>
            <Button type="link" :loading="exportingId === row.id">
              导出
              <IconifyIcon
                icon="lucide:chevron-down"
                class="ml-0.5 inline-block"
              />
            </Button>
          </template>
        </TableAction>
      </template>
    </Grid>
  </Page>
</template>
