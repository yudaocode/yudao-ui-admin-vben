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

import { computed, ref, unref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Row, Tabs } from 'ant-design-vue';

import TabImage from './tab-image.vue';
import TabMusic from './tab-music.vue';
import TabNews from './tab-news.vue';
import TabText from './tab-text.vue';
import TabVideo from './tab-video.vue';
import TabVoice from './tab-voice.vue';
import { createEmptyReply, NewsType, ReplyType } from './types';

defineOptions({ name: 'WxReplySelect' });

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
const reply = computed<Reply>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});
// 作为多个标签保存各自Reply的缓存
const tabCache = new Map<ReplyType, Reply>();
// 采用独立的ref来保存当前tab，避免在watch标签变化，对reply进行赋值会产生了循环调用
const currentTab = ref<ReplyType>(props.modelValue.type || ReplyType.Text);

watch(
  currentTab,
  (newTab, oldTab) => {
    // 第一次进入：oldTab 为 undefined
    // 判断 newTab 是因为 Reply 为 Partial
    if (oldTab === undefined || newTab === undefined) {
      return;
    }

    tabCache.set(oldTab, unref(reply));

    // 从缓存里面取出新tab内容，有则覆盖Reply，没有则创建空Reply
    const temp = tabCache.get(newTab);
    if (temp) {
      reply.value = temp;
    } else {
      const newData = createEmptyReply(reply);
      newData.type = newTab;
      reply.value = newData;
    }
  },
  {
    immediate: true,
  },
);

/** 清除除了`type`, `accountId`的字段 */
function clear() {
  reply.value = createEmptyReply(reply);
}

defineExpose({
  clear,
});
</script>

<template>
  <Tabs v-model:active-key="currentTab" type="card">
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

<style lang="scss" scoped></style>
