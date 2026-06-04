<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmOutsourceIssueDetailApi } from '#/api/mes/wm/outsourceissue/detail';

import { computed, watch } from 'vue';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteOutsourceIssueDetail } from '#/api/mes/wm/outsourceissue/detail';
import { $t } from '#/locales';

import { type FormType, useDetailGridColumns } from '../data';

const props = defineProps<{
  details: MesWmOutsourceIssueDetailApi.OutsourceIssueDetail[];
  formType: FormType;
}>();

const emit = defineEmits<{
  edit: [detailId: number];
  refresh: [];
}>();

const isStock = computed(() => props.formType === 'stock'); // 是否为拣货模式

/** 编辑发料明细 */
function handleEdit(row: MesWmOutsourceIssueDetailApi.OutsourceIssueDetail) {
  emit('edit', row.id!);
}

/** 删除发料明细 */
async function handleDelete(
  row: MesWmOutsourceIssueDetailApi.OutsourceIssueDetail,
) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.warehouseName]),
  });
  try {
    await deleteOutsourceIssueDetail(row.id!);
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
  } as VxeTableGridOptions<MesWmOutsourceIssueDetailApi.OutsourceIssueDetail>,
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
