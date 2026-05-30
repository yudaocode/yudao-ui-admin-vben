<script lang="ts" setup>
import type { MesWmBatchApi } from '#/api/mes/wm/batch';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Tabs } from 'ant-design-vue';

import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';
import TraceList from './trace-list.vue';

const detailData = ref<MesWmBatchApi.Batch>(); // 当前批次详情
const subTabsName = ref<'backward' | 'forward'>('forward'); // 当前激活的追溯方向

const [Descriptions] = useDescription({
  bordered: true,
  column: 3,
  schema: useDetailSchema(),
});

const [Modal, modalApi] = useVbenModal({
  onOpenChange(isOpen) {
    if (!isOpen) {
      detailData.value = undefined;
      return;
    }
    detailData.value = modalApi.getData<MesWmBatchApi.Batch>();
    subTabsName.value = 'forward';
  },
});
</script>

<template>
  <Modal
    title="批次追溯"
    class="w-4/5"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Descriptions class="mx-4 mt-2" :data="detailData" />
    <Tabs
      v-if="detailData?.code"
      v-model:active-key="subTabsName"
      class="mx-4 mt-4"
      type="card"
    >
      <Tabs.TabPane key="forward" tab="向前追溯">
        <TraceList :batch-code="detailData.code" direction="forward" />
      </Tabs.TabPane>
      <Tabs.TabPane key="backward" tab="向后追溯">
        <TraceList :batch-code="detailData.code" direction="backward" />
      </Tabs.TabPane>
    </Tabs>
  </Modal>
</template>
