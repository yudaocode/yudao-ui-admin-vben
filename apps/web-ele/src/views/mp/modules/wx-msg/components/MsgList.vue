<script lang="ts" setup>
import type { User } from '../types';

import { formatDateTime } from '@vben/utils';

import avatarWechat from '@/assets/imgs/wechat.png';

import Msg from './Msg.vue';

// 确保 User 类型被识别为已使用
type PropsUser = User;

defineOptions({ name: 'MsgList' });

const props = defineProps<{
  accountId: number;
  list: any[];
  user: PropsUser;
}>();

// 使用常量对象替代枚举，避免 linter 误报
const SendFrom = {
  MpBot: 2,
  User: 1,
} as const;

type SendFromType = (typeof SendFrom)[keyof typeof SendFrom];

// 显式引用枚举成员供模板使用
const MpBotValue = SendFrom.MpBot;
const UserValue = SendFrom.User;

const getAvatar = (sendFrom: SendFromType) =>
  sendFrom === UserValue ? props.user.avatar : avatarWechat;

const getNickname = (sendFrom: SendFromType) =>
  sendFrom === UserValue ? props.user.nickname : '公众号';
</script>
<template>
  <div class="execution" v-for="item in props.list" :key="item.id">
    <div
      class="avue-comment"
      :class="{ 'avue-comment--reverse': item.sendFrom === MpBotValue }"
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
          :style="item.sendFrom === MpBotValue ? 'background: #6BED72;' : ''"
        >
          <Msg :item="item" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 因为 joolun 实现依赖 avue 组件，该页面使用了 comment.scss、card.scc  */
@import url('../comment.scss');
@import url('../card.scss');

.avatar-div {
  width: 80px;
  text-align: center;
}
</style>
