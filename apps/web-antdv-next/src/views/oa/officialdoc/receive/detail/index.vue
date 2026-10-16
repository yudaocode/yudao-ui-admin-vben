<script lang="ts" setup>
import type { OaOfficialDocReceiveApi } from '#/api/oa/officialdoc/receive';

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';

import { Button, Spin } from 'antdv-next';

import { getOfficialDocReceive } from '#/api/oa/officialdoc/receive';
import { useDescription } from '#/components/description';
import { FilePreview } from '#/components/file-preview';
import { FileUpload } from '#/components/upload';

import SendDetailContent from '../../send/detail/index.vue';
import { useDetailSchema } from '../data';

defineOptions({ name: 'OaOfficialDocReceiveBusinessDetail' });

const props = defineProps<{ id?: number | string }>();
const route = useRoute();
const loading = ref(false); // 详情加载状态
const detail = ref<OaOfficialDocReceiveApi.OfficialDocReceive>({}); // 公文详情

const [Descriptions] = useDescription({
  bordered: true,
  column: 2,
  schema: useDetailSchema(),
});

const [SendDetailModal, sendDetailModalApi] = useVbenModal();

/** 查看关联发文 */
function openSendDetail() {
  sendDetailModalApi.open();
}

/** 查询详情 */
async function getInfo() {
  const id = Number(props.id || route.query.id);
  if (!id) {
    return;
  }
  loading.value = true;
  try {
    detail.value = await getOfficialDocReceive(id);
  } finally {
    loading.value = false;
  }
}

/** 初始化及切换公文 */
watch(
  () => props.id || route.query.id,
  () => {
    getInfo();
  },
  { immediate: true },
);
</script>

<template>
  <Spin :spinning="loading">
    <Descriptions :data="detail">
      <template #fileUrls="{ data }">
        <FileUpload
          v-if="data?.fileUrls?.length"
          :model-value="data.fileUrls"
          disabled
          multiple
        />
        <span v-else>-</span>
      </template>
      <template #formalFileUrl="{ data }">
        <FileUpload
          v-if="data?.formalFileUrl"
          :model-value="data.formalFileUrl"
          disabled
        />
        <span v-else>-</span>
      </template>
      <template #sendDoc>
        <Button type="link" @click="openSendDetail">查看关联发文</Button>
      </template>
    </Descriptions>

    <!-- 正式公文预览 -->
    <FilePreview
      v-if="detail.formalFileUrl"
      class="mt-[16px]"
      :url="detail.formalFileUrl"
      downloadable
    />

    <!-- 关联发文详情弹窗 -->
    <SendDetailModal
      title="公文发文详情"
      class="w-2/3"
      :show-cancel-button="false"
      :show-confirm-button="false"
    >
      <SendDetailContent
        v-if="detail.sendId"
        :id="detail.sendId"
        :key="detail.sendId"
      />
    </SendDetailModal>
  </Spin>
</template>
