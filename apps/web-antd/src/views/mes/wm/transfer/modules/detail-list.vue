<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmTransferDetailApi } from '#/api/mes/wm/transfer/detail';

import { computed, watch } from 'vue';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTransferDetail } from '#/api/mes/wm/transfer/detail';
import { $t } from '#/locales';

import { type FormType, useDetailGridColumns } from '../data';

const props = defineProps<{
  details: MesWmTransferDetailApi.TransferDetail[];
  formType: FormType;
}>();

const emit = defineEmits<{
  edit: [detailId: number];
  refresh: [];
}>();

const isStock = computed(() => props.formType === 'stock'); // 是否为上架模式

/** 编辑调拨明细 */
function handleEdit(row: MesWmTransferDetailApi.TransferDetail) {
  emit('edit', row.id!);
}

/** 删除调拨明细 */
async function handleDelete(row: MesWmTransferDetailApi.TransferDetail) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.toWarehouseName]),
    duration: 0,
  });
  try {
    await deleteTransferDetail(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.toWarehouseName]));
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
  } as VxeTableGridOptions<MesWmTransferDetailApi.TransferDetail>,
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
                  row.toWarehouseName,
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
