<script lang="ts" setup>
import type { Message } from '#/views/im/home/types';

import { computed, inject } from 'vue';

import { confirm } from '@vben/common-ui';
import { IconifyIcon as Icon } from '@vben/icons';

import { useMessageMultiSelect } from '#/views/im/home/composables/useMessageMultiSelect';
import { useConversationStore } from '#/views/im/home/store/conversationStore';
import { useMessageStore } from '#/views/im/home/store/messageStore';
import { ImForwardMode, isNormalMessage } from '#/views/im/utils/constants';
import { getClientConversationId } from '#/views/im/utils/db';

import { IM_FORWARD_DIALOG_KEY } from '../message/forward/keys';

defineOptions({ name: 'ImMessageMultiSelectBar' });

const conversationStore = useConversationStore();
const messageStore = useMessageStore();
const openForwardDialog = inject(IM_FORWARD_DIALOG_KEY);
const multiSelect = useMessageMultiSelect();

/** 选中条数 */
const selectedCount = computed(
  () => multiSelect.state.selectedClientMessageIds.length,
);

/** 当前会话内已选消息 */
function getSelectedMessages(): Message[] {
  const conversation = conversationStore.activeConversation;
  if (!conversation) {
    return [];
  }
  const ids = multiSelect.selectedIdSet.value;
  return messageStore
    .getMessages(
      getClientConversationId(conversation.type, conversation.targetId),
    )
    .filter(
      (message) =>
        ids.has(message.clientMessageId) && isNormalMessage(message.type),
    );
}

/** 逐条转发：开 ForwardDialog 单条模式 */
function handleForwardOneByOne() {
  const conversation = conversationStore.activeConversation;
  if (!conversation) {
    return;
  }
  const messages = getSelectedMessages();
  if (messages.length === 0) {
    return;
  }
  openForwardDialog?.({
    mode: ImForwardMode.SINGLE,
    messages,
    sourceConversation: conversation,
  });
}

/** 合并转发：开 ForwardDialog 合并模式 */
function handleForwardMerged() {
  const conversation = conversationStore.activeConversation;
  if (!conversation) {
    return;
  }
  const messages = getSelectedMessages();
  if (messages.length === 0) {
    return;
  }
  openForwardDialog?.({
    mode: ImForwardMode.MERGE,
    messages,
    sourceConversation: conversation,
  });
}

/** 删除：弹确认框 → 本地批量移除（不同步后端，对齐微信「删除」语义） */
async function handleDelete() {
  const conversation = conversationStore.activeConversation;
  if (!conversation) {
    return;
  }
  const messages = getSelectedMessages();
  if (messages.length === 0) {
    return;
  }
  try {
    await confirm(`确认删除选中的 ${messages.length} 条消息？`, {
      cancelText: '取消',
      confirmText: '确定',
      icon: 'warning',
      title: '删除确认',
    });
  } catch {
    return;
  }
  for (const m of messages) {
    messageStore.removeMessage(conversation.type, conversation.targetId, {
      id: m.id,
      clientMessageId: m.clientMessageId,
    });
  }
  multiSelect.exit();
}

/** 取消多选 */
function handleCancel() {
  multiSelect.exit();
}
</script>

<template>
  <div
    v-if="multiSelect.state.active"
    class="flex items-center justify-center gap-12 px-5 w-full h-full border-t border-t-solid bg-[var(--ant-color-bg-container)] border-[var(--im-border-color-lighter)]"
  >
    <span
      class="absolute left-5 top-1/2 -translate-y-1/2 text-12px text-[var(--ant-color-text-secondary)]"
    >
      已选 {{ selectedCount }} 条
    </span>

    <button
      class="inline-flex flex-col items-center gap-1 px-3 py-1 text-12px rounded-md border-0 bg-transparent cursor-pointer transition-colors text-[var(--ant-color-text)] hover:text-[var(--ant-color-primary)] hover:bg-[var(--ant-color-fill)] disabled:text-[var(--ant-color-text-disabled)] disabled:cursor-not-allowed disabled:bg-transparent"
      :disabled="selectedCount === 0"
      @click="handleForwardOneByOne"
    >
      <Icon icon="ant-design:share-alt-outlined" :size="22" />
      <span>逐条转发</span>
    </button>

    <button
      class="inline-flex flex-col items-center gap-1 px-3 py-1 text-12px rounded-md border-0 bg-transparent cursor-pointer transition-colors text-[var(--ant-color-text)] hover:text-[var(--ant-color-primary)] hover:bg-[var(--ant-color-fill)] disabled:text-[var(--ant-color-text-disabled)] disabled:cursor-not-allowed disabled:bg-transparent"
      :disabled="selectedCount === 0"
      @click="handleForwardMerged"
    >
      <Icon icon="tabler:arrow-merge" :size="22" />
      <span>合并转发</span>
    </button>

    <button
      class="inline-flex flex-col items-center gap-1 px-3 py-1 text-12px rounded-md border-0 bg-transparent cursor-pointer transition-colors text-[var(--ant-color-text)] hover:bg-[var(--ant-color-fill)] hover:text-[var(--ant-color-error)] disabled:text-[var(--ant-color-text-disabled)] disabled:cursor-not-allowed disabled:bg-transparent"
      :disabled="selectedCount === 0"
      @click="handleDelete"
    >
      <Icon icon="ant-design:delete-outlined" :size="22" />
      <span>删除</span>
    </button>

    <button
      class="absolute right-5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-full border-0 bg-transparent cursor-pointer transition-colors text-[var(--ant-color-text-secondary)] hover:text-[var(--ant-color-text)] hover:bg-[var(--ant-color-fill)]"
      @click="handleCancel"
    >
      <Icon icon="ant-design:close-outlined" :size="20" />
    </button>
  </div>
</template>
