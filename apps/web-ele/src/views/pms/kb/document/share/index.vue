<script lang="ts" setup>
import type { PmsKnowledgeDocumentShareApi } from '#/api/pms/kb/interaction/share';

import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { ElCard, ElEmpty } from 'element-plus';

import { getPublicKnowledgeDocument } from '#/api/pms/kb/interaction/share';
import { FilePreview } from '#/components/file-preview';
import { PmsKnowledgeDocumentType } from '#/views/pms/kb/utils/constants';

defineOptions({ name: 'PmsKnowledgeDocumentShare' });

// TODO @AI：antd/antdv-next 不要用 v-loading。公开分享页三端布局对齐。

const route = useRoute(); // 当前路由
const loading = ref(false); // 数据加载中
const document =
  ref<PmsKnowledgeDocumentShareApi.KnowledgeDocumentSharePublic>(); // 共享文档详情

/** 获得共享文档详情 */
async function getDocument() {
  loading.value = true;
  try {
    document.value = await getPublicKnowledgeDocument(
      String(route.params.token),
    );
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getDocument();
});
</script>

<template>
  <div
    v-loading="loading"
    class="min-h-screen bg-[var(--el-bg-color-page)] px-6 py-6"
  >
    <ElCard
      v-if="document"
      :body-style="{ padding: '40px 48px' }"
      class="mx-auto min-h-[calc(100vh-48px)] max-w-[960px]"
      shadow="never"
    >
      <div
        v-if="document.type === PmsKnowledgeDocumentType.RICH_TEXT"
        v-dompurify-html="document.content || '<p>暂无内容</p>'"
        class="knowledge-share-content"
      ></div>
      <div v-else class="min-h-[240px]">
        <div class="mb-6 text-2xl font-semibold leading-[1.4]">
          {{ document.title }}
        </div>
        <div class="min-h-[180px]">
          <FilePreview
            v-if="document.previewUrl"
            :downloadable="false"
            :file-name="document.title"
            :file-type="document.fileType"
            :url="document.previewUrl"
          />
          <ElEmpty v-else description="文件未上传" />
        </div>
      </div>
    </ElCard>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-share-content {
  font-size: 15px;
  line-height: 1.8;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;

  :deep(h1) {
    margin: 0 0 20px;
    font-size: 28px;
    line-height: 1.4;
  }

  :deep(h2) {
    margin: 24px 0 14px;
    font-size: 22px;
    line-height: 1.4;
  }

  :deep(h3) {
    margin: 20px 0 12px;
    font-size: 18px;
  }

  :deep(p) {
    margin: 0 0 14px;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
  }
}
</style>
