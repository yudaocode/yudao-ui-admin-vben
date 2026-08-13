<script lang="ts" setup>
import type { FmsInitialBalanceApi } from '#/api/fms/config/initial-balance';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElResult,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { getTrialBalance } from '#/api/fms/config/initial-balance';
import { formatAmount } from '#/views/fms/utils/format';

defineOptions({ name: 'FmsTrialBalanceDialog' });

const result = ref<FmsInitialBalanceApi.TrialBalance>(); // 试算平衡结果

// 试算平衡明细行
const rows = computed(() =>
  result.value
    ? [
        {
          name: '期初余额（综合本位币）',
          debitAmount: formatAmount(result.value.openingDebitAmount),
          creditAmount: formatAmount(result.value.openingCreditAmount),
          differenceAmount: formatAmount(result.value.openingDifferenceAmount),
        },
        {
          name: '累计发生额（综合本位币）',
          debitAmount: formatAmount(result.value.yearDebitAmount),
          creditAmount: formatAmount(result.value.yearCreditAmount),
          differenceAmount: formatAmount(result.value.yearDifferenceAmount),
        },
      ]
    : [],
);

const [Modal, modalApi] = useVbenModal({
  showCancelButton: false,
  showConfirmButton: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      result.value = undefined;
      return;
    }
    const data = modalApi.getData<{ accountSetId: number }>();
    if (!data?.accountSetId) {
      return;
    }
    modalApi.lock();
    try {
      result.value = await getTrialBalance(data.accountSetId);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="试算平衡" class="w-[680px]">
    <ElResult
      :icon="result?.balanced ? 'success' : 'warning'"
      :title="result?.balanced ? '期初余额试算平衡' : '期初余额试算不平衡'"
      :sub-title="
        result?.balanced ? '借贷金额相等，可以开始记账' : '请检查期初余额和累计发生额'
      "
    />
    <ElTable border :data="rows">
      <ElTableColumn label="项目" min-width="180" prop="name" />
      <ElTableColumn
        align="right"
        label="借方"
        min-width="130"
        prop="debitAmount"
      />
      <ElTableColumn
        align="right"
        label="贷方"
        min-width="130"
        prop="creditAmount"
      />
      <ElTableColumn
        align="right"
        label="差额"
        min-width="130"
        prop="differenceAmount"
      />
    </ElTable>
    <template #footer>
      <ElButton type="primary" @click="modalApi.close()">我知道了</ElButton>
    </template>
  </Modal>
</template>
