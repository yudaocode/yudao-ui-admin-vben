<script setup lang="ts">
import type { MemberUserApi } from '#/api/member/user';

import { h } from 'vue';

import { Avatar, Card, Col, Row } from 'ant-design-vue';
import dayjs from 'dayjs';

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
      label: '姓名',
    },
    {
      field: 'nickname',
      label: '昵称',
    },
    {
      field: 'mobile',
      label: '手机',
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
      field: 'birthday',
      label: '年龄',
      content: (data) =>
        data.birthday
          ? `${dayjs().diff(dayjs(data.birthday), 'year')} 岁`
          : '空',
    },
    {
      field: 'status',
      label: '状态',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.COMMON_STATUS,
          value: data.status,
        }),
    },
    {
      field: 'areaName',
      label: '住所',
      span: 2,
      content: (data) =>
        data.areaName +
        data.zoneName +
        data.buildingName +
        data.floorName +
        data.apartmentName,
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
