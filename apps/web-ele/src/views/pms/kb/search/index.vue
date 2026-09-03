<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeDocumentApi } from '#/api/pms/kb/content/document';

import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';

import { ElLink } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getKnowledgeDocumentSearchPage } from '#/api/pms/kb/content/document';
import { formatKnowledgeFileSize } from '#/views/pms/kb/utils/format';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'PmsKnowledgeSearch' });

// TODO @AI：Grid 补 table-title、toolbarConfig.refresh/search，对齐 system user。
const route = useRoute(); // 当前路由
const router = useRouter(); // 路由对象
const keyword = ref(String(route.query.keyword || '')); // 当前搜索关键字

/** 获得路由携带的查询条件 */
function getRouteQueryValues() {
  return {
    keyword: String(route.query.keyword || ''),
    libraryId: route.query.libraryId
      ? Number(route.query.libraryId)
      : undefined,
    creatorUserId: route.query.creatorUserId
      ? Number(route.query.creatorUserId)
      : undefined,
    updateTime: route.query.updateTime
      ? String(route.query.updateTime).split(',')
      : undefined,
  };
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(getRouteQueryValues()),
    submitOnEnter: true,
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          keyword.value = formValues.keyword || '';
          return await getKnowledgeDocumentSearchPage({
            ...formValues,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
  } as VxeTableGridOptions<PmsKnowledgeDocumentApi.KnowledgeDocument>,
});

/** 打开文档详情 */
function openDocumentDetail(
  document: PmsKnowledgeDocumentApi.KnowledgeDocument,
) {
  router.push({
    path: `/pms/kb/library/${document.libraryId}`,
    query: { documentId: String(document.id) },
  });
}

/** 在摘要中高亮当前关键词，内容经过 DOMPurify 指令处理。 */
function highlightSummary(summary: string) {
  const value = keyword.value.trim();
  if (!value) {
    return summary;
  }
  const escapedKeyword = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return summary.replace(
    new RegExp(`(${escapedKeyword})`, 'gi'),
    '<mark>$1</mark>',
  );
}

/** 监听路由查询条件变化 */
watch(
  () => route.query,
  async () => {
    await gridApi.formApi.setValues(getRouteQueryValues());
    gridApi.query();
  },
);
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【PMS】文档与协作"
        url="https://doc.iocoder.cn/pms/kb/document/"
      />
    </template>
    <!-- 文档列表 -->
    <Grid>
      <template #title="{ row }">
        <ElLink type="primary" @click="openDocumentDetail(row)">
          {{ row.title }}
        </ElLink>
        <span
          v-if="row.fileSize !== undefined && row.fileSize !== null"
          class="ml-1 text-xs text-[var(--el-text-color-secondary)]"
        >
          （{{ formatKnowledgeFileSize(row.fileSize) }}）
        </span>
        <div
          v-if="row.contentSummary"
          v-dompurify-html="highlightSummary(row.contentSummary)"
          class="mt-1 truncate text-xs text-[var(--el-text-color-secondary)]"
        ></div>
      </template>
    </Grid>
  </Page>
</template>
