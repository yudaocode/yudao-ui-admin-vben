<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';

import { Result } from 'antdv-next';

defineOptions({ name: 'FmsAccountSetGuide' });

type GuideReason = 'empty' | 'uninitialized';

const FMS_ACCOUNT_SET_PATH = '/fms/config/account-set'; // 账套管理

const router = useRouter();
const { hasAccessByCodes } = useAccess();

const reason = ref<GuideReason>('empty'); // 引导原因

/** 当前用户是否可以自行处理账套问题 */
const canHandle = computed(() =>
  reason.value === 'empty'
    ? hasAccessByCodes(['fms:config:account-set:create'])
    : hasAccessByCodes(['fms:config:account-set:initialize']),
);
/** 引导标题 */
const title = computed(() =>
  reason.value === 'empty' ? '当前账号暂无账套' : '当前账套尚未初始化',
);
/** 引导说明 */
const description = computed(() => {
  if (reason.value === 'empty') {
    return canHandle.value
      ? '请先创建账套并完成初始化，再进入财务管理。'
      : '请联系管理员创建账套，或将当前账号加入已有账套。';
  }
  return canHandle.value
    ? '请前往账套管理，选择账套并点击【开始记账】完成初始化。'
    : '请联系管理员完成账套初始化后再进入财务管理。';
});

const [Modal, modalApi] = useVbenModal({
  cancelText: '我知道了',
  confirmText: '前往账套管理',
  async onConfirm() {
    await modalApi.close();
    router.push(FMS_ACCOUNT_SET_PATH);
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData<{ reason: GuideReason }>();
    reason.value = data?.reason ?? 'empty';
    // 无权自行处理时只展示“我知道了”
    modalApi.setState({
      cancelText: canHandle.value ? '稍后处理' : '我知道了',
      showConfirmButton: canHandle.value,
    });
  },
});
</script>

<template>
  <Modal
    :close-on-click-modal="false"
    class="w-[560px]"
    title="账套开通引导"
  >
    <Result status="warning" :sub-title="description" :title="title" />
  </Modal>
</template>
