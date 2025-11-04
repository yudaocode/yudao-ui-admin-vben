<script lang="ts" setup>
import type { MallKefuConversationApi } from '#/api/mall/promotion/kefu/conversation';

import { defineOptions, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { useWebSocket } from '@vueuse/core';
import { Layout, message } from 'ant-design-vue';

import { useMallKefuStore } from '#/store/mall/kefu';

import {
  KeFuConversationList,
  KeFuMessageList,
  MemberInfo,
} from './components';
import { WebSocketMessageTypeConstants } from './components/tools/constants';

defineOptions({ name: 'KeFu' });

const accessStore = useAccessStore();
const kefuStore = useMallKefuStore(); // 客服缓存

// ======================= WebSocket start =======================
const url = `${`${import.meta.env.VITE_BASE_URL}/infra/ws`.replace(
  'http',
  'ws',
)}?token=${accessStore.refreshToken}`; // 使用 refreshToken() :WebSocket 无法方便的刷新访问令牌
const server = ref(url); // WebSocket 服务地址

/** 发起 WebSocket 连接 */
const { data, close, open } = useWebSocket(server.value, {
  autoReconnect: true,
  heartbeat: true,
});

/** 监听 WebSocket 数据 */
watch(
  () => data.value,
  (newData) => {
    if (!newData) return;
    try {
      // 1. 收到心跳
      if (newData === 'pong') return;

      // 2.1 解析 type 消息类型
      const jsonMessage = JSON.parse(newData);
      const type = jsonMessage.type;
      if (!type) {
        message.error(`未知的消息类型：${newData}`);
        return;
      }

      // 2.2 消息类型：KEFU_MESSAGE_TYPE
      if (type === WebSocketMessageTypeConstants.KEFU_MESSAGE_TYPE) {
        const message = JSON.parse(jsonMessage.content);
        // 刷新会话列表
        kefuStore.updateConversation(message.conversationId);
        // 刷新消息列表
        keFuChatBoxRef.value?.refreshMessageList(message);
        return;
      }

      // 2.3 消息类型：KEFU_MESSAGE_ADMIN_READ
      if (type === WebSocketMessageTypeConstants.KEFU_MESSAGE_ADMIN_READ) {
        // 更新会话已读
        const message = JSON.parse(jsonMessage.content);
        kefuStore.updateConversationStatus(message.conversationId);
      }
    } catch (error) {
      console.error(error);
    }
  },
  {
    immediate: false, // 不立即执行
  },
);
// ======================= WebSocket end =======================

/** 加载指定会话的消息列表 */
const keFuChatBoxRef = ref<InstanceType<typeof KeFuMessageList>>();
const memberInfoRef = ref<InstanceType<typeof MemberInfo>>();
// TODO @jawe：这里没导入
function handleChange(conversation: MallKefuConversationApi.Conversation) {
  keFuChatBoxRef.value?.getNewMessageList(conversation as any);
  memberInfoRef.value?.initHistory(conversation);
}

const keFuConversationRef = ref<InstanceType<typeof KeFuConversationList>>();
/** 初始化 */
onMounted(() => {
  // 加载会话列表
  kefuStore.setConversationList().then(() => {
    keFuConversationRef.value?.calculationLastMessageTime();
  });
  // 打开 websocket 连接
  open();
});

/** 销毁 */
onBeforeUnmount(() => {
  // 关闭 websocket 连接
  close();
});
</script>

<template>
  <Page>
    <!-- TODO @jawe：style 使用 tailwindcss，AI 友好； -->
    <Layout.Content class="kefu-layout hrow">
      <!-- 会话列表 -->
      <KeFuConversationList ref="keFuConversationRef" @change="handleChange" />
      <!-- 会话详情（选中会话的消息列表） -->
      <KeFuMessageList ref="keFuChatBoxRef" />
      <!-- 会员信息（选中会话的会员信息） -->
      <MemberInfo ref="memberInfoRef" />
    </Layout.Content>
  </Page>
</template>

<style lang="scss">
.kefu-layout {
  position: absolute;
  top: 0;
  left: 0;
  flex: 1;
  width: 100%;
  height: 100%;
}

.hrow {
  display: flex;
}
</style>
