<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeDocumentApi } from '#/api/pms/kb/content/document';

import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getKnowledgeDocumentSearchPage } from '#/api/pms/kb/content/document';
import { DictTag } from '#/components/dict-tag';
import { formatKnowledgeFileSize } from '#/views/pms/kb/utils/format';

import { useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'PmsKnowledgeSearch' });

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
    pagerConfig: {
      enabled: true,
      pageSize: 10,
      pageSizes: [10, 20, 30, 50],
    },
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
  router.push(`/pms/kb/library/${document.libraryId}/document/${document.id}`);
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
    <!-- 文档列表 -->
    <!-- TODO @AI：宽度没占满；是不是别的，可能也有类似问题； -->
    <!-- TODO @AI：很多这里的 format 逻辑，是不是都适合放到 data.ts 里？你分析下； -->
    <Grid>
      <template #title="{ row }">
        <Button class="!p-0" type="link" @click="openDocumentDetail(row)">
          {{ row.title }}
        </Button>
        <span
          v-if="row.fileSize !== undefined && row.fileSize !== null"
          class="ml-1 text-xs text-muted-foreground"
        >
          （{{ formatKnowledgeFileSize(row.fileSize) }}）
        </span>
        <div
          v-if="row.contentSummary"
          v-dompurify-html="highlightSummary(row.contentSummary)"
          class="mt-1 truncate text-xs text-muted-foreground"
        ></div>
      </template>
      <template #type="{ row }">
        <DictTag
          :type="DICT_TYPE.PMS_KNOWLEDGE_DOCUMENT_TYPE"
          :value="row.type"
        />
      </template>
      <template #updateTime="{ row }">
        {{ formatDateTime(row.updateTime) }}
      </template>
    </Grid>
  </Page>
</template>
