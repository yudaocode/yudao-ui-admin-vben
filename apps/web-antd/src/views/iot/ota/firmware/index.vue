<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IoTOtaFirmwareApi } from '#/api/iot/ota/firmware';

import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteOtaFirmware, getOtaFirmwarePage } from '#/api/iot/ota/firmware';
import { $t } from '#/locales';

import {
  getProductName,
  useGridColumns,
  useGridFormSchema,
} from './data';
import OtaFirmwareForm from './modules/form.vue';

const { push } = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: OtaFirmwareForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建固件 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑固件 */
function handleEdit(row: IoTOtaFirmwareApi.Firmware) {
  formModalApi.setData({ id: row.id }).open();
}

/** 删除固件 */
async function handleDelete(row: IoTOtaFirmwareApi.Firmware) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteOtaFirmware(row.id!);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
    });
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 查看固件详情 */
function handleDetail(row: IoTOtaFirmwareApi.Firmware) {
  push({ name: 'IoTOtaFirmwareDetail', params: { id: row.id } });
}

/** 跳转到产品详情 */
function handleOpenProductDetail(productId: number) {
  push({ name: 'IoTProductDetail', params: { id: productId } });
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
          return await getOtaFirmwarePage({
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
  } as VxeTableGridOptions<IoTOtaFirmwareApi.Firmware>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <Grid table-title="固件列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['固件']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['iot:ota-firmware:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <!-- 所属产品列：点击跳产品详情 -->
      <template #productName="{ row }">
        <a
          v-if="row.productId && getProductName(row.productId) !== '-'"
          class="cursor-pointer text-primary hover:underline"
          @click="handleOpenProductDetail(row.productId)"
        >
          {{ getProductName(row.productId) }}
        </a>
        <span v-else class="text-gray-400">-</span>
      </template>
      <!-- 固件文件列 -->
      <template #fileUrl="{ row }">
        <div
          v-if="row.fileUrl"
          class="inline-flex items-center gap-1.5 align-middle leading-none"
        >
          <IconifyIcon
            icon="ant-design:download-outlined"
            class="shrink-0 align-middle text-base text-primary"
          />
          <a
            :href="row.fileUrl"
            target="_blank"
            download
            class="cursor-pointer align-middle text-primary hover:underline"
          >
            下载固件
          </a>
        </div>
        <span v-else class="text-gray-400">无文件</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['iot:ota-firmware:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['iot:ota-firmware:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['iot:ota-firmware:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
