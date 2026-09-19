<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaTravelReimbursementApi } from '#/api/oa/travel/reimbursement';

import { nextTick, ref, watch } from 'vue';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { Descriptions, DescriptionsItem, Spin, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTravelReimbursement } from '#/api/oa/travel/reimbursement';
import { DictTag } from '#/components/dict-tag';
import { FileUpload } from '#/components/upload';

import { useItemDetailGridColumns } from '../data';

defineOptions({ name: 'OaTravelReimbursementDetail' });

const props = defineProps<{ id?: number | string }>(); // 单据编号，列表弹窗与 BPM 业务表单共用

const loading = ref(false); // 详情加载中
const detail = ref<OaTravelReimbursementApi.TravelReimbursement>({
  items: [],
  fileUrls: [],
}); // 差旅报销信息

const [ItemGrid, itemGridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useItemDetailGridColumns(),
    data: [],
    maxHeight: 360,
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<OaTravelReimbursementApi.TravelReimbursementItem>,
});

/** 查询详情 */
async function getInfo() {
  detail.value = { items: [], fileUrls: [] };
  await reloadItems();
  if (!props.id) return;
  loading.value = true;
  try {
    detail.value = await getTravelReimbursement(Number(props.id));
    detail.value.items ||= [];
    detail.value.fileUrls ||= [];
    await reloadItems();
  } finally {
    loading.value = false;
  }
}

/** 刷新费用明细表格 */
async function reloadItems() {
  await nextTick();
  await itemGridApi.grid?.reloadData(detail.value.items);
}

/** 初始化及切换单据 */
watch(
  () => props.id,
  () => {
    getInfo();
  },
  { immediate: true },
);
</script>

<template>
  <Spin :spinning="loading">
    <Descriptions :column="3" bordered>
      <DescriptionsItem label="单据编号">
        {{ detail.no }}
      </DescriptionsItem>
      <DescriptionsItem label="申请人">
        {{ detail.creatorName }}
      </DescriptionsItem>
      <DescriptionsItem label="申请部门">
        {{ detail.deptName }}
      </DescriptionsItem>
      <DescriptionsItem label="单据状态">
        <Tag v-if="detail.status === BpmProcessInstanceStatus.NOT_START">
          未提交
        </Tag>
        <DictTag
          v-else
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="detail.status"
        />
      </DescriptionsItem>
      <DescriptionsItem label="创建时间" :span="2">
        {{ formatDateTime(detail.createTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="关联出差申请" :span="3">
        {{ detail.travelApplyNo }}
      </DescriptionsItem>
      <DescriptionsItem label="出差事由" :span="3">
        {{ detail.reason }}
      </DescriptionsItem>
      <DescriptionsItem label="开始日期">
        {{ formatDateTime(detail.startTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="结束日期">
        {{ formatDateTime(detail.endTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="出差天数">
        {{ detail.days }}
      </DescriptionsItem>
      <DescriptionsItem label="报销总金额">
        {{ detail.totalPrice }}
      </DescriptionsItem>
      <DescriptionsItem label="支付状态" :span="2">
        <DictTag :type="DICT_TYPE.OA_PAY_STATUS" :value="detail.payStatus" />
      </DescriptionsItem>
      <DescriptionsItem label="备注" :span="3">
        {{ detail.remark }}
      </DescriptionsItem>
      <DescriptionsItem label="附件" :span="3">
        <FileUpload
          v-if="detail.fileUrls?.length"
          :model-value="detail.fileUrls"
          :max-number="5"
          disabled
          multiple
        />
        <span v-else>-</span>
      </DescriptionsItem>
    </Descriptions>

    <!-- 费用明细 -->
    <div class="mb-3 mt-5 font-bold">费用明细</div>
    <ItemGrid class="w-full" />
  </Spin>
</template>
