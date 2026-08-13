<script lang="ts" setup>
import { nextTick } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, message } from 'antdv-next';

import FmsPrintPreview from '#/views/fms/components/print/fms-print-preview.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import { formatPeriodLabel } from '#/views/fms/utils/format';
import { buildFmsTablePrintHtml } from '#/views/fms/utils/print';

defineOptions({ name: 'FmsLedgerPrintButton' });

const props = withDefaults(
  defineProps<{
    beforePrint?: () => Promise<void> | void;
    centerText?: string;
    endMonth: string;
    permissionPrefix?: string;
    startMonth: string;
    target: string;
    title: string;
  }>(),
  {
    permissionPrefix: 'fms:ledger:general',
    centerText: '',
    beforePrint: undefined,
  },
);

const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS 状态

const [PrintModal, printModalApi] = useVbenModal({
  connectedComponent: FmsPrintPreview,
});

/** 打印账表 */
async function handlePrint() {
  await props.beforePrint?.();
  await nextTick();
  const tableElement = document.getElementById(props.target);
  if (!tableElement) {
    message.error('未找到可打印的表格');
    return;
  }
  printModalApi
    .setData({
      title: props.title,
      html: buildFmsTablePrintHtml({
        title: props.title,
        companyName: fmsStore.getAccountSet?.companyName || '',
        periodLabel: formatPeriodLabel(props.startMonth, props.endMonth),
        centerText: props.centerText,
        tableElement,
      }),
    })
    .open();
}
</script>

<template>
  <Button
    v-if="hasAccessByCodes([`${permissionPrefix}:print`])"
    @click="handlePrint"
  >
    <template #icon>
      <IconifyIcon icon="lucide:printer" />
    </template>
    打印
  </Button>

  <!-- 打印预览 -->
  <PrintModal />
</template>
