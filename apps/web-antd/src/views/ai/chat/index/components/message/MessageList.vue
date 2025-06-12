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
import MarkdownView from '#/components/MarkdownView/index.vue';

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
const handleGoBottom = async () => {
  const scrollContainer = messageContainer.value;
  scrollContainer.scrollTop = scrollContainer.scrollHeight;
};

/** 回到顶部 */
const handlerGoTop = async () => {
  const scrollContainer = messageContainer.value;
  scrollContainer.scrollTop = 0;
};

defineExpose({ scrollToBottom, handlerGoTop }); // 提供方法给 parent 调用

// ============ 处理消息操作 ==============

/** 复制 */
const copyContent = async (content: string) => {
  await copy(content);
  message.success('复制成功！');
};
/** 删除 */
const onDelete = async (id: number) => {
  // 删除 message
  await deleteChatMessage(id);
  message.success('删除成功！');
  // 回调
  emits('onDeleteSuccess');
};

/** 刷新 */
const onRefresh = async (message: AiChatMessageApi.ChatMessageVO) => {
  emits('onRefresh', message);
};

/** 编辑 */
const onEdit = async (message: AiChatMessageApi.ChatMessageVO) => {
  emits('onEdit', message);
};

/** 初始化 */
onMounted(async () => {
  messageContainer.value.addEventListener('scroll', handleScroll);
});
</script>
<template>
  <div ref="messageContainer" class="relative h-full overflow-y-auto">
    <div class="chat-list" v-for="(item, index) in list" :key="index">
      <!-- 靠左 message：system、assistant 类型 -->
      <div class="left-message message-item" v-if="item.type !== 'user'">
        <div class="avatar">
          <Avatar :src="roleAvatar" />
        </div>
        <div class="message">
          <div>
            <div class="time">{{ formatDate(item.createTime) }}</div>
          </div>
          <div class="left-text-container">
            <MarkdownView class="left-text" :content="item.content" />
            <MessageKnowledge v-if="item.segments" :segments="item.segments" />
          </div>
          <div class="left-btns">
            <Button
              class="btn-cus"
              type="text"
              @click="copyContent(item.content)"
            >
              <img class="btn-image" src="/static/copy.svg" />
            </Button>
            <Button
              v-if="item.id > 0"
              class="btn-cus"
              type="text"
              @click="onDelete(item.id)"
            >
              <img class="btn-image h-[17px]" src="/static/delete.svg" />
            </Button>
          </div>
        </div>
      </div>
      <!-- 靠右 message：user 类型 -->
      <div class="right-message message-item" v-if="item.type === 'user'">
        <div class="avatar">
          <Avatar :src="userAvatar" />
        </div>
        <div class="message">
          <div>
            <div class="time">{{ formatDate(item.createTime) }}</div>
          </div>
          <div class="right-text-container">
            <div class="right-text">{{ item.content }}</div>
          </div>
          <div class="right-btns">
            <Button
              class="btn-cus"
              type="text"
              @click="copyContent(item.content)"
            >
              <img class="btn-image" src="/static/copy.svg" />
            </Button>
            <Button class="btn-cus" type="text" @click="onDelete(item.id)">
              <img class="btn-image h-[17px]" src="/static/delete.svg" />
            </Button>
            <Button class="btn-cus" type="text" @click="onRefresh(item)">
              <span class="icon-[ant-design--redo-outlined]"></span>
            </Button>
            <Button class="btn-cus" type="text" @click="onEdit(item)">
              <span class="icon-[ant-design--form-outlined]"></span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- 回到底部 -->
  <div v-if="isScrolling" class="to-bottom" @click="handleGoBottom">
    <Button shape="circle">
      <span class="icon-[ant-design--down-outlined]"></span>
    </Button>
  </div>
</template>
<style scoped lang="scss">
// 中间
.chat-list {
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  overflow-y: hidden;

  .message-item {
    margin-top: 50px;
  }

  .left-message {
    display: flex;
    flex-direction: row;
  }

  .right-message {
    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-start;
  }

  .message {
    display: flex;
    flex-direction: column;
    margin: 0 15px;
    text-align: left;

    .time {
      line-height: 30px;
      text-align: left;
    }

    .left-text-container {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 10px 10px 5px;
      overflow-wrap: break-word;
      background-color: rgb(228 228 228 / 80%);
      border-radius: 10px;
      box-shadow: 0 0 0 1px rgb(228 228 228 / 80%);

      .left-text {
        font-size: 0.95rem;
        color: #393939;
      }
    }

    .right-text-container {
      display: flex;
      flex-direction: row-reverse;

      .right-text {
        display: inline;
        width: auto;
        padding: 10px;
        font-size: 0.95rem;
        color: #fff;
        overflow-wrap: break-word;
        white-space: pre-wrap;
        background-color: #267fff;
        border-radius: 10px;
        box-shadow: 0 0 0 1px #267fff;
      }
    }

    .left-btns {
      display: flex;
      flex-direction: row;
      margin-top: 8px;
    }

    .right-btns {
      display: flex;
      flex-direction: row-reverse;
      margin-top: 8px;
    }
  }

  // 复制、删除按钮
  .btn-cus {
    display: flex;
    align-items: center;
    padding: 0 5px;
    background-color: transparent;

    .btn-image {
      height: 20px;
    }
  }

  .btn-cus:hover {
    cursor: pointer;
    background-color: #f6f6f6;
  }
}

// 回到底部
.to-bottom {
  position: absolute;
  right: 50%;
  bottom: 0;
  z-index: 1000;
}
</style>
