<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmSnApi } from '#/api/mes/wm/sn';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { BarcodeBizTypeEnum } from '@vben/constants';

import { message } from 'antdv-next';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSnListByUuid } from '#/api/mes/wm/sn';
import { BarcodeDetail } from '#/views/mes/wm/barcode/components';

import { useDetailGridColumns } from '../data';

defineOptions({ name: 'MesWmSnDetail' });

const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>();

/** 查看 SN 码条码 */
function handleBarcode(row: MesWmSnApi.Sn) {
  if (!row.id) {
    message.warning('缺少 SN 码编号，无法查看条码');
    return;
  }
  barcodeDetailRef.value?.openByBusiness(
    row.id,
    BarcodeBizTypeEnum.SN,
    row.code,
    row.itemName || row.code,
  );
}

/** 加载 SN 码明细 */
async function loadDetail(row?: MesWmSnApi.SnGroup) {
  if (!row?.uuid) {
    await gridApi.grid?.loadData([]);
    return;
  }
  gridApi.setLoading(true);
  try {
    const list = await getSnListByUuid(row.uuid);
    await gridApi.grid?.loadData(list);
  } finally {
    gridApi.setLoading(false);
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useDetailGridColumns(),
    height: 520,
    pagerConfig: {
      enabled: false,
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<MesWmSnApi.Sn>,
});

const [Modal, modalApi] = useVbenModal({
  showCancelButton: false,
  showConfirmButton: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      await gridApi.grid?.loadData([]);
      return;
    }
    await nextTick();
    await loadDetail(modalApi.getData<MesWmSnApi.SnGroup>());
  },
});
</script>

<template>
  <Modal class="w-3/5" title="SN 码明细">
    <Grid class="mx-4">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '条码',
              type: 'link',
              auth: ['mes:wm-sn:query'],
              onClick: handleBarcode.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
    <BarcodeDetail ref="barcodeDetailRef" />
  </Modal>
</template>
