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

import { ElRow, ElTabPane, ElTabs } from 'element-plus';

import { NewsType } from '../wx-material-select/types';
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
    modelValue: Reply | undefined;
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
  <ElTabs type="border-card" v-model="reply.type" @tab-change="clear">
    <!-- 类型 1：文本 -->
    <ElTabPane :name="ReplyType.Text">
      <template #label>
        <ElRow align="middle"><IconifyIcon icon="ep:document" /> 文本</ElRow>
      </template>
      <TabText v-model="reply.content" />
    </ElTabPane>

    <!-- 类型 2：图片 -->
    <ElTabPane :name="ReplyType.Image">
      <template #label>
        <ElRow align="middle">
          <IconifyIcon icon="ep:picture" class="mr-5px" /> 图片
        </ElRow>
      </template>
      <TabImage v-model="reply" />
    </ElTabPane>

    <!-- 类型 3：语音 -->
    <ElTabPane :name="ReplyType.Voice">
      <template #label>
        <ElRow align="middle"><IconifyIcon icon="ep:phone" /> 语音</ElRow>
      </template>
      <TabVoice v-model="reply" />
    </ElTabPane>

    <!-- 类型 4：视频 -->
    <ElTabPane :name="ReplyType.Video">
      <template #label>
        <ElRow align="middle"><IconifyIcon icon="ep:share" /> 视频</ElRow>
      </template>
      <TabVideo v-model="reply" />
    </ElTabPane>

    <!-- 类型 5：图文 -->
    <ElTabPane :name="ReplyType.News">
      <template #label>
        <ElRow align="middle"><IconifyIcon icon="ep:reading" /> 图文</ElRow>
      </template>
      <TabNews v-model="reply" :news-type="newsType" />
    </ElTabPane>

    <!-- 类型 6：音乐 -->
    <ElTabPane :name="ReplyType.Music">
      <template #label>
        <ElRow align="middle"><IconifyIcon icon="ep:service" />音乐</ElRow>
      </template>
      <TabMusic v-model="reply" />
    </ElTabPane>
  </ElTabs>
</template>

<style lang="scss" scoped></style>
