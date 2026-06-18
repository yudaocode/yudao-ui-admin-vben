<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ImManagerFacePackItemVO } from '#/api/im/manager/face/item';
import type { ImManagerFacePackVO } from '#/api/im/manager/face/pack';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { isEmpty } from '@vben/utils';

import { Drawer, Image, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteManagerFacePackItem,
  deleteManagerFacePackItemList,
  getManagerFacePackItemPage,
} from '#/api/im/manager/face/item';
import { $t } from '#/locales';

import { useItemGridColumns, useItemGridFormSchema } from '../data';
import ItemForm from './item-form.vue';

const visible = ref(false);
const currentPack = ref<ImManagerFacePackVO>();
const checkedIds = ref<number[]>([]);
const title = computed(() =>
  currentPack.value ? `「${currentPack.value.name}」表情管理` : '表情管理',
);

const [ItemFormModal, itemFormModalApi] = useVbenModal({
  connectedComponent: ItemForm,
  destroyOnClose: true,
});

/** 打开抽屉 */
function open(pack: ImManagerFacePackVO) {
  currentPack.value = pack;
  visible.value = true;
  checkedIds.value = [];
}

defineExpose({ open });

/** 抽屉打开后查询表情列表 */
async function handleOpenChange(open: boolean) {
  if (!open) {
    return;
  }
  await nextTick();
  gridApi.query();
}

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建表情 */
function handleCreate() {
  itemFormModalApi.setData({ packId: currentPack.value?.id }).open();
}

/** 编辑表情 */
function handleEdit(row: ImManagerFacePackItemVO) {
  itemFormModalApi
    .setData({ id: row.id, packId: currentPack.value?.id })
    .open();
}

/** 删除表情 */
async function handleDelete(row: ImManagerFacePackItemVO) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name || row.id]),
    duration: 0,
  });
  try {
    await deleteManagerFacePackItem(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name || row.id]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除表情 */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deletingBatch'),
    duration: 0,
  });
  try {
    await deleteManagerFacePackItemList(checkedIds.value);
    checkedIds.value = [];
    message.success($t('ui.actionMessage.deleteSuccess'));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 表格选中变化 */
function handleRowCheckboxChange({
  records,
}: {
  records: ImManagerFacePackItemVO[];
}) {
  checkedIds.value = records.map((item) => item.id);
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useItemGridFormSchema(),
  },
  gridOptions: {
    columns: useItemGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getManagerFacePackItemPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            packId: currentPack.value?.id,
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
  } as VxeTableGridOptions<ImManagerFacePackItemVO>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Drawer
    v-model:open="visible"
    :title="title"
    destroy-on-close
    width="65%"
    @after-open-change="handleOpenChange"
  >
    <ItemFormModal @success="handleRefresh" />
    <Grid table-title="表情列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['表情']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['im:manager:face-pack-item:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['im:manager:face-pack-item:delete'],
              disabled: isEmpty(checkedIds),
              popConfirm: {
                title: $t('ui.actionMessage.deleteBatchConfirm'),
                confirm: handleDeleteBatch,
              },
            },
          ]"
        />
      </template>
      <template #image="{ row }">
        <Image v-if="row.url" :height="40" :src="row.url" :width="40" />
      </template>
      <template #size="{ row }">
        <span v-if="row.width || row.height">
          {{ row.width || '?' }} × {{ row.height || '?' }}
        </span>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['im:manager:face-pack-item:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['im:manager:face-pack-item:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name || row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Drawer>
</template>
