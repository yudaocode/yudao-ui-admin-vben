<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcIqcLineApi } from '#/api/mes/qc/iqc/line';

import { useVbenModal } from '@vben/common-ui';
import { MesQcTypeEnum } from '@vben/constants';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getIqcLinePage } from '#/api/mes/qc/iqc/line';

import { DefectRecordInlineList } from '../../defectrecord/components';
import { type FormType, useLineGridColumns } from '../data';

const props = defineProps<{
  formType?: FormType;
  iqcId: number;
}>();

const emit = defineEmits<{ refresh: [] }>();

const [DefectModal, defectModalApi] = useVbenModal({
  connectedComponent: DefectRecordInlineList,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 缺陷记录变更后，刷新本表格并通知父组件刷新主表统计 */
function handleDefectChanged() {
  handleRefresh();
  emit('refresh');
}

/** 打开缺陷记录弹窗 */
function handleOpenDefect(row: MesQcIqcLineApi.IqcLine) {
  defectModalApi
    .setData({
      formType: props.formType,
      lineId: row.id,
      qcId: props.iqcId,
      qcType: MesQcTypeEnum.IQC,
    })
    .open();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useLineGridColumns(),
    height: 360,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.iqcId) {
            return { list: [], total: 0 };
          }
          return await getIqcLinePage({
            iqcId: props.iqcId,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
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
    },
  } as VxeTableGridOptions<MesQcIqcLineApi.IqcLine>,
});
</script>

<template>
  <div>
    <DefectModal @success="handleDefectChanged" />
    <Grid table-title="检验项">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '缺陷列表',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.VIEW,
              onClick: handleOpenDefect.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
