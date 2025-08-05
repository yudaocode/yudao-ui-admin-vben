<script setup lang="ts">
import type { MemberUserApi } from '#/api/member/user';

import { h } from 'vue';

import { formatDate } from '@vben/utils';

import { ElAvatar, ElCard, ElCol, ElRow } from 'element-plus';

import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

withDefaults(
  defineProps<{ mode?: 'kefu' | 'member'; user: MemberUserApi.User }>(),
  {
    mode: 'member',
  },
);

const [Description] = useDescription({
  componentProps: {
    border: false,
    column: 2,
    direction: 'horizontal',
    labelWidth: 100,
    title: '',
    extra: '',
  },
  schema: [
    {
      field: 'name',
      label: '用户名',
    },
    {
      field: 'nickname',
      label: '昵称',
    },
    {
      field: 'mobile',
      label: '手机号',
    },
    {
      field: 'sex',
      label: '性别',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.SYSTEM_USER_SEX,
          value: data.sex,
        }),
    },
    {
      field: 'areaName',
      label: '所在地',
    },
    {
      field: 'registerIp',
      label: '注册 IP',
    },
    {
      field: 'birthday',
      label: '生日',
      content: (data) => formatDate(data.birthday)?.toString() || '空',
    },
    {
      field: 'createTime',
      label: '注册时间',
      content: (data) => formatDate(data.createTime)?.toString() || '空',
    },
    {
      field: 'loginDate',
      label: '最后登录时间',
      content: (data) => formatDate(data.loginDate)?.toString() || '空',
    },
  ],
});
</script>

<template>
  <ElCard>
    <template #title>
      <slot name="title"></slot>
    </template>
    <template #extra>
      <slot name="extra"></slot>
    </template>
    <ElRow v-if="mode === 'member'" :gutter="24">
      <ElCol :span="4">
        <ElAvatar :size="140" shape="square" :src="user.avatar" />
      </ElCol>
      <ElCol :span="20">
        <Description :column="2" :data="user" />
      </ElCol>
    </ElRow>
    <template v-else-if="mode === 'kefu'">
      <ElAvatar :size="140" shape="square" :src="user.avatar" />
      <Description :column="1" :data="user" />
    </template>
  </ElCard>
</template>
