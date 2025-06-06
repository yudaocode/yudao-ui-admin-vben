<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, TabPane, Tabs } from 'ant-design-vue';

import { DocAlert } from '#/components/doc-alert';

import ChatConversationList from './modules/ChatConversationList.vue';
import ChatMessageList from './modules/ChatMessageList.vue';

const activeTabName = ref('conversation');
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="AI 对话聊天" url="https://doc.iocoder.cn/ai/chat/" />
    <Card>
      <Tabs v-model:active-key="activeTabName">
        <TabPane tab="对话列表" key="conversation">
          <ChatConversationList />
        </TabPane>
        <TabPane tab="消息列表" key="message">
          <ChatMessageList />
        </TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
