<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ImManagerFacePackApi } from '#/api/im/manager/face/pack';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { isEmpty } from '@vben/utils';

import { Image, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteManagerFacePack,
  deleteManagerFacePackList,
  getManagerFacePackPage,
} from '#/api/im/manager/face/pack';
import { $t } from '#/locales';

import {
  usePackGridColumns,
  usePackGridFormSchema,
} from './data';
import Form from './modules/form.vue';
import ItemDrawer from './modules/item-drawer.vue';

defineOptions({ name: 'ImManagerFacePack' });

const itemDrawerRef = ref<InstanceType<typeof ItemDrawer>>();
const checkedIds = ref<number[]>([]);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建表情包 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑表情包 */
function handleEdit(row: ImManagerFacePackApi.FacePack) {
  formModalApi.setData(row).open();
}

/** 打开表情管理 */
function handleItems(row: ImManagerFacePackApi.FacePack) {
  itemDrawerRef.value?.open(row);
}

/** 删除表情包 */
async function handleDelete(row: ImManagerFacePackApi.FacePack) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteManagerFacePack(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除表情包 */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deletingBatch'),
    duration: 0,
  });
  try {
    await deleteManagerFacePackList(checkedIds.value);
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
  records: ImManagerFacePackApi.FacePack[];
}) {
  checkedIds.value = records.map((item) => item.id);
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: usePackGridFormSchema(),
  },
  gridOptions: {
    columns: usePackGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getManagerFacePackPage({
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
  } as VxeTableGridOptions<ImManagerFacePackApi.FacePack>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <ItemDrawer ref="itemDrawerRef" />
    <Grid table-title="表情包列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['表情包']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['im:manager:face-pack:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['im:manager:face-pack:delete'],
              disabled: isEmpty(checkedIds),
              popConfirm: {
                title: $t('ui.actionMessage.deleteBatchConfirm'),
                confirm: handleDeleteBatch,
              },
            },
          ]"
        />
      </template>
      <template #icon="{ row }">
        <Image v-if="row.icon" :height="32" :src="row.icon" :width="32" />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '管理表情',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['im:manager:face-pack-item:query'],
              onClick: handleItems.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['im:manager:face-pack:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['im:manager:face-pack:delete'],
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
