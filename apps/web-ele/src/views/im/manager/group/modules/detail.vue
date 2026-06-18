<script lang="ts" setup>
import type { ImManagerGroupApi } from '#/api/im/manager/group';

import { computed, ref } from 'vue';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';

import { ElAvatar, ElCheckbox, ElDescriptions, ElDescriptionsItem, ElDrawer, ElTable, ElTableColumn, ElTag } from 'element-plus'

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
  <ElDrawer v-model="visible" destroy-on-close title="群详情" width="900">
    <ElDescriptions bordered :column="2">
      <ElDescriptionsItem label="群编号">{{ detail.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="群名称">{{ detail.name }}</ElDescriptionsItem>
      <ElDescriptionsItem label="头像">
        <ElAvatar :src="detail.avatar" :size="36">
          {{ detail.name?.charAt(0) || '?' }}
        </ElAvatar>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="群主">
        {{ formatUserLabel(detail.ownerNickname, detail.ownerUserId) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="成员数">{{ detail.memberCount || 0 }}</ElDescriptionsItem>
      <ElDescriptionsItem label="群状态">
        <DictTag :type="DICT_TYPE.IM_GROUP_STATUS" :value="detail.status" />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="封禁状态">
        <DictTag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="detail.banned" />
        <span v-if="detail.banned" class="ml-2 text-gray-400">
          {{ detail.bannedReason }}
        </span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="全群禁言">
        <ElTag v-if="detail.mutedAll" type="danger">已禁言</ElTag>
        <ElTag v-else>未禁言</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="群公告" :span="2">
        {{ detail.notice || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间" :span="2">
        {{ formatDateTimeText(detail.createTime) }}
      </ElDescriptionsItem>
    </ElDescriptions>

    <div class="mb-4 mt-5 flex items-center justify-between">
      <span class="font-bold">群成员</span>
      <ElCheckbox v-model="activeOnly">仅展示当前群内的成员</ElCheckbox>
    </div>
    <ElTable
      v-loading="loading"
      :data="filteredMembers"
      bordered
      row-key="userId"
      size="small"
    >
      <ElTableColumn label="头像" width="80">
        <template #default="{ row }">
          <ElAvatar :src="row.avatar" :size="40">
            {{ row.nickname?.charAt(0) || '?' }}
          </ElAvatar>
        </template>
      </ElTableColumn>
      <ElTableColumn label="用户编号" prop="userId" width="100" />
      <ElTableColumn label="角色" width="100">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.IM_GROUP_MEMBER_ROLE" :value="row.role" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="昵称" prop="nickname" />
      <ElTableColumn label="组内显示名" prop="displayUserName" />
      <ElTableColumn label="群备注" prop="groupRemark" />
      <ElTableColumn label="免打扰" width="90">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="row.silent" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="状态" width="100">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.COMMON_STATUS" :value="row.status" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="入群时间" width="180">
        <template #default="{ row }">{{ formatDateTimeText(row.joinTime) }}</template>
      </ElTableColumn>
      <ElTableColumn label="退群时间" width="180">
        <template #default="{ row }">{{ formatDateTimeText(row.quitTime) }}</template>
      </ElTableColumn>
      <ElTableColumn label="禁言状态" width="180">
        <template #default="{ row }">
          <template v-if="row.muteEndTime && new Date(row.muteEndTime) > new Date()">
            <ElTag type="danger">禁言中</ElTag>
            <div class="mt-1 text-xs text-gray-400">
              {{ formatDateTimeText(row.muteEndTime) }}
            </div>
          </template>
          <span v-else>-</span>
        </template>
      </ElTableColumn>
    </ElTable>
  </ElDrawer>
</template>
