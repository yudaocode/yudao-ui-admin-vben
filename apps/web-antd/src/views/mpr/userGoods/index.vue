<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { UserGoodsApi } from '#/api/mpr/userGoods';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import {
  downloadFileFromBlobPart,
  formatDate,
  formatDateTime,
  isEmpty,
} from '@vben/utils';

import { Avatar, message, Select, Tabs, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { favoriteGoods } from '#/api/mpr/goods';
import {
  deleteUserGoods,
  deleteUserGoodsList,
  exportUserGoods,
  getUserGoodsPage,
} from '#/api/mpr/userGoods';
import { $t } from '#/locales';
import { DICT_TYPE, getDictOptions } from '#/utils';
import Detail from '#/views/mpr/goods/modules/detail.vue';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const goodsPhase = ref();

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

/** 创建用户商品 */
function handleCreate() {
  formModalApi.setData({}).open();
}

/** 编辑用户商品 */
function handleEdit(row: UserGoodsApi.UserGoods) {
  formModalApi.setData(row).open();
}

/** 查看商品详情 */
function handleDetail(row: GoodsApi.Goods) {
  // 获取浏览器时区
  // eslint-disable-next-line no-unused-vars
  const _browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // console.log('browserTz:', browserTz);
  // formModalApi.setData(row).open();
  detailModalApi.setData(row).open();
}

/** 打开fb-mp链接查看商品详情 */
function openInNewWindow(row: GoodsApi.Goods) {
  window.open(GoodsApi.FB_MP_GOODS_URL + row.goodsId, '_blank');
}

/** 收藏 */
// eslint-disable-next-line no-unused-vars
async function _openFavorite(row: GoodsApi.Goods) {
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
/** 删除用户商品 */
async function handleDelete(row: UserGoodsApi.UserGoods) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    key: 'action_key_msg',
  });
  try {
    await deleteUserGoods(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.id]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除用户商品 */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    key: 'action_key_msg',
  });
  try {
    await deleteUserGoodsList(checkedIds.value);
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
  records: UserGoodsApi.UserGoods[];
}) {
  checkedIds.value = records.map((item) => item.id);
}

/** 导出表格 */
async function handleExport() {
  const data = await exportUserGoods(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '用户商品.xls', source: data });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    wrapperClass: 'grid-cols-1 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1',
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
          return await getUserGoodsPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            goodsPhase: goodsPhase.value,
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
  } as VxeTableGridOptions<UserGoodsApi.UserGoods>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

/** 收藏 */
async function addFavorite(row: UserGoodsApi.UserGoods) {
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

function onChangeGoodsPhase(key: number | string) {
  goodsPhase.value = key.toString();
  gridApi.query();
}

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
    <Grid table-title="我的商品列表">
      <template #form-keywordId1="keywordId">
        <Select />{{keywordId}}
      </template>
      <template #top>
        <Tabs type="card" class="border-none" @change="onChangeGoodsPhase">
          <Tabs.TabPane tab="全部商品" key="" />
          <Tabs.TabPane
            v-for="item in getDictOptions(DICT_TYPE.MPR_GOODS_PHASE, 'number')"
            :key="item.value"
            :tab="item.label"
          />
        </Tabs>
      </template>
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
          <span class="flex-auto">
            <a
              :href="`https://www.facebook.com/marketplace/profile/${
                row.goods?.details.seller.sellerId
              }`"
              target="_blank">
              {{ row.goods?.details.seller.sellerName }}
            </a>
          </span>
          <div class="items-center justify-end"></div>
        </div>
        <div class="flex w-full items-center gap-1">
          <div class="size-5 flex-shrink-0">
            <IconifyIcon icon="ant-design:star-twotone" class="size-full" />
          </div>
          <span class="flex-auto">
            <a-rate
              allow-half
              :title="`评分:${
                row.goods?.details.seller.sellerRatingAverage
              }\r\nRating Count：${
                row.goods?.details.seller.sellerRatingCount
              }`"
              :value="row.goods?.details.seller.sellerRatingAverage"
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
              label: $t('ui.actionTitle.create', ['用户商品']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mpr:user-goods:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mpr:user-goods:export'],
              onClick: handleExport,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['mpr:user-goods:delete'],
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
              onClick: handleDetail.bind(null, row.goods),
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
              ifShow: () => !row.favorite?.id,
            },
            {
              label: $t('取消收藏'),
              //icon: 'material-symbols:favorite',
              onClick: addFavorite.bind(null, row),
              ifShow: () => !!row.favorite?.id,
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
      <template #actionsbak="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mpr:user-goods:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mpr:user-goods:delete'],
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
