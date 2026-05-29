<script lang="ts" setup>
import type { MesWmBatchApi } from '#/api/mes/wm/batch';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Descriptions, Tabs } from 'ant-design-vue';

import TraceList from './trace-list.vue';

const detailData = ref<MesWmBatchApi.Batch>(); // 当前批次详情
const subTabsName = ref<'backward' | 'forward'>('forward'); // 当前激活的追溯方向

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
    <div class="mx-4 mt-2">
      <Descriptions :column="3" bordered size="small">
        <Descriptions.Item label="批次编号">
          {{ detailData?.code || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="物资编码">
          {{ detailData?.itemCode || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="物资名称">
          {{ detailData?.itemName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="规格型号" :span="3">
          {{ detailData?.itemSpecification || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="采购订单编号">
          {{ detailData?.purchaseOrderCode || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="供应商编码">
          {{ detailData?.vendorCode || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="供应商名称">
          {{ detailData?.vendorName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="销售订单编号">
          {{ detailData?.salesOrderCode || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="客户编码">
          {{ detailData?.clientCode || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="客户名称">
          {{ detailData?.clientName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="生产批号">
          {{ detailData?.lotNumber || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="生产工单">
          {{ detailData?.workOrderCode || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="工作站编码">
          {{ detailData?.workstationCode || '-' }}
        </Descriptions.Item>
      </Descriptions>
    </div>
    <Tabs
      v-if="detailData?.code"
      v-model:active-key="subTabsName"
      class="mx-4! mt-4!"
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
