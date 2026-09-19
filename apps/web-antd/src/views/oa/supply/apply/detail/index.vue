<script lang="ts" setup>
import type { OaSupplyApplyApi } from '#/api/oa/supply/apply';

import { nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { ContentWrap } from '@vben/common-ui';
import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { Spin, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSupplyApply } from '#/api/oa/supply/apply';
import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';
import { FileUpload } from '#/components/upload';

import { useDetailItemColumns, useDetailSchema } from '../data';

defineOptions({ name: 'OaSupplyApplyBusinessDetail' });

const props = defineProps<{ id?: number | string }>();
const route = useRoute(); // 路由
const detailLoading = ref(false); // 详情加载中
const formData = ref<OaSupplyApplyApi.SupplyApply>(); // 申请详情

const [Descriptions] = useDescription({
  bordered: true,
  column: 2,
  schema: useDetailSchema(),
});

/** 领用明细表格 */
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useDetailItemColumns(),
    minHeight: 120,
    autoResize: true,
    border: true,
    rowConfig: {
      keyField: 'itemId',
      isHover: true,
    },
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
  },
});

/** 获得申请详情 */
async function getInfo() {
  const id = props.id || route.query.id;
  if (!id) {
    return;
  }
  detailLoading.value = true;
  try {
    formData.value = await getSupplyApply(Number(id));
    await nextTick(); // 特殊：保证 gridApi 已经初始化
    await gridApi.grid.reloadData(formData.value.items ?? []);
  } finally {
    detailLoading.value = false;
  }
}

/** 初始化及切换申请 */
watch(
  () => props.id || route.query.id,
  () => {
    getInfo();
  },
  { immediate: true },
);
</script>

<template>
  <ContentWrap class="m-2">
    <Spin :spinning="detailLoading" tip="加载中...">
      <Descriptions :data="formData ?? {}">
        <template #statusTag="{ data }">
          <Tag v-if="data?.status === BpmProcessInstanceStatus.NOT_START">
            未提交
          </Tag>
          <DictTag
            v-else-if="data?.status !== undefined"
            :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
            :value="data.status"
          />
          <span v-else>-</span>
        </template>
        <template #fileUrls="{ data }">
          <FileUpload
            :model-value="data?.fileUrls || []"
            disabled
            :show-description="false"
          />
        </template>
      </Descriptions>
      <!-- 领用明细 -->
      <div class="mb-3 mt-5 font-bold">领用明细</div>
      <Grid />
    </Spin>
  </ContentWrap>
</template>
