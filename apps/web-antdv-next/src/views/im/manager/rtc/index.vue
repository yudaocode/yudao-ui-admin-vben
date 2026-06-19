<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ImManagerRtcApi } from '#/api/im/manager/rtc';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getManagerRtcCallPage } from '#/api/im/manager/rtc';
import { DictTag } from '#/components/dict-tag';
import {
  formatGroupLabel,
  formatUserLabel,
} from '#/views/im/manager/utils/format';
import { resolveCallDuration } from '#/views/im/utils/time';

import { useRtcGridColumns, useRtcGridFormSchema } from './data';
import Detail from './modules/detail.vue';

defineOptions({ name: 'ImManagerRtcCall' });

const detailRef = ref<InstanceType<typeof Detail>>();

/** 打开详情 */
function handleDetail(row: ImManagerRtcApi.RtcCall) {
  detailRef.value?.open(row);
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    schema: useRtcGridFormSchema(),
  },
  gridOptions: {
    columns: useRtcGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getManagerRtcCallPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<ImManagerRtcApi.RtcCall>,
});
</script>

<template>
  <Page auto-content-height>
    <Detail ref="detailRef" />
    <Grid table-title="通话记录列表">
      <template #inviter="{ row }">
        {{ formatUserLabel(row.inviterNickname, row.inviterUserId) }}
      </template>
      <template #group="{ row }">
        {{ formatGroupLabel(row.groupName, row.groupId) }}
      </template>
      <template #endReason="{ row }">
        <DictTag
          v-if="row.endReason"
          :type="DICT_TYPE.IM_RTC_CALL_END_REASON"
          :value="row.endReason"
        />
        <span v-else>-</span>
      </template>
      <template #duration="{ row }">
        {{ resolveCallDuration(row.acceptTime, row.endTime) }}
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              type: 'link',
              icon: ACTION_ICON.VIEW,
              auth: ['im:manager:rtc:query'],
              onClick: handleDetail.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
