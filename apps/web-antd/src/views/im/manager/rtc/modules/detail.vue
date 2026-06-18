<script lang="ts" setup>
import type { ImManagerRtcApi } from '#/api/im/manager/rtc';

import { computed, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { Descriptions, DescriptionsItem, Drawer, Table } from 'ant-design-vue';

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

const columns = [
  { title: '用户编号', dataIndex: 'userId', width: 120 },
  { title: '昵称', dataIndex: 'userNickname' },
  { title: '参与角色', dataIndex: 'role', width: 120 },
  { title: '参与状态', dataIndex: 'status', width: 120 },
  { title: '被邀请时间', dataIndex: 'inviteTime', width: 180 },
  { title: '接听时间', dataIndex: 'acceptTime', width: 180 },
  { title: '离开时间', dataIndex: 'leaveTime', width: 180 },
];

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
  <Drawer v-model:open="visible" destroy-on-close title="通话记录详情" width="900">
    <Descriptions bordered :column="2">
      <DescriptionsItem label="编号">{{ detail.id }}</DescriptionsItem>
      <DescriptionsItem label="业务通话编号">{{ detail.room }}</DescriptionsItem>
      <DescriptionsItem label="发起人">
        {{ formatUserLabel(detail.inviterNickname, detail.inviterUserId) }}
      </DescriptionsItem>
      <DescriptionsItem label="会话类型">
        <DictTag :type="DICT_TYPE.IM_RTC_CALL_CONVERSATION_TYPE" :value="detail.conversationType" />
      </DescriptionsItem>
      <DescriptionsItem label="群">
        {{ formatGroupLabel(detail.groupName, detail.groupId) }}
      </DescriptionsItem>
      <DescriptionsItem label="媒体类型">
        <DictTag :type="DICT_TYPE.IM_RTC_CALL_MEDIA_TYPE" :value="detail.mediaType" />
      </DescriptionsItem>
      <DescriptionsItem label="通话状态">
        <DictTag :type="DICT_TYPE.IM_RTC_CALL_STATUS" :value="detail.status" />
      </DescriptionsItem>
      <DescriptionsItem label="结束原因">
        <DictTag
          v-if="detail.endReason"
          :type="DICT_TYPE.IM_RTC_CALL_END_REASON"
          :value="detail.endReason"
        />
        <span v-else>-</span>
      </DescriptionsItem>
      <DescriptionsItem label="发起时间">
        {{ formatDateTimeText(detail.startTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="接通时间">
        {{ formatDateTimeText(detail.acceptTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="结束时间">
        {{ formatDateTimeText(detail.endTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="通话时长">{{ duration }}</DescriptionsItem>
    </Descriptions>

    <div class="mb-4 mt-5 font-bold">参与者列表</div>
    <Table
      :columns="columns"
      :data-source="participants"
      :loading="loading"
      :pagination="false"
      bordered
      row-key="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'role'">
          <DictTag :type="DICT_TYPE.IM_RTC_PARTICIPANT_ROLE" :value="record.role" />
        </template>
        <template v-else-if="column.dataIndex === 'status'">
          <DictTag :type="DICT_TYPE.IM_RTC_PARTICIPANT_STATUS" :value="record.status" />
        </template>
        <template v-else-if="['inviteTime', 'acceptTime', 'leaveTime'].includes(column.dataIndex as string)">
          {{ formatDateTimeText(record[column.dataIndex]) }}
        </template>
        <template v-else>
          {{ record[column.dataIndex] || '-' }}
        </template>
      </template>
    </Table>
  </Drawer>
</template>
