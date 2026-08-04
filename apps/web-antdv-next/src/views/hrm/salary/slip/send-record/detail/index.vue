<script lang="ts" setup>
import type { HrmSalarySlipSendRecordApi } from '#/api/hrm/salary/slip/send-record';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Button, Spin } from 'antdv-next';

import { getSalarySlipSendRecord } from '#/api/hrm/salary/slip/send-record';
import { formatHrmYearMonth } from '#/views/hrm/utils/format';

import SlipList from './modules/slip-list.vue';

defineOptions({ name: 'HrmSalarySlipSendRecordDetail' });

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const recordId = Number(route.params.id);
const loading = ref(false);
const record = ref<HrmSalarySlipSendRecordApi.SalarySlipSendRecord>({});

function close() {
  tabs.closeCurrentTab();
  router.push({ name: 'HrmSalarySlipSendRecord' });
}

async function getRecord() {
  loading.value = true;
  try {
    record.value = await getSalarySlipSendRecord(recordId);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  getRecord();
});
</script>

<template>
  <!--
    height:auto 的 Grid 必须落在固定高度的 flex 子项里，否则会跟 Page
    auto-content-height 互相挤压，表现为列表高度慢慢变小。
  -->
  <Page auto-content-height content-class="flex flex-col overflow-hidden">
    <div class="mb-4 flex shrink-0 items-center justify-between">
      <Button type="link" @click="close">返回发放记录</Button>
      <span class="text-lg font-medium">
        {{ formatHrmYearMonth(record.year, record.month) }} 工资条发放详情
      </span>
    </div>

    <div v-if="loading" class="flex min-h-0 flex-1 items-center justify-center">
      <Spin />
    </div>
    <SlipList
      v-else-if="record.id"
      class="min-h-0 flex-1"
      :send-record-id="record.id"
    />
  </Page>
</template>
