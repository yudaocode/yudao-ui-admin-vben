<script setup lang="ts">
import type { PayWalletApi } from '#/api/pay/wallet/balance';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import WalletTransactionList from '../../transaction/index.vue';

const walletId = ref(0);

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData<PayWalletApi.Wallet>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      walletId.value = data.id;
    } finally {
      modalApi.unlock();
    }
  },
});
</script>
<template>
  <Modal
    title="消息详情"
    class="w-2/5"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <WalletTransactionList :wallet-id="walletId" />
  </Modal>
</template>
