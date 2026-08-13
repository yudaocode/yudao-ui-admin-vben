<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, message } from 'antdv-next';

import FmsPrintPreview from '#/views/fms/components/print/fms-print-preview.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import { buildFmsTablePrintHtml } from '#/views/fms/utils/print';

defineOptions({ name: 'FmsReportPrintButton' });

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    periodLabel: string;
    target: string;
    title: string;
  }>(),
  {
    disabled: false,
  },
);

const fmsStore = useFmsStore(); // FMS 状态

const [PrintModal, printModalApi] = useVbenModal({
  connectedComponent: FmsPrintPreview,
});

/** 打印：构造目标表格的打印 HTML 并打开预览 */
function handlePrint() {
  const tableElement = document.getElementById(props.target);
  if (!tableElement) {
    message.error('未找到可打印的表格');
    return;
  }
  try {
    printModalApi
      .setData({
        title: props.title,
        html: buildFmsTablePrintHtml({
          title: props.title,
          companyName: fmsStore.getAccountSet?.companyName || '',
          periodLabel: props.periodLabel,
          footerLabels: ['单位负责人：', '会计负责人：', '制表人：'],
          tableElement,
        }),
      })
      .open();
  } catch {
    message.error('未找到可打印的表格');
  }
}
</script>

<template>
  <Button :disabled="disabled" @click="handlePrint">
    <template #icon>
      <IconifyIcon icon="lucide:printer" />
    </template>
    打印
  </Button>
  <PrintModal />
</template>
