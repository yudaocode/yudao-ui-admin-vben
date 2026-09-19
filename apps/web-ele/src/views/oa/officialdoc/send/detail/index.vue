<script lang="ts" setup>
import type { OaOfficialDocSendApi } from '#/api/oa/officialdoc/send';
import type { OaOfficialDocTemplateApi } from '#/api/oa/officialdoc/template';

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus } from '@vben/constants';
import { useUserStore } from '@vben/stores';

import { ElButton } from 'element-plus';

import { getOfficialDocSend } from '#/api/oa/officialdoc/send';
import { getOfficialDocTemplate } from '#/api/oa/officialdoc/template';
import { useDescription } from '#/components/description';
import { FileUpload } from '#/components/upload';

import OfficialDocPreview from '../../components/official-doc-preview.vue';
import { useDetailSchema } from '../data';
import Form from '../modules/form.vue';

defineOptions({ name: 'OaOfficialDocSendBusinessDetail' });

const props = defineProps<{ id?: number | string }>();
const route = useRoute(); // 路由参数
const userStore = useUserStore(); // 当前用户
const loading = ref(false); // 详情加载状态
const detail = ref<OaOfficialDocSendApi.OfficialDocSend>({}); // 公文详情
const template = ref<OaOfficialDocTemplateApi.OfficialDocTemplate>(); // 套红模板

const [Descriptions] = useDescription({
  border: true,
  column: 2,
  schema: useDetailSchema(),
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 编辑未提交的草稿公文 */
function handleEdit() {
  formModalApi.setData({ id: detail.value.id }).open();
}

/** 查询详情 */
async function getInfo() {
  const id = Number(props.id || route.query.id);
  if (!id) {
    return;
  }
  loading.value = true;
  try {
    detail.value = await getOfficialDocSend(id);
    template.value = detail.value.templateId
      ? await getOfficialDocTemplate(detail.value.templateId)
      : undefined;
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
  <div v-loading="loading">
    <ElButton
      v-if="
        detail.status === BpmProcessInstanceStatus.NOT_START &&
        detail.creator === String(userStore.userInfo?.id)
      "
      v-access:code="['oa:officialdoc-send:update']"
      class="mb-[16px]"
      type="primary"
      @click="handleEdit"
    >
      编辑公文
    </ElButton>
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
    </Descriptions>
    <OfficialDocPreview
      v-if="detail.id"
      :document="detail"
      :template="template"
    />
  </div>
  <FormModal @success="getInfo" />
</template>
