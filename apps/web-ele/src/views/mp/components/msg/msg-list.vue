<script lang="ts" setup>
import type { User } from '../types';

import { formatDateTime } from '@vben/utils';

import avatarWechat from '#/assets/imgs/wechat.png';

import Msg from './msg.vue';

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
  <div v-for="item in props.list" :key="item.id">
    <div
      class="mb-[30px] flex items-start"
      :class="{ 'flex-row-reverse': item.sendFrom === MpBotValue }"
    >
      <div class="w-20 text-center">
        <img
          :src="getAvatar(item.sendFrom)"
          class="box-border h-12 w-12 rounded-full border border-transparent align-middle"
        />
        <div class="text-sm font-bold text-[#999]">
          {{ getNickname(item.sendFrom) }}
        </div>
      </div>
      <div class="relative mx-5 flex-1 rounded-[5px] border border-[#dedede]">
        <div
          class="flex items-center justify-between rounded-t-[5px] border-b border-[#eee] bg-[#f8f8f8] px-[15px] py-[5px]"
        >
          <div class="mp-comment__create_time">
            {{ formatDateTime(item.createTime) }}
          </div>
        </div>
        <div
          class="overflow-hidden rounded-b-[5px] bg-white px-[15px] py-[15px] text-sm text-[#333]"
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
</style>
