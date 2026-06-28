<script lang="ts" setup>
import type { MergeMessage } from '#/views/im/utils/message';

import { computed, ref } from 'vue';

import { IconifyIcon as Icon } from '@vben/icons';

import { Modal } from 'ant-design-vue';

import { UserAvatar } from '#/views/im/home/components/user';
import { useVoicePlayer } from '#/views/im/home/composables/useVoicePlayer';
import { parseMessage } from '#/views/im/utils/message';
import { formatMergeItemTime } from '#/views/im/utils/time';

import { MessageBubble } from '..';

defineOptions({ name: 'ImMessageMergeDetailDialog' });

const voicePlayer = useVoicePlayer();
const visible = ref(false);

const stack = ref<MergeMessage[]>([]); // 嵌套层级栈，存 parsed payload 避免切层重 parse

defineExpose({
  /** 打开详情弹窗，传入顶层合并消息 content */
  open(content: string) {
    const payload = parseMessage<MergeMessage>(content);
    stack.value = payload ? [payload] : [];
    visible.value = true;
  },
});

/** 当前层 payload */
const currentPayload = computed<MergeMessage | null>(
  () => stack.value[stack.value.length - 1] ?? null,
);

/** 嵌套合并气泡点击：解析 content 后压栈进入下一层 */
function handleNestedOpen(content: string) {
  const payload = parseMessage<MergeMessage>(content);
  if (payload) {
    stack.value.push(payload);
  }
}

/** 顶部返回箭头点击：弹出栈顶回到上一层 */
function handleBack() {
  if (stack.value.length > 1) {
    stack.value.pop();
  }
}

/** 弹窗关闭：清栈 + 停语音，下次打开从顶层重新开始 */
function handleClose() {
  stack.value = [];
  voicePlayer.stop();
}
</script>

<template>
  <Modal
    v-model:open="visible"
    width="560px"
    :footer="null"
    :mask-closable="false"
    class="im-merge-detail-dialog"
    :closable="true"
    @close="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <Icon
          v-if="stack.length > 1"
          icon="ant-design:left-outlined"
          class="cursor-pointer text-[var(--ant-color-text-secondary)] hover:text-[var(--ant-color-text)]"
          @click="handleBack"
        />
        <span class="text-base font-medium truncate">{{
          currentPayload?.title || '聊天记录'
        }}</span>
      </div>
    </template>

    <div v-if="currentPayload" class="flex flex-col h-[480px]">
      <div
        class="px-4 py-2 text-12px text-[var(--ant-color-text-secondary)] border-b border-b-solid border-[var(--ant-color-border-secondary)]"
      >
        以下是 {{ currentPayload.messages.length }} 条消息
      </div>
      <!-- overflow-y-auto：合并消息多时在定高弹窗内可滚动，对齐 Vue3 的 el-scrollbar -->
      <div class="flex-1 overflow-y-auto">
        <div
          v-for="(item, idx) in currentPayload.messages"
          :key="idx"
          class="flex gap-3 items-start px-4 py-3 border-b border-b-solid border-[var(--ant-color-border-secondary)]"
        >
          <UserAvatar
            :url="item.senderAvatar"
            :name="item.senderNickname"
            :size="36"
            :clickable="false"
          />
          <div class="flex-1 min-w-0">
            <div class="flex gap-2 items-baseline">
              <span
                class="text-13px font-medium text-[var(--ant-color-text)] truncate"
              >
                {{ item.senderNickname }}
              </span>
              <span
                class="text-12px text-[var(--ant-color-text-secondary)] flex-shrink-0"
              >
                {{ formatMergeItemTime(item.sendTime) }}
              </span>
            </div>
            <!-- 复用主聊天气泡渲染；MERGE 嵌套点击 push 当前层 -->
            <div class="mt-1.5">
              <MessageBubble
                :type="item.type"
                :content="item.content"
                @open-merge="handleNestedOpen($event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
/* :deep 穿透 el-dialog 内部 body，去掉默认内边距，让滚动区贴边 */
.im-merge-detail-dialog :deep(.el-dialog__body) {
  padding: 0;
}
</style>
