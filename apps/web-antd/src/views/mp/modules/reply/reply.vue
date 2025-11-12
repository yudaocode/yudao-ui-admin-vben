<!--
  - Copyright (C) 2018-2019
  - All rights reserved, Designed By www.joolun.com
  芋道源码：
  ① 移除多余的 rep 为前缀的变量，让 message 消息更简单
  ② 代码优化，补充注释，提升阅读性
  ③ 优化消息的临时缓存策略，发送消息时，只清理被发送消息的 tab，不会强制切回到 text 输入
  ④ 支持发送【视频】消息时，支持新建视频
-->
<script lang="ts" setup>
import type { Reply } from './types';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Row, Tabs } from 'ant-design-vue';

import { NewsType } from '../material-select/types';
import TabImage from './tab-image.vue';
import TabMusic from './tab-music.vue';
import TabNews from './tab-news.vue';
import TabText from './tab-text.vue';
import TabVideo from './tab-video.vue';
import TabVoice from './tab-voice.vue';
import { createEmptyReply, ReplyType } from './types';

defineOptions({ name: 'ReplySelect' });

const props = withDefaults(
  defineProps<{
    modelValue: Reply;
    newsType?: NewsType;
  }>(),
  {
    newsType: () => NewsType.Published,
  },
);
const emit = defineEmits<{
  (e: 'update:modelValue', v: Reply): void;
}>();

// 提供一个默认的 Reply 对象，避免 undefined 导致的错误
const defaultReply: Reply = {
  accountId: -1,
  type: ReplyType.Text,
};

const reply = computed<Reply>({
  get: () => props.modelValue || defaultReply,
  set: (val) => emit('update:modelValue', val),
});

/** 清除除了`type`, `accountId`的字段 */
function clear() {
  reply.value = createEmptyReply(reply);
}

defineExpose({
  clear,
});
</script>

<template>
  <!-- 之前使用的currentTab会导致组件tab不切换，直接改为使用reply.type,不做tab缓存，缓存会多很多垃圾字段 -->
  <Tabs v-model:active-key="reply.type" type="card" @change="clear">
    <!-- 类型 1：文本 -->
    <Tabs.TabPane :key="ReplyType.Text">
      <template #tab>
        <Row align="middle"><IconifyIcon icon="ep:document" /> 文本</Row>
      </template>
      <TabText v-model="reply.content" />
    </Tabs.TabPane>

    <!-- 类型 2：图片 -->
    <Tabs.TabPane :key="ReplyType.Image">
      <template #tab>
        <Row align="middle">
          <IconifyIcon icon="ep:picture" class="mr-5px" /> 图片
        </Row>
      </template>
      <TabImage v-model="reply" />
    </Tabs.TabPane>

    <!-- 类型 3：语音 -->
    <Tabs.TabPane :key="ReplyType.Voice">
      <template #tab>
        <Row align="middle"><IconifyIcon icon="ep:phone" /> 语音</Row>
      </template>
      <TabVoice v-model="reply" />
    </Tabs.TabPane>

    <!-- 类型 4：视频 -->
    <Tabs.TabPane :key="ReplyType.Video">
      <template #tab>
        <Row align="middle"><IconifyIcon icon="ep:share" /> 视频</Row>
      </template>
      <TabVideo v-model="reply" />
    </Tabs.TabPane>

    <!-- 类型 5：图文 -->
    <Tabs.TabPane :key="ReplyType.News">
      <template #tab>
        <Row align="middle"><IconifyIcon icon="ep:reading" /> 图文</Row>
      </template>
      <TabNews v-model="reply" :news-type="newsType" />
    </Tabs.TabPane>

    <!-- 类型 6：音乐 -->
    <Tabs.TabPane :key="ReplyType.Music">
      <template #tab>
        <Row align="middle"><IconifyIcon icon="ep:service" />音乐</Row>
      </template>
      <TabMusic v-model="reply" />
    </Tabs.TabPane>
  </Tabs>
</template>
