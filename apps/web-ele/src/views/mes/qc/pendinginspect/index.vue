<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcIpqcApi } from '#/api/mes/qc/ipqc';
import type { MesQcIqcApi } from '#/api/mes/qc/iqc';
import type { MesQcOqcApi } from '#/api/mes/qc/oqc';
import type { MesQcPendingInspectApi } from '#/api/mes/qc/pendinginspect';
import type { MesQcRqcApi } from '#/api/mes/qc/rqc';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesQcTypeEnum } from '@vben/constants';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getPendingInspectPage } from '#/api/mes/qc/pendinginspect';

import IpqcForm from '../ipqc/modules/form.vue';
import IqcForm from '../iqc/modules/form.vue';
import OqcForm from '../oqc/modules/form.vue';
import RqcForm from '../rqc/modules/form.vue';
import { useGridColumns, useGridFormSchema } from './data';

const [IqcFormModal, iqcFormModalApi] = useVbenModal({
  connectedComponent: IqcForm,
  destroyOnClose: true,
});
const [IpqcFormModal, ipqcFormModalApi] = useVbenModal({
  connectedComponent: IpqcForm,
  destroyOnClose: true,
});
const [OqcFormModal, oqcFormModalApi] = useVbenModal({
  connectedComponent: OqcForm,
  destroyOnClose: true,
});
const [RqcFormModal, rqcFormModalApi] = useVbenModal({
  connectedComponent: RqcForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建来料检验单（IQC） */
function handleCreateIqc(row: MesQcPendingInspectApi.PendingInspect) {
  const prefill: MesQcIqcApi.Iqc = {
    itemId: row.itemId,
    name: `${row.sourceDocCode} 来料检验单`,
    receivedQuantity: row.quantity,
    receiveDate: row.recordTime,
    sourceDocCode: row.sourceDocCode,
    sourceDocId: row.sourceDocId,
    sourceDocType: row.sourceDocType,
    sourceLineId: row.sourceLineId,
    vendorId: row.vendorId,
  };
  iqcFormModalApi.setData({ formType: 'create', prefill }).open();
}

/** 创建过程检验单（IPQC） */
function handleCreateIpqc(row: MesQcPendingInspectApi.PendingInspect) {
  const prefill: MesQcIpqcApi.Ipqc = {
    checkQuantity: row.quantity,
    inspectDate: row.recordTime,
    itemId: row.itemId,
    name: `${row.sourceDocCode} 过程检验单`,
    sourceDocCode: row.sourceDocCode,
    sourceDocId: row.sourceDocId,
    sourceDocType: row.sourceDocType,
    sourceLineId: row.sourceLineId,
    taskId: row.taskId,
    workOrderId: row.workOrderId,
    workstationId: row.workstationId,
  };
  ipqcFormModalApi.setData({ formType: 'create', prefill }).open();
}

/** 创建出货检验单（OQC） */
function handleCreateOqc(row: MesQcPendingInspectApi.PendingInspect) {
  const prefill: MesQcOqcApi.Oqc = {
    clientId: row.clientId,
    itemId: row.itemId,
    name: `${row.sourceDocCode} 出货检验单`,
    outDate: row.recordTime,
    outQuantity: row.quantity,
    sourceDocCode: row.sourceDocCode,
    sourceDocId: row.sourceDocId,
    sourceDocType: row.sourceDocType,
    sourceLineId: row.sourceLineId,
  };
  oqcFormModalApi.setData({ formType: 'create', prefill }).open();
}

/** 创建退货检验单（RQC） */
function handleCreateRqc(row: MesQcPendingInspectApi.PendingInspect) {
  const prefill: MesQcRqcApi.Rqc = {
    checkQuantity: row.quantity,
    inspectDate: row.recordTime,
    itemId: row.itemId,
    name: `${row.sourceDocCode} 退料检验单`,
    sourceDocCode: row.sourceDocCode,
    sourceDocId: row.sourceDocId,
    sourceDocType: row.sourceDocType,
    sourceLineId: row.sourceLineId,
  };
  rqcFormModalApi.setData({ formType: 'create', prefill }).open();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getPendingInspectPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<MesQcPendingInspectApi.PendingInspect>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【质量】待检任务、检验结果、缺陷记录"
        url="https://doc.iocoder.cn/mes/qc/pending-inspect/"
      />
    </template>

    <IqcFormModal @success="handleRefresh" />
    <IpqcFormModal @success="handleRefresh" />
    <OqcFormModal @success="handleRefresh" />
    <RqcFormModal @success="handleRefresh" />

    <Grid table-title="待检任务列表">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '来料检验',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.ADD,
              auth: ['mes:qc-iqc:create'],
              ifShow: row.qcType === MesQcTypeEnum.IQC,
              onClick: handleCreateIqc.bind(null, row),
            },
            {
              label: '过程检验',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.ADD,
              auth: ['mes:qc-ipqc:create'],
              ifShow: row.qcType === MesQcTypeEnum.IPQC,
              onClick: handleCreateIpqc.bind(null, row),
            },
            {
              label: '出货检验',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.ADD,
              auth: ['mes:qc-oqc:create'],
              ifShow: row.qcType === MesQcTypeEnum.OQC,
              onClick: handleCreateOqc.bind(null, row),
            },
            {
              label: '退料检验',
              type: 'primary',
              link: true,
              icon: ACTION_ICON.ADD,
              auth: ['mes:qc-rqc:create'],
              ifShow: row.qcType === MesQcTypeEnum.RQC,
              onClick: handleCreateRqc.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
