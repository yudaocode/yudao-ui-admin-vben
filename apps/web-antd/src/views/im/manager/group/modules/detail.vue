<script lang="ts" setup>
import type { ImManagerGroupApi } from '#/api/im/manager/group';

import { computed, ref } from 'vue';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';

import {
  Avatar,
  Checkbox,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Table,
  Tag,
} from 'ant-design-vue';

import { getManagerGroupMemberList } from '#/api/im/manager/group';
import { DictTag } from '#/components/dict-tag';
import {
  formatDateTimeText,
  formatUserLabel,
} from '#/views/im/manager/utils/format';

const visible = ref(false);
const detail = ref<ImManagerGroupApi.Group>({} as ImManagerGroupApi.Group);
const loading = ref(false);
const activeOnly = ref(true);
const memberList = ref<ImManagerGroupApi.GroupMember[]>([]);

const filteredMembers = computed(() =>
  activeOnly.value
    ? memberList.value.filter((item) => item.status === CommonStatusEnum.ENABLE)
    : memberList.value,
);

const columns = [
  { title: '头像', dataIndex: 'avatar', width: 80 },
  { title: '用户编号', dataIndex: 'userId', width: 100 },
  { title: '角色', dataIndex: 'role', width: 100 },
  { title: '昵称', dataIndex: 'nickname' },
  { title: '组内显示名', dataIndex: 'displayUserName' },
  { title: '群备注', dataIndex: 'groupRemark' },
  { title: '免打扰', dataIndex: 'silent', width: 90 },
  { title: '状态', dataIndex: 'status', width: 100 },
  { title: '入群时间', dataIndex: 'joinTime', width: 180 },
  { title: '退群时间', dataIndex: 'quitTime', width: 180 },
  { title: '禁言状态', dataIndex: 'muteEndTime', width: 180 },
];

/** 打开详情 */
async function open(row: ImManagerGroupApi.Group) {
  detail.value = row;
  visible.value = true;
  activeOnly.value = true;
  loading.value = true;
  try {
    memberList.value = await getManagerGroupMemberList(row.id);
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Drawer v-model:open="visible" destroy-on-close title="群详情" width="900">
    <Descriptions bordered :column="2">
      <DescriptionsItem label="群编号">{{ detail.id }}</DescriptionsItem>
      <DescriptionsItem label="群名称">{{ detail.name }}</DescriptionsItem>
      <DescriptionsItem label="头像">
        <Avatar :src="detail.avatar" :size="36">
          {{ detail.name?.charAt(0) || '?' }}
        </Avatar>
      </DescriptionsItem>
      <DescriptionsItem label="群主">
        {{ formatUserLabel(detail.ownerNickname, detail.ownerUserId) }}
      </DescriptionsItem>
      <DescriptionsItem label="成员数">{{ detail.memberCount || 0 }}</DescriptionsItem>
      <DescriptionsItem label="群状态">
        <DictTag :type="DICT_TYPE.IM_GROUP_STATUS" :value="detail.status" />
      </DescriptionsItem>
      <DescriptionsItem label="封禁状态">
        <DictTag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="detail.banned" />
        <span v-if="detail.banned" class="ml-2 text-gray-400">
          {{ detail.bannedReason }}
        </span>
      </DescriptionsItem>
      <DescriptionsItem label="全群禁言">
        <Tag v-if="detail.mutedAll" color="error">已禁言</Tag>
        <Tag v-else>未禁言</Tag>
      </DescriptionsItem>
      <DescriptionsItem label="群公告" :span="2">
        {{ detail.notice || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="创建时间" :span="2">
        {{ formatDateTimeText(detail.createTime) }}
      </DescriptionsItem>
    </Descriptions>

    <div class="mb-4 mt-5 flex items-center justify-between">
      <span class="font-bold">群成员</span>
      <Checkbox v-model:checked="activeOnly">仅展示当前群内的成员</Checkbox>
    </div>
    <Table
      :columns="columns"
      :data-source="filteredMembers"
      :loading="loading"
      :pagination="false"
      bordered
      row-key="userId"
      size="small"
    >
      <template #bodyCell="{ column, record, text }">
        <template v-if="column.dataIndex === 'avatar'">
          <Avatar :src="record.avatar" :size="40">
            {{ record.nickname?.charAt(0) || '?' }}
          </Avatar>
        </template>
        <template v-else-if="column.dataIndex === 'role'">
          <DictTag :type="DICT_TYPE.IM_GROUP_MEMBER_ROLE" :value="record.role" />
        </template>
        <template v-else-if="column.dataIndex === 'silent'">
          <DictTag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="record.silent" />
        </template>
        <template v-else-if="column.dataIndex === 'status'">
          <DictTag :type="DICT_TYPE.COMMON_STATUS" :value="record.status" />
        </template>
        <template v-else-if="column.dataIndex === 'joinTime'">
          {{ formatDateTimeText(record.joinTime) }}
        </template>
        <template v-else-if="column.dataIndex === 'quitTime'">
          {{ formatDateTimeText(record.quitTime) }}
        </template>
        <template v-else-if="column.dataIndex === 'muteEndTime'">
          <template v-if="record.muteEndTime && new Date(record.muteEndTime) > new Date()">
            <Tag color="error">禁言中</Tag>
            <div class="mt-1 text-xs text-gray-400">
              {{ formatDateTimeText(record.muteEndTime) }}
            </div>
          </template>
          <span v-else>-</span>
        </template>
        <template v-else>
          {{ text || '-' }}
        </template>
      </template>
    </Table>
  </Drawer>
</template>
