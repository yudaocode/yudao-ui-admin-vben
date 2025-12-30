<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

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
  deleteGoods,
  deleteGoodsList,
  exportGoods,
  favoriteGoods,
  getGoodsPage,
  GoodsApi,
} from '#/api/mpr/goods';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建商品 */
function handleCreate() {
  formModalApi.setData({}).open();
}

/** 编辑商品 */
function handleEdit(row: GoodsApi.Goods) {
  // 获取浏览器时区
  // eslint-disable-next-line no-unused-vars
  const _browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // console.log('browserTz:', browserTz);
  formModalApi.setData(row).open();
}

/** 查看商品详情 */
function handleDetail(row: GoodsApi.Goods) {
  // 获取浏览器时区
  // eslint-disable-next-line no-unused-vars
  const _browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // formModalApi.setData(row).open();
  detailModalApi.setData(row).open();
}

/** 打开fb-mp链接查看商品详情 */
function openInNewWindow(row: GoodsApi.Goods) {
  window.open(GoodsApi.FB_MP_GOODS_URL + row.goodsId, '_blank');
}

/** 收藏 */
async function addFavorite(row: GoodsApi.Goods) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.updating', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await favoriteGoods(row.goodsId as string);
    message.success({
      content: $t('ui.actionMessage.updateSuccess'),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}
/** 删除商品 */
async function handleDelete(row: GoodsApi.Goods) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteGoods(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除商品 */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    key: 'action_key_msg',
  });
  try {
    await deleteGoodsList(checkedIds.value);
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

function handleRowCheckboxChange({ records }: { records: GoodsApi.Goods[] }) {
  checkedIds.value = records.map((item) => item.id);
}

/** 导出表格 */
async function handleExport() {
  const data = await exportGoods(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '商品.xls', source: data });
}

// 模拟保存接口
// eslint-disable-next-line no-unused-vars
const _saveCustomSetting = (_storeData: VxeTableDefines.CustomStoreData) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, 200);
  });
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    id: 'my_goods_tb',
    columns: useGridColumns(),
    height: 'auto',
    // border: true,
    size: 'large',
    pagerConfig: {
      enabled: true,
    },
    proxyConfig: {
      response: {
        // 对应响应结果 Promise<{ result: [], page: { total: 100 } }>
        result: 'contentData', // 配置响应结果列表字段
        total: 'totalSize', // 配置响应结果总页数字段
      },
      ajax: {
        query: async ({ page }, formValues) => {
          return await getGoodsPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    cellConfig: {
      height: 100,
    },
    customConfig: {
      storage: true,
      // mode: 'default',
      /* updateStore({ storeData }) {
        // 模拟异步，实现服务端保存
        return saveCustomSetting(storeData);
      },*/
    },
    columnConfig: {
      drag: false,
      // resizable: true,
    },
    rowConfig: {
      resizable: true,
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<GoodsApi.Goods>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

// 实现对点击用户头像的预览
const visible = ref<boolean>(false);
const src = ref<String>();
const setVisible = (value: boolean, s: string): void => {
  visible.value = value;
  src.value = s;
};
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <DetailModal @success="onRefresh" />
    <div style="display: none">
      <a-image
        :width="200"
        :height="0"
        :style="{ display: 'none' }"
        :preview="{ visible, onVisibleChange: setVisible }"
        :src="src"
      />
    </div>

    <Grid table-title="商品列表">
      <template #seller_default="{ row }">
        <div class="mb-1 flex w-full items-center gap-1">
          <div class="size-5 flex-shrink-0">
            <Avatar
              v-if="row.details.seller.sellerAvatar"
              class="cursor-pointer"
              :size="20"
              :src="row.details.seller.sellerAvatar"
              @click="
                () => setVisible(true, row.details.seller.sellerAvatar160)
              "
            />
            <IconifyIcon
              v-else
              icon="ant-design:user-outlined"
              class="size-full"
            />
          </div>
          <span class="flex-auto">{{ row.details.seller.sellerName }}</span>
          <div class="items-center justify-end"></div>
        </div>
        <div class="flex w-full items-center gap-1">
          <div class="size-5 flex-shrink-0">
            <IconifyIcon icon="ant-design:star-twotone" class="size-full" />
          </div>
          <span class="flex-auto">
            <a-rate
              allow-half
              :title="`评分:${row.details.seller.sellerRatingAverage}`"
              :value="row.details.seller.sellerRatingAverage"
              disabled
              size="mini"
          /></span>
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
              row.details.seller.sellerJoinTime,
            )?.toString()}`"
          >
            {{ formatDate(row.details.seller.sellerJoinTime)?.toString() }}
          </span>
          <div class="items-center justify-end"></div>
        </div>
      </template>
      <template #goods_status_default="{ row }">
        <Tag v-if="row.details.status.isSold">{{ '已售' }}</Tag>
        <Tag v-if="row.details.status.isPending">{{ '交易中' }}</Tag>
        <Tag v-if="row.details.status.isLive">{{ '在售' }}</Tag>
        <Tag v-if="row.details.status.isHidden">{{ '下架' }}</Tag>
      </template>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['商品']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mpr:goods:create'],
              onClick: handleCreate,
              ifShow: false,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mpr:goods:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['mpr:goods:delete'],
              onClick: handleDeleteBatch,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['mpr:goods:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('打开'),
              type: 'link',
              htmlType: 'link',
              icon: 'logos:facebook',
              auth: ['mpr:goods:query'],
              target: '_blank',
              onClick: openInNewWindow.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['hidden-mpr:goods:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['hidden-mpr:goods:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
          :drop-down-actions="[
            {
              label: $t('收藏'),
              //icon: 'material-symbols:favorite-outline',
              onClick: addFavorite.bind(null, row),
            },
            {
              label: $t('取消收藏'),
              //icon: 'material-symbols:favorite',
              onClick: addFavorite.bind(null, row),
            },
            {
              label: '修改（专家模式）',
              type: 'link',
              onClick: openInNewWindow.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              //icon: ACTION_ICON.DELETE,
              auth: ['mpr:assistant:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
