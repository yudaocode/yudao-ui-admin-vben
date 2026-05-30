<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmOutsourceReceiptDetailApi } from '#/api/mes/wm/outsourcereceipt/detail';

import { computed, watch } from 'vue';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteOutsourceReceiptDetail } from '#/api/mes/wm/outsourcereceipt/detail';
import { $t } from '#/locales';

import { type FormType, useDetailGridColumns } from '../data';

const props = defineProps<{
  details: MesWmOutsourceReceiptDetailApi.OutsourceReceiptDetail[];
  formType: FormType;
}>();

const emit = defineEmits<{
  edit: [detailId?: number];
  refresh: [];
}>();

const isEditable = computed(() => // 是否可维护收货明细（编辑或上架态）
  ['create', 'stock', 'update'].includes(props.formType),
);

/** 添加收货明细 */
function handleCreate() {
  emit('edit', undefined);
}

/** 编辑收货明细 */
function handleEdit(row: MesWmOutsourceReceiptDetailApi.OutsourceReceiptDetail) {
  emit('edit', row.id!);
}

/** 删除收货明细 */
async function handleDelete(
  row: MesWmOutsourceReceiptDetailApi.OutsourceReceiptDetail,
) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.warehouseName]),
  });
  try {
    await deleteOutsourceReceiptDetail(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.warehouseName]));
    emit('refresh');
  } finally {
    loadingInstance.close();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useDetailGridColumns(isEditable.value),
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
  } as VxeTableGridOptions<MesWmOutsourceReceiptDetailApi.OutsourceReceiptDetail>,
});

watch(
  () => props.details,
  (details) => gridApi.setGridOptions({ data: details }),
);
</script>

<template>
  <div class="px-4 py-2">
    <TableAction
      v-if="isEditable"
      class="mb-2"
      :actions="[
        {
          label: '添加明细',
          type: 'primary',
          icon: ACTION_ICON.ADD,
          onClick: handleCreate,
        },
      ]"
    />
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
