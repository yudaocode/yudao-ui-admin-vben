<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { getContact, shareContact } from '#/api/oa/contact';
import { $t } from '#/locales';
import { UserSelect } from '#/views/system/user/components';

const emit = defineEmits(['success']);

const contactId = ref<number>(); // 共享联系人编号
const shareUserIds = ref<number[]>([]); // 共享接收人编号列表
const sharedUserIds = ref<number[]>([]); // 已共享的接收人编号列表

/** 是否存在新增的共享接收人 */
const hasNewReceiver = computed(() =>
  shareUserIds.value.some((id) => !sharedUserIds.value.includes(id)),
);

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!contactId.value || !hasNewReceiver.value) {
      return;
    }
    modalApi.lock();
    // 提交共享请求
    try {
      await shareContact(contactId.value, shareUserIds.value);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      contactId.value = undefined;
      shareUserIds.value = [];
      sharedUserIds.value = [];
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id: number };
    if (!data?.id) {
      return;
    }
    contactId.value = data.id;
    shareUserIds.value = [];
    sharedUserIds.value = [];
    modalApi.lock();
    try {
      // 查询最新共享关系，回显已有接收人，避免使用列表中的旧数据
      const detail = await getContact(data.id);
      sharedUserIds.value = (detail.shares || []).map((share) => share.userId);
      shareUserIds.value = [...sharedUserIds.value];
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="共享联系人" class="w-[560px]" :confirm-disabled="!hasNewReceiver">
    <div class="mx-4">
      <div class="flex items-center gap-2">
        <span class="w-20 shrink-0">共享接收人</span>
        <UserSelect
          v-model="shareUserIds"
          class="flex-1"
          multiple
          :allow-clear="false"
          placeholder="请选择共享接收人"
        />
      </div>
      <div class="mt-1 pl-22 text-xs text-gray-400">
        此处仅追加共享接收人，取消勾选不会撤销已有共享。
      </div>
    </div>
  </Modal>
</template>
