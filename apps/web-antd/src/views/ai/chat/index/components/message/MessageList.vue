<script setup lang="ts">
import type { PropType } from 'vue';

import type { AiChatConversationApi } from '#/api/ai/chat/conversation';
import type { AiChatMessageApi } from '#/api/ai/chat/message';

import { computed, nextTick, onMounted, ref, toRefs } from 'vue';

import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { formatDate } from '@vben/utils';

import { useClipboard } from '@vueuse/core';
import { Avatar, Button, message } from 'ant-design-vue';

import { deleteChatMessage } from '#/api/ai/chat/message';
import { MarkdownView } from '#/components/markdown-view';

import MessageKnowledge from './MessageKnowledge.vue';
// 定义 props
const props = defineProps({
  conversation: {
    type: Object as PropType<AiChatConversationApi.ChatConversationVO>,
    required: true,
  },
  list: {
    type: Array as PropType<AiChatMessageApi.ChatMessageVO[]>,
    required: true,
  },
});
// 消息列表

const emits = defineEmits(['onDeleteSuccess', 'onRefresh', 'onEdit']);
const { copy } = useClipboard(); // 初始化 copy 到粘贴板
const userStore = useUserStore();

// 判断“消息列表”滚动的位置(用于判断是否需要滚动到消息最下方)
const messageContainer: any = ref(null);
const isScrolling = ref(false); // 用于判断用户是否在滚动

const userAvatar = computed(
  () => userStore.userInfo?.avatar || preferences.app.defaultAvatar,
);
const roleAvatar = computed(
  () => props.conversation.roleAvatar ?? '/static/gpt.svg',
);

const { list } = toRefs(props); // 定义 emits

// ============ 处理对话滚动 ==============

/** 滚动到底部 */
const scrollToBottom = async (isIgnore?: boolean) => {
  // 注意要使用 nextTick 以免获取不到 dom
  await nextTick();
  if (isIgnore || !isScrolling.value) {
    messageContainer.value.scrollTop =
      messageContainer.value.scrollHeight - messageContainer.value.offsetHeight;
  }
};
function handleScroll() {
  const scrollContainer = messageContainer.value;
  const scrollTop = scrollContainer.scrollTop;
  const scrollHeight = scrollContainer.scrollHeight;
  const offsetHeight = scrollContainer.offsetHeight;
  isScrolling.value = scrollTop + offsetHeight < scrollHeight - 100;
}

/** 回到底部 */
async function handleGoBottom() {
  const scrollContainer = messageContainer.value;
  scrollContainer.scrollTop = scrollContainer.scrollHeight;
}

/** 回到顶部 */
async function handlerGoTop() {
  const scrollContainer = messageContainer.value;
  scrollContainer.scrollTop = 0;
}

defineExpose({ scrollToBottom, handlerGoTop }); // 提供方法给 parent 调用

// ============ 处理消息操作 ==============

/** 复制 */
async function copyContent(content: string) {
  await copy(content);
  message.success('复制成功！');
}
/** 删除 */
async function onDelete(id: number) {
  // 删除 message
  await deleteChatMessage(id);
  message.success('删除成功！');
  // 回调
  emits('onDeleteSuccess');
}

/** 刷新 */
async function onRefresh(message: AiChatMessageApi.ChatMessageVO) {
  emits('onRefresh', message);
}

/** 编辑 */
async function onEdit(message: AiChatMessageApi.ChatMessageVO) {
  emits('onEdit', message);
}

/** 初始化 */
onMounted(async () => {
  messageContainer.value.addEventListener('scroll', handleScroll);
});
</script>
<template>
  <div ref="messageContainer" class="relative h-full overflow-y-auto">
    <div
      v-for="(item, index) in list"
      :key="index"
      class="mt-[50px] flex flex-col overflow-y-hidden px-[20px]"
    >
      <!-- 左侧消息：system、assistant -->
      <div v-if="item.type !== 'user'" class="flex flex-row">
        <div class="avatar">
          <Avatar :src="roleAvatar" />
        </div>
        <div class="mx-[15px] flex flex-col text-left">
          <div class="text-left leading-[30px]">
            {{ formatDate(item.createTime) }}
          </div>
          <div
            class="relative flex flex-col break-words rounded-[10px] bg-[#e4e4e4cc] p-[10px] pb-[5px] pt-[10px] shadow-[0_0_0_1px_rgba(228,228,228,0.8)]"
          >
            <MarkdownView
              class="text-[0.95rem] text-[#393939]"
              :content="item.content"
            />
            <MessageKnowledge v-if="item.segments" :segments="item.segments" />
          </div>
          <div class="mt-[8px] flex flex-row">
            <Button
              class="flex items-center bg-transparent px-[5px] hover:bg-[#f6f6f6]"
              type="text"
              @click="copyContent(item.content)"
            >
              <img class="h-[20px]" src="/static/copy.svg" />
            </Button>
            <Button
              v-if="item.id > 0"
              class="flex items-center bg-transparent px-[5px] hover:bg-[#f6f6f6]"
              type="text"
              @click="onDelete(item.id)"
            >
              <img class="h-[17px]" src="/static/delete.svg" />
            </Button>
          </div>
        </div>
      </div>

      <!-- 右侧消息：user -->
      <div v-else class="flex flex-row-reverse justify-start">
        <div class="avatar">
          <Avatar :src="userAvatar" />
        </div>
        <div class="mx-[15px] flex flex-col text-left">
          <div class="text-left leading-[30px]">
            {{ formatDate(item.createTime) }}
          </div>
          <div class="flex flex-row-reverse">
            <div
              class="inline w-auto whitespace-pre-wrap break-words rounded-[10px] bg-[#267fff] p-[10px] text-[0.95rem] text-white shadow-[0_0_0_1px_#267fff]"
            >
              {{ item.content }}
            </div>
          </div>
          <div class="mt-[8px] flex flex-row-reverse">
            <Button
              class="flex items-center bg-transparent px-[5px] hover:bg-[#f6f6f6]"
              type="text"
              @click="copyContent(item.content)"
            >
              <img class="h-[20px]" src="/static/copy.svg" />
            </Button>
            <Button
              class="flex items-center bg-transparent px-[5px] hover:bg-[#f6f6f6]"
              type="text"
              @click="onDelete(item.id)"
            >
              <img class="h-[17px]" src="/static/delete.svg" />
            </Button>
            <Button
              class="flex items-center bg-transparent px-[5px] hover:bg-[#f6f6f6]"
              type="text"
              @click="onRefresh(item)"
            >
              <span class="icon-[ant-design--redo-outlined]"></span>
            </Button>
            <Button
              class="flex items-center bg-transparent px-[5px] hover:bg-[#f6f6f6]"
              type="text"
              @click="onEdit(item)"
            >
              <span class="icon-[ant-design--form-outlined]"></span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 回到底部按钮 -->
  <div
    v-if="isScrolling"
    class="absolute bottom-0 right-1/2 z-[1000]"
    @click="handleGoBottom"
  >
    <Button shape="circle">
      <span class="icon-[ant-design--down-outlined]"></span>
    </Button>
  </div>
</template>
