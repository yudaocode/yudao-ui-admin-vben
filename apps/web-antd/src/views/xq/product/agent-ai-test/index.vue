<script lang="ts" setup>
import type { XqAgentAiTestApi } from '#/api/xq/agent-ai-test';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Checkbox,
  Empty,
  Image,
  Input,
  message,
  Modal,
  Pagination,
  Spin,
  Tag,
} from 'ant-design-vue';

import { getXqAgentAiTest, getXqAgentAiTestPage } from '#/api/xq/agent-ai-test';

defineOptions({ name: 'XqAgentAiTest' });

const loading = ref(false);
const detailLoading = ref(false);
const rows = ref<XqAgentAiTestApi.Item[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const assignedOnly = ref(true);
const detailOpen = ref(false);
const detail = ref<null | XqAgentAiTestApi.Item>(null);

const query = reactive({
  keyword: '' as string,
  assignedOnly: true,
});

async function load() {
  loading.value = true;
  try {
    const res = await getXqAgentAiTestPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      keyword: query.keyword || undefined,
      assignedOnly: query.assignedOnly || undefined,
    });
    rows.value = res?.list || [];
    total.value = Number(res?.total || 0);
  } catch (error: any) {
    message.error(error?.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  query.keyword = keyword.value.trim();
  query.assignedOnly = assignedOnly.value;
  pageNo.value = 1;
  void load();
}

function onAssignedChange() {
  query.assignedOnly = assignedOnly.value;
  pageNo.value = 1;
  void load();
}

function onPageChange(page: number, size: number) {
  pageNo.value = page;
  pageSize.value = size;
  void load();
}

async function openDetail(row: XqAgentAiTestApi.Item) {
  detailOpen.value = true;
  detail.value = row;
  detailLoading.value = true;
  try {
    detail.value = (await getXqAgentAiTest(row.id)) || row;
  } catch (error: any) {
    message.error(error?.message || '详情加载失败');
  } finally {
    detailLoading.value = false;
  }
}

function imgSrc(item?: string | XqAgentAiTestApi.ImageItem) {
  if (!item) return '';
  if (typeof item === 'string') return item;
  return item.displayUrl || item.ossUrl || item.url || '';
}

onMounted(() => {
  void load();
});
</script>

<template>
  <Page auto-content-height title="AI 图测试">
    <div class="xq-ai-test">
      <div class="xq-ai-toolbar">
        <Input.Search
          v-model:value="keyword"
          allow-clear
          placeholder="SKU / 品名"
          style="max-width: 320px"
          @search="onSearch"
        />
        <Checkbox v-model:checked="assignedOnly" @change="onAssignedChange">
          仅已选平台且绑定运营+美工
        </Checkbox>
        <span class="xq-ai-hint">只读展示本地已同步数据，不触发处理</span>
      </div>

      <Spin :spinning="loading">
        <div v-if="rows.length" class="xq-ai-grid">
          <button
            v-for="row in rows"
            :key="row.id"
            type="button"
            class="xq-ai-card"
            @click="openDetail(row)"
          >
            <div class="xq-ai-cover">
              <Image
                :src="row.coverUrl || undefined"
                :preview="false"
                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Crect fill='%23f3f4f6' width='240' height='240'/%3E%3C/svg%3E"
              />
            </div>
            <div class="xq-ai-meta">
              <b :title="row.sku">{{ row.sku }}</b>
              <p :title="row.productName">{{ row.productName || '—' }}</p>
              <div class="xq-ai-tags">
                <Tag color="green">{{ row.imageCount || 0 }} 图</Tag>
                <Tag v-if="row.hasCopy" color="geekblue">
                  文案{{ row.bulletCount ? ` ${row.bulletCount}` : '' }}
                </Tag>
                <Tag v-if="row.platformName" color="blue">
                  {{ row.platformName }}
                </Tag>
                <Tag v-if="row.categoryName" color="cyan">
                  {{ row.categoryName }}
                </Tag>
                <Tag
                  v-if="row.assignOwnerName || row.assignOwnerUserId"
                  color="purple"
                >
                  运营 {{ row.assignOwnerName || row.assignOwnerUserId }}
                </Tag>
                <Tag
                  v-if="row.assignImageName || row.assignImageUserId"
                  color="orange"
                >
                  美工 {{ row.assignImageName || row.assignImageUserId }}
                </Tag>
              </div>
              <p
                v-if="row.copyTitle"
                class="xq-ai-copy-preview"
                :title="row.copyTitle"
              >
                {{ row.copyTitle }}
              </p>
            </div>
          </button>
        </div>
        <Empty
          v-else
          description="暂无匹配数据（可取消勾选筛选或等待同步完成）"
        />
      </Spin>

      <div v-if="total > 0" class="xq-ai-pager">
        <Pagination
          :current="pageNo"
          :page-size="pageSize"
          :total="total"
          show-size-changer
          :page-size-options="['12', '20', '40']"
          @change="onPageChange"
        />
      </div>
    </div>

    <Modal
      v-model:open="detailOpen"
      :title="detail?.sku || 'AI 图详情'"
      width="980px"
      :footer="null"
      destroy-on-close
    >
      <Spin :spinning="detailLoading">
        <div v-if="detail" class="xq-ai-detail">
          <p class="xq-ai-detail-name">{{ detail.productName || '—' }}</p>
          <div class="xq-ai-detail-tags">
            <Tag color="green">{{ detail.imageCount || 0 }} 图</Tag>
            <Tag v-if="detail.hasCopy || detail.copy" color="geekblue">
              有文案
            </Tag>
            <Tag
              v-if="detail.platformName || detail.listingPlatformId"
              color="blue"
            >
              平台 {{ detail.platformName || detail.listingPlatformId }}
            </Tag>
            <Tag
              v-if="detail.categoryName || detail.listingCategoryId"
              color="cyan"
            >
              分类 {{ detail.categoryName || detail.listingCategoryId }}
            </Tag>
            <Tag v-if="detail.shopId">店铺 {{ detail.shopId }}</Tag>
            <Tag
              v-if="detail.assignOwnerName || detail.assignOwnerUserId"
              color="purple"
            >
              运营 {{ detail.assignOwnerName || detail.assignOwnerUserId }}
            </Tag>
            <Tag v-if="detail.assignCopyName || detail.assignCopyUserId">
              文案员 {{ detail.assignCopyName || detail.assignCopyUserId }}
            </Tag>
            <Tag
              v-if="detail.assignImageName || detail.assignImageUserId"
              color="orange"
            >
              美工 {{ detail.assignImageName || detail.assignImageUserId }}
            </Tag>
            <Tag v-if="detail.assignPhase">阶段 {{ detail.assignPhase }}</Tag>
            <Tag v-if="detail.batchNo">批次 {{ detail.batchNo }}</Tag>
            <Tag v-if="detail.generatedAt">{{ detail.generatedAt }}</Tag>
          </div>

          <section class="xq-ai-section">
            <h4>文案</h4>
            <div v-if="detail.copy" class="xq-ai-copy">
              <div class="xq-ai-copy-block">
                <label>标题</label>
                <p>{{ detail.copy.title || '—' }}</p>
              </div>
              <div v-if="detail.copy.productStyle" class="xq-ai-copy-block">
                <label>风格</label>
                <p>{{ detail.copy.productStyle }}</p>
              </div>
              <div class="xq-ai-copy-block">
                <label>描述</label>
                <pre>{{ detail.copy.description || '—' }}</pre>
              </div>
              <div class="xq-ai-copy-block">
                <label>卖点 ({{ detail.copy.bullets?.length || 0 }})</label>
                <ol v-if="detail.copy.bullets?.length" class="xq-ai-bullets">
                  <li v-for="(b, i) in detail.copy.bullets" :key="i">
                    {{ b }}
                  </li>
                </ol>
                <p v-else>—</p>
              </div>
            </div>
            <Empty v-else description="暂无文案" />
          </section>

          <section class="xq-ai-section">
            <h4>图片</h4>
            <div v-if="detail.images?.length" class="xq-ai-detail-grid">
              <div
                v-for="(img, idx) in detail.images"
                :key="`${detail.id}-${idx}`"
                class="xq-ai-detail-item"
              >
                <Image :src="imgSrc(img) || undefined" :preview="true" />
                <span>{{ img.name || `图 ${idx + 1}` }}</span>
              </div>
            </div>
            <Empty v-else description="无图片" />
          </section>
        </div>
      </Spin>
    </Modal>
  </Page>
</template>

<style scoped>
.xq-ai-test {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100%;
  padding: 4px 2px 16px;
}

.xq-ai-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.xq-ai-hint {
  font-size: 12px;
  color: #9ca3af;
}

.xq-ai-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.xq-ai-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 10px;
}

