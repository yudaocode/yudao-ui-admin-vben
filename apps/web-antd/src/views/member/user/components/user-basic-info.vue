<script setup lang="ts">
import type { MemberUserApi } from '#/api/member/user';

import { h } from 'vue';

import { formatDate } from '@vben/utils';

import { Avatar, Card, Col, Row } from 'ant-design-vue';

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
    bordered: false,
    class: 'mx-4',
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
  <Card>
    <template #title>
      <slot name="title"></slot>
    </template>
    <template #extra>
      <slot name="extra"></slot>
    </template>
    <Row v-if="mode === 'member'" :gutter="24">
      <Col :span="4">
        <Avatar :size="140" shape="square" :src="user.avatar" />
      </Col>
      <Col :span="20">
        <Description :column="2" :data="user" />
      </Col>
    </Row>
    <template v-else-if="mode === 'kefu'">
      <Avatar :size="140" shape="square" :src="user.avatar" />
      <Description :column="1" :data="user" />
    </template>
  </Card>
</template>
