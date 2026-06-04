<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmReturnSalesDetailApi } from '#/api/mes/wm/returnsales/detail';

import { computed, watch } from 'vue';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteReturnSalesDetail } from '#/api/mes/wm/returnsales/detail';
import { $t } from '#/locales';

import { type FormType, useDetailGridColumns } from '../data';

const props = defineProps<{
  details: MesWmReturnSalesDetailApi.ReturnSalesDetail[];
  formType: FormType;
}>();

const emit = defineEmits<{
  edit: [detailId: number];
  refresh: [];
}>();

const isStock = computed(() => props.formType === 'stock'); // 是否为上架模式

/** 编辑上架明细 */
function handleEdit(row: MesWmReturnSalesDetailApi.ReturnSalesDetail) {
  emit('edit', row.id!);
}

/** 删除上架明细 */
async function handleDelete(
  row: MesWmReturnSalesDetailApi.ReturnSalesDetail,
) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.warehouseName]),
  });
  try {
    await deleteReturnSalesDetail(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.warehouseName]));
    emit('refresh');
  } finally {
    loadingInstance.close();
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
  } as VxeTableGridOptions<MesWmReturnSalesDetailApi.ReturnSalesDetail>,
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
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
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
