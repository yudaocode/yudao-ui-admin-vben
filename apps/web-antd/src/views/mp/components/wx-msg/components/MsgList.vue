<script lang="ts" setup>
import type { User } from '../types';

import { preferences } from '@vben/preferences';
import { formatDateTime } from '@vben/utils';

import Msg from './Msg.vue';

// TODO @dylan：vue 组件名小写 + 中划线

defineOptions({ name: 'MsgList' });

const props = defineProps<{
  accountId: number;
  list: any[];
  user: User;
}>();
const SendFrom = {
  MpBot: 2,
  User: 1,
} as const;

function getAvatar(sendFrom: number) {
  return sendFrom === SendFrom.User
    ? props.user.avatar
    : preferences.app.defaultAvatar;
}

// TODO @dylan：SendFrom 告警；
function getNickname(sendFrom: SendFrom) {
  return sendFrom === SendFrom.User ? props.user.nickname : '公众号';
}
</script>
<template>
  <div class="execution" v-for="item in props.list" :key="item.id">
    <div
      class="avue-comment"
      :class="{ 'avue-comment--reverse': item.sendFrom === SendFrom.MpBot }"
    >
      <div class="avatar-div">
        <img :src="getAvatar(item.sendFrom)" class="avue-comment__avatar" />
        <div class="avue-comment__author">
          {{ getNickname(item.sendFrom) }}
        </div>
      </div>
      <div class="avue-comment__main">
        <div class="avue-comment__header">
          <div class="avue-comment__create_time">
            {{ formatDateTime(item.createTime) }}
          </div>
        </div>
        <div
          class="avue-comment__body"
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
/** TODO @dylan：看看有没适合 tindwind 的哈。 */

@import url('../comment.scss');
@import url('../card.scss');

.avatar-div {
  width: 80px;
  text-align: center;
}
</style>
