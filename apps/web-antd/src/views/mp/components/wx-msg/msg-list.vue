<script lang="ts" setup>
import type { MpUserApi } from '#/api/mp/user/index';

import { preferences } from '@vben/preferences';
import { formatDateTime } from '@vben/utils';

import Msg from './msg.vue';

defineOptions({ name: 'MsgList' });

const props = defineProps<{
  accountId: number;
  list: any[];
  user: Partial<MpUserApi.User>;
}>();

const SendFrom = {
  MpBot: 2,
  User: 1,
} as const; // 发送来源

function getAvatar(sendFrom: number) {
  return sendFrom === SendFrom.User
    ? props.user.avatar
    : preferences.app.defaultAvatar;
}

function getNickname(sendFrom: number) {
  return sendFrom === SendFrom.User ? props.user.nickname : '公众号';
}
</script>
<template>
  <div class="execution" v-for="item in props.list" :key="item.id">
    <div
      class="mp-comment"
      :class="{ 'mp-comment--reverse': item.sendFrom === SendFrom.MpBot }"
    >
      <div class="avatar-div">
        <img :src="getAvatar(item.sendFrom)" class="mp-comment__avatar" />
        <div class="mp-comment__author">
          {{ getNickname(item.sendFrom) }}
        </div>
      </div>
      <div class="mp-comment__main">
        <div class="mp-comment__header">
          <div class="mp-comment__create_time">
            {{ formatDateTime(item.createTime) }}
          </div>
        </div>
        <div
          class="mp-comment__body"
          :style="
            item.sendFrom === SendFrom.MpBot ? 'background: #6BED72;' : ''
          "
        >
          <Msg :item="item" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 因为 joolun 实现依赖 avue 组件，该页面使用了 comment.scss、card.scc  */

/** TODO @dylan： 看看有没适合 tindwind 的哈。 */

@import url('./comment.scss');
@import url('./card.scss');

.avatar-div {
  width: 80px;
  text-align: center;
}
</style>
