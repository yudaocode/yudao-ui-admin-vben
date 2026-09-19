<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaNoteCategoryApi } from '#/api/oa/note/category';

import { nextTick } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteNoteCategory,
  getNoteCategoryList,
} from '#/api/oa/note/category';
import { $t } from '#/locales';

import { useCategoryColumns } from '../data';
import CategoryForm from './category-form.vue';

const emit = defineEmits(['success']); // 目录变更通知

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: CategoryForm,
  destroyOnClose: true,
});

/** 刷新目录表格 */
async function getList() {
  const list = await getNoteCategoryList();
  await nextTick(); // 特殊：保证 gridApi 已经初始化
  await gridApi.grid.reloadData(list);
}

/** 新建目录 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑目录 */
function handleEdit(row: OaNoteCategoryApi.NoteCategory) {
  formModalApi.setData({ id: row.id }).open();
}

/** 删除目录 */
async function handleDelete(row: OaNoteCategoryApi.NoteCategory) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteNoteCategory(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    // 刷新目录列表并通知父组件
    await getList();
    emit('success');
  } finally {
    hideLoading();
  }
}

/** 目录保存成功 */
async function handleSuccess() {
  await getList();
  emit('success');
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useCategoryColumns(),
    autoResize: true,
    border: true,
    minHeight: 250,
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<OaNoteCategoryApi.NoteCategory>,
});

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    modalApi.lock();
    try {
      await getList();
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="管理笔记目录"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <FormModal @success="handleSuccess" />
    <div class="mx-4">
      <div class="mb-3 flex justify-end">
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['目录']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: handleCreate,
            },
          ]"
        />
      </div>
      <Grid>
        <template #actions="{ row }">
          <TableAction
            :actions="[
              {
                label: $t('common.edit'),
                type: 'link',
                icon: ACTION_ICON.EDIT,
                onClick: handleEdit.bind(null, row),
              },
              {
                label: $t('common.delete'),
                type: 'link',
                danger: true,
                icon: ACTION_ICON.DELETE,
                popConfirm: {
                  title:
                    '删除目录会同时删除目录内的笔记，所有共享接收人也将无法查看，是否继续？',
                  confirm: handleDelete.bind(null, row),
                },
              },
            ]"
          />
        </template>
      </Grid>
    </div>
  </Modal>
</template>
