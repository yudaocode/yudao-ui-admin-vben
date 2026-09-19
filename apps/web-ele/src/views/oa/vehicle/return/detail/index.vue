<script lang="ts" setup>
import type { OaVehicleReturnApi } from '#/api/oa/vehicle/return';

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { ContentWrap } from '@vben/common-ui';

import { getVehicleReturn } from '#/api/oa/vehicle/return';
import { useDescription } from '#/components/description';
import { FileUpload } from '#/components/upload';

import { useDetailSchema } from './data';

defineOptions({ name: 'OaVehicleReturnBusinessDetail' });

const props = defineProps<{ id?: number | string }>();

const { query } = useRoute(); // 查询参数
const detailLoading = ref(false); // 详情加载中
const detailData = ref<OaVehicleReturnApi.VehicleReturn>({ fileUrls: [] }); // 申请详情

const [Descriptions] = useDescription({
  border: true,
  column: 2,
  schema: useDetailSchema(),
});

/** 获得申请详情 */
async function getInfo() {
  const id = props.id || query.id;
  if (!id) {
    return;
  }
  detailLoading.value = true;
  detailData.value = { fileUrls: [] };
  try {
    // 查询申请详情，BPM 通过业务编号传入 id
    detailData.value = await getVehicleReturn(Number(id));
  } finally {
    detailLoading.value = false;
  }
}

/** 初始化及切换申请 */
watch(
  () => props.id || query.id,
  () => {
    getInfo();
  },
  { immediate: true },
);
</script>

<template>
  <ContentWrap v-loading="detailLoading" element-loading-text="加载中...">
    <Descriptions :data="detailData">
      <template #fileUrls="{ data }">
        <FileUpload
          :model-value="data?.fileUrls || []"
          disabled
          :max-number="5"
        />
      </template>
    </Descriptions>
  </ContentWrap>
</template>
