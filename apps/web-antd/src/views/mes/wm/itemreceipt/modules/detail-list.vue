<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmItemReceiptDetailApi } from '#/api/mes/wm/itemreceipt/detail';

import { computed, watch } from 'vue';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteItemReceiptDetail } from '#/api/mes/wm/itemreceipt/detail';
import { $t } from '#/locales';

import { type FormType, useDetailGridColumns } from '../data';

const props = defineProps<{
  details: MesWmItemReceiptDetailApi.ItemReceiptDetail[];
  formType: FormType;
}>();

const emit = defineEmits<{
  edit: [detailId: number];
  refresh: [];
}>();

const isStock = computed(() => props.formType === 'stock'); // 是否为上架模式

/** 编辑上架明细 */
function handleEdit(row: MesWmItemReceiptDetailApi.ItemReceiptDetail) {
  emit('edit', row.id!);
}

/** 删除上架明细 */
async function handleDelete(
  row: MesWmItemReceiptDetailApi.ItemReceiptDetail,
) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.warehouseName]),
    duration: 0,
  });
  try {
    await deleteItemReceiptDetail(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.warehouseName]));
    emit('refresh');
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useDetailGridColumns(isStock.value),
    data: props.details,
    pagerConfig: {
      enabled: false,
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    size: 'small',
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<MesWmItemReceiptDetailApi.ItemReceiptDetail>,
});

watch(
  () => props.details,
  (details) => gridApi.setGridOptions({ data: details }),
);
</script>

<template>
  <div class="px-4 py-2">
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
                title: $t('ui.actionMessage.deleteConfirm', [
                  row.warehouseName,
                ]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