.xq-ai-card:hover {
  border-color: #93c5fd;
}

.xq-ai-cover {
  aspect-ratio: 1;
  overflow: hidden;
  background: #f3f4f6;
}

.xq-ai-cover :deep(.ant-image),
.xq-ai-cover :deep(.ant-image-img),
.xq-ai-cover :deep(img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}

.xq-ai-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px 12px;
}

.xq-ai-meta b {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: #111827;
  white-space: nowrap;
}

.xq-ai-meta p {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.xq-ai-copy-preview {
  margin: 2px 0 0 !important;
  color: #4b5563 !important;
  white-space: nowrap;
}

.xq-ai-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.xq-ai-pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

.xq-ai-detail-name {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.xq-ai-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.xq-ai-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.xq-ai-detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.xq-ai-detail-item :deep(.ant-image),
.xq-ai-detail-item :deep(.ant-image-img),
.xq-ai-detail-item :deep(img) {
  width: 100% !important;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
}

.xq-ai-detail-item span {
  font-size: 12px;
  color: #6b7280;
}

.xq-ai-section {
  margin-top: 16px;
}

.xq-ai-section h4 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.xq-ai-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px;
  background: #f9fafb;
  border: 1px solid #eef0f3;
  border-radius: 8px;
}

.xq-ai-copy-block label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.xq-ai-copy-block p,
.xq-ai-copy-block pre {
  margin: 0;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.55;
  color: #111827;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.xq-ai-bullets {
  padding-left: 18px;
  margin: 0;
}

.xq-ai-bullets li {
  margin-bottom: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: #111827;
}
</style>
