<script lang="ts" setup>
import type { MesWmBatchApi } from '#/api/mes/wm/batch';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElTabPane, ElTabs } from 'element-plus';

import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';
import TraceList from './trace-list.vue';

const detailData = ref<MesWmBatchApi.Batch>(); // 当前批次详情
const subTabsName = ref<'backward' | 'forward'>('forward'); // 当前激活的追溯方向

const [Descriptions] = useDescription({
  border: true,
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
    <ElTabs
      v-if="detailData?.code"
      v-model="subTabsName"
      class="mx-4 mt-4"
      type="card"
    >
      <ElTabPane label="向前追溯" name="forward">
        <TraceList :batch-code="detailData.code" direction="forward" />
      </ElTabPane>
      <ElTabPane label="向后追溯" name="backward">
        <TraceList :batch-code="detailData.code" direction="backward" />
      </ElTabPane>
    </ElTabs>
  </Modal>
</template>
