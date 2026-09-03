<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeDocumentApi } from '#/api/pms/kb/content/document';
import type { PmsKnowledgeDocumentLabelApi } from '#/api/pms/kb/content/document/label';

import { computed, nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Col, Empty, Input, Row } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getKnowledgeDocumentLabelList,
  getKnowledgeDocumentPageByLabel,
} from '#/api/pms/kb/content/document/label';

import { useGridColumns } from './data';
import KnowledgeLabelManageDialog from './knowledge-label-manage-dialog.vue';

defineOptions({ name: 'PmsKnowledgeDocumentLabel' });

// TODO @AI：左侧标签列表也能用 VXE；antd/antdv-next 不要用 v-loading。文档列表补 toolbarConfig。updateTime 走 formatter。
const router = useRouter(); // 路由
const labelLoading = ref(true); // 标签列表加载中
const labelList = ref<PmsKnowledgeDocumentLabelApi.KnowledgeDocumentLabel[]>(
  [],
); // 标签列表
const labelKeyword = ref(''); // 标签关键字
const selectedLabelId = ref<number>(); // 当前标签编号
const total = ref(0); // 文档总数

const filteredLabelList = computed(() =>
  labelList.value.filter((label) =>
    label.name.includes(labelKeyword.value.trim()),
  ),
); // 筛选后的标签列表
const selectedLabel = computed(() =>
  labelList.value.find((label) => label.id === selectedLabelId.value),
); // 当前选中的标签

const [KnowledgeLabelManageDialogModal, knowledgeLabelManageDialogModalApi] =
  useVbenModal({
    connectedComponent: KnowledgeLabelManageDialog,
  });

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async ({ page }) => {
          // 未选中标签时不查询文档列表
          if (!selectedLabelId.value) {
            total.value = 0;
            return { list: [], total: 0 };
          }
          const data = await getKnowledgeDocumentPageByLabel({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            labelId: selectedLabelId.value,
          });
          total.value = data.total;
          return data;
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
  } as VxeTableGridOptions<PmsKnowledgeDocumentApi.KnowledgeDocument>,
});

/** 获得标签列表 */
async function getLabelList() {
  labelLoading.value = true;
  try {
    labelList.value = await getKnowledgeDocumentLabelList();
    if (!labelList.value.some((label) => label.id === selectedLabelId.value)) {
      selectedLabelId.value = labelList.value[0]?.id;
    }
    await getDocumentList();
  } finally {
    labelLoading.value = false;
  }
}

/** 查询文档列表 */
async function getDocumentList() {
  if (!selectedLabelId.value) {
    total.value = 0;
    return;
  }
  // 等待表格根据选中标签完成挂载后再查询
  await nextTick();
  await gridApi.query();
}

/** 选择标签 */
function handleSelectLabel(labelId: number) {
  selectedLabelId.value = labelId;
  getDocumentList();
}

/** 清除标签筛选，保留标签管理页但不强制选中首个标签 */
function clearSelectedLabel() {
  selectedLabelId.value = undefined;
  total.value = 0;
}

/** 打开文档详情 */
function openDocumentDetail(
  document: PmsKnowledgeDocumentApi.KnowledgeDocument,
) {
  router.push({
    path: `/pms/kb/library/${document.libraryId}`,
    query: { documentId: String(document.id) },
  });
}

/** 初始化 */
onMounted(() => {
  getLabelList();
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="【PMS】文档与协作" url="https://doc.iocoder.cn/pms/kb/document/" />
    </template>
    <Row :gutter="20" class="h-full">
      <!-- 左侧标签列表 -->
      <Col :xs="24" :md="4">
        <div class="h-full rounded-lg bg-background p-4">
          <div class="mb-3 flex items-center justify-between">
            <span class="font-semibold">文档标签</span>
            <Button
              v-access:code="['pms:kb:library:update']"
              type="link"
              @click="knowledgeLabelManageDialogModalApi.open()"
            >
              管理
            </Button>
          </div>
          <Input
            v-model:value="labelKeyword"
            allow-clear
            class="mb-3"
            placeholder="请输入标签名称"
          >
            <template #prefix>
              <IconifyIcon icon="lucide:search" />
            </template>
          </Input>
          <div v-loading="labelLoading" class="min-h-[120px]">
            <div
              v-if="filteredLabelList.length"
              class="flex max-h-[calc(100vh-300px)] flex-col gap-1.5 overflow-y-auto"
            >
              <Button
                v-for="label in filteredLabelList"
                :key="label.id"
                :type="selectedLabelId === label.id ? 'primary' : 'default'"
                class="!ml-0 !justify-start"
                @click="handleSelectLabel(label.id)"
              >
                <span
                  class="mr-2 h-2.5 w-2.5 shrink-0 rounded-full"
                  :style="{ backgroundColor: label.color }"
                ></span>
                <span class="truncate">{{ label.name }}</span>
              </Button>
            </div>
            <Empty v-else description="暂无标签" />
          </div>
        </div>
      </Col>

      <!-- 右侧文档列表 -->
      <Col :xs="24" :md="20">
        <div class="flex h-full flex-col rounded-lg bg-background p-4">
          <div
            v-if="selectedLabel"
            class="mb-4 flex items-center justify-between gap-3"
          >
            <div class="text-base font-semibold">
              当前标签：{{ selectedLabel.name }}（{{ total }}）
            </div>
            <Button type="link" @click="clearSelectedLabel">清除筛选</Button>
          </div>
          <!-- 文档列表 -->
          <Grid v-if="selectedLabel" class="min-h-0 flex-1">
            <template #title="{ row }">
              <Button type="link" @click="openDocumentDetail(row)">
                {{ row.title }}
              </Button>
            </template>
            <template #updateTime="{ row }">
              {{ formatDateTime(row.updateTime) }}
            </template>
          </Grid>
          <Empty v-else description="暂无可用标签" />
        </div>
      </Col>
    </Row>

    <!-- 标签管理 -->
    <KnowledgeLabelManageDialogModal @success="getLabelList" />
  </Page>
</template>
