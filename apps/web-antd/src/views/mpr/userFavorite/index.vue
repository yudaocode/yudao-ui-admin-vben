<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { UserFavoriteApi } from '#/api/mpr/userFavorite';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import {
  downloadFileFromBlobPart,
  formatDate,
  formatDateTime,
  isEmpty,
} from '@vben/utils';

import { Avatar, message, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteUserFavorite,
  deleteUserFavoriteList,
  exportUserFavorite,
  getUserFavoritePage,
} from '#/api/mpr/userFavorite';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建用户收藏 */
function handleCreate() {
  formModalApi.setData({}).open();
}

/** 编辑用户收藏 */
function handleEdit(row: UserFavoriteApi.UserFavorite) {
  formModalApi.setData(row).open();
}

/** 删除用户收藏 */
async function handleDelete(row: UserFavoriteApi.UserFavorite) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteUserFavorite(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除用户收藏 */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    key: 'action_key_msg',
  });
  try {
    await deleteUserFavoriteList(checkedIds.value);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess'),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: UserFavoriteApi.UserFavorite[];
}) {
  checkedIds.value = records.map((item) => item.id);
}

/** 导出表格 */
async function handleExport() {
  const data = await exportUserFavorite(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '用户收藏.xls', source: data });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: {
      enabled: true,
    },
    cellConfig: {
      height: 100,
    },
    proxyConfig: {
      response: {
        // 对应响应结果 Promise<{ result: [], page: { total: 100 } }>
        result: 'contentData', // 配置响应结果列表字段
        total: 'totalSize', // 配置响应结果总页数字段
      },
      ajax: {
        query: async ({ page }, formValues) => {
          return await getUserFavoritePage({
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
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<UserFavoriteApi.UserFavorite>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />

    <Grid table-title="用户收藏列表">
      <template #seller_default="{ row }">
        <div class="mb-1 flex w-full items-center gap-1">
          <div class="size-5 flex-shrink-0">
            <Avatar
              v-if="row.goods?.details.seller.sellerAvatar"
              class="cursor-pointer"
              :size="20"
              :src="row.goods?.details.seller.sellerAvatar"
              @click="
                () =>
                  setVisible(true, row.goods?.details.seller.sellerAvatar160)
              "
            />
            <IconifyIcon
              v-else
              icon="ant-design:user-outlined"
              class="size-full"
            />
          </div>
          <span class="flex-auto">{{
            row.goods?.details.seller.sellerName
          }}</span>
          <div class="items-center justify-end"></div>
        </div>
        <div class="flex w-full items-center gap-1">
          <div class="size-5 flex-shrink-0">
            <IconifyIcon icon="ant-design:star-twotone" class="size-full" />
          </div>
          <span class="flex-auto">
            <a-rate
              allow-half
              :title="`评分:${row.goods?.details.seller.sellerRatingAverage}`"
              :value="row.goods?.details.seller.sellerRatingAverage"
              disabled
              size="mini"
            />
          </span>
          <div class="items-center justify-end"></div>
        </div>
        <div class="flex w-full items-center gap-1">
          <div class="size-5 flex-shrink-0">
            <IconifyIcon
              icon="ant-design:field-time-outlined"
              class="size-full"
            />
          </div>
          <span
            class="flex-auto"
            :title="`注册日期：${formatDateTime(
              row.goods?.details.seller.sellerJoinTime,
            )?.toString()}`"
          >
            {{
              formatDate(row.goods?.details.seller.sellerJoinTime)?.toString()
            }}
          </span>
          <div class="items-center justify-end"></div>
        </div>
      </template>
      <template #goods_status_default="{ row }">
        <Tag v-if="row.goods?.details.status.isSold">{{ '已售' }}</Tag>
        <Tag v-if="row.goods?.details.status.isPending">{{ '交易中' }}</Tag>
        <Tag v-if="row.goods?.details.status.isLive">{{ '在售' }}</Tag>
        <Tag v-if="row.goods?.details.status.isHidden">{{ '下架' }}</Tag>
      </template>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['用户收藏']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mpr:user-favorite:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mpr:user-favorite:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['mpr:user-favorite:delete'],
              onClick: handleDeleteBatch,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mpr:user-favorite:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('取消收藏'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mpr:user-favorite:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.cancelFavoriteConfirm', [row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
