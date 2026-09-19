<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaTravelApplyApi } from '#/api/oa/travel/apply';

import { nextTick, ref, watch } from 'vue';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { ElDescriptions, ElDescriptionsItem, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTravelApply } from '#/api/oa/travel/apply';
import { AreaCascader } from '#/components/area';
import { DictTag } from '#/components/dict-tag';
import { FileUpload } from '#/components/upload';

import { useItemDetailGridColumns } from '../data';

defineOptions({ name: 'OaTravelApplyDetail' });

const props = defineProps<{ id?: number | string }>(); // 单据编号，列表弹窗与 BPM 业务表单共用

const loading = ref(false); // 详情加载中
const detail = ref<OaTravelApplyApi.TravelApply>({
  items: [],
  fileUrls: [],
}); // 出差申请信息

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
  } as VxeTableGridOptions<OaTravelApplyApi.TravelApplyItem>,
});

/** 查询详情 */
async function getInfo() {
  detail.value = { items: [], fileUrls: [] };
  await reloadItems();
  if (!props.id) return;
  loading.value = true;
  try {
    detail.value = await getTravelApply(Number(props.id));
    detail.value.items ||= [];
    detail.value.fileUrls ||= [];
    await reloadItems();
  } finally {
    loading.value = false;
  }
}

/** 刷新行程明细表格 */
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
  <div v-loading="loading">
    <ElDescriptions :column="3" border>
      <ElDescriptionsItem label="单据编号">
        {{ detail.no }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="申请人">
        {{ detail.creatorName }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="申请部门">
        {{ detail.deptName }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="单据状态">
        <ElTag v-if="detail.status === BpmProcessInstanceStatus.NOT_START">
          未提交
        </ElTag>
        <DictTag
          v-else
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="detail.status"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="创建时间" :span="2">
        {{ formatDateTime(detail.createTime) }}
      </ElDescriptionsItem>

      <ElDescriptionsItem label="出差事由" :span="3">
        {{ detail.reason }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="开始日期">
        {{ formatDateTime(detail.startTime) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="结束日期">
        {{ formatDateTime(detail.endTime) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="出差天数">
        {{ detail.days }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="同行人">
        {{ detail.companion }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="预计费用">
        {{ detail.estimatedPrice }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="报销状态">
        <DictTag
          :type="DICT_TYPE.OA_REIMBURSE_STATUS"
          :value="detail.reimburseStatus"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="备注" :span="3">
        {{ detail.remark }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="附件" :span="3">
        <FileUpload
          v-if="detail.fileUrls?.length"
          :model-value="detail.fileUrls"
          :max-number="5"
          disabled
          multiple
        />
        <span v-else>-</span>
      </ElDescriptionsItem>
    </ElDescriptions>

    <!-- 行程明细 -->
    <div class="mb-3 mt-5 font-bold">行程明细</div>
    <ItemGrid class="w-full">
      <template #departureAreaId="{ row }">
        <AreaCascader
          :model-value="row.departureAreaId"
          check-strictly
          class="!w-full"
          disabled
        />
      </template>
      <template #arrivalAreaId="{ row }">
        <AreaCascader
          :model-value="row.arrivalAreaId"
          check-strictly
          class="!w-full"
          disabled
        />
      </template>
    </ItemGrid>
  </div>
</template>
