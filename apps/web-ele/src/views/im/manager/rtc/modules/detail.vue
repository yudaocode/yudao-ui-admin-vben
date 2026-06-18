<script lang="ts" setup>
import type { ImManagerRtcApi } from '#/api/im/manager/rtc';

import { computed, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { ElDescriptions, ElDescriptionsItem, ElDrawer, ElTable, ElTableColumn } from 'element-plus'

import { getManagerRtcCallParticipantList } from '#/api/im/manager/rtc';
import { DictTag } from '#/components/dict-tag';
import {
  formatDateTimeText,
  formatGroupLabel,
  formatUserLabel,
} from '#/views/im/manager/utils/format';
import { resolveCallDuration } from '#/views/im/utils/time';

const visible = ref(false);
const detail = ref<ImManagerRtcApi.RtcCall>({} as ImManagerRtcApi.RtcCall);
const loading = ref(false);
const participants = ref<ImManagerRtcApi.RtcParticipant[]>([]);

const duration = computed(() =>
  resolveCallDuration(detail.value.acceptTime, detail.value.endTime),
);

/** 打开详情 */
async function open(row: ImManagerRtcApi.RtcCall) {
  detail.value = row;
  visible.value = true;
  loading.value = true;
  try {
    participants.value = await getManagerRtcCallParticipantList(row.id);
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <ElDrawer v-model="visible" destroy-on-close title="通话记录详情" width="900">
    <ElDescriptions bordered :column="2">
      <ElDescriptionsItem label="编号">{{ detail.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="业务通话编号">{{ detail.room }}</ElDescriptionsItem>
      <ElDescriptionsItem label="发起人">
        {{ formatUserLabel(detail.inviterNickname, detail.inviterUserId) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="会话类型">
        <DictTag :type="DICT_TYPE.IM_RTC_CALL_CONVERSATION_TYPE" :value="detail.conversationType" />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="群">
        {{ formatGroupLabel(detail.groupName, detail.groupId) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="媒体类型">
        <DictTag :type="DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE" :value="detail.mediaType" />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="通话状态">
        <DictTag :type="DICT_TYPE.IM_RTC_CALL_STATUS" :value="detail.status" />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="结束原因">
        <DictTag
          v-if="detail.endReason"
          :type="DICT_TYPE.IM_RTC_CALL_END_REASON"
          :value="detail.endReason"
        />
        <span v-else>-</span>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="发起时间">
        {{ formatDateTimeText(detail.startTime) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="接通时间">
        {{ formatDateTimeText(detail.acceptTime) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="结束时间">
        {{ formatDateTimeText(detail.endTime) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="通话时长">{{ duration }}</ElDescriptionsItem>
    </ElDescriptions>

    <div class="mb-4 mt-5 font-bold">参与者列表</div>
    <ElTable
      v-loading="loading"
      :data="participants"
      bordered
      row-key="id"
      size="small"
    >
      <ElTableColumn label="用户编号" prop="userId" width="120" />
      <ElTableColumn label="昵称" prop="userNickname" />
      <ElTableColumn label="参与角色" width="120">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.IM_RTC_PARTICIPANT_ROLE" :value="row.role" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="参与状态" width="120">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.IM_RTC_PARTICIPANT_STATUS" :value="row.status" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="被邀请时间" width="180">
        <template #default="{ row }">{{ formatDateTimeText(row.inviteTime) }}</template>
      </ElTableColumn>
      <ElTableColumn label="接听时间" width="180">
        <template #default="{ row }">{{ formatDateTimeText(row.acceptTime) }}</template>
      </ElTableColumn>
      <ElTableColumn label="离开时间" width="180">
        <template #default="{ row }">{{ formatDateTimeText(row.leaveTime) }}</template>
      </ElTableColumn>
    </ElTable>
  </ElDrawer>
</template>
