<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';
import type { XqListingApi } from '#/api/xq/listing';
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  Button,
  Checkbox,
  Empty,
  Image,
  Input,
  message,
  Modal,
  Pagination,
  Select,
  Spin,
  Tag,
} from 'ant-design-vue';

import { getSimpleUserList } from '#/api/system/user';
import { getXqListingPlatforms, getXqListingShops } from '#/api/xq/listing';
import {
  batchAssignXqWorkOrderImage,
  batchCloseXqWorkOrder,
  closeXqWorkOrder,
  getXqWorkOrderPage,
  updateXqWorkOrder,
} from '#/api/xq/work-order';

defineOptions({ name: 'XqCopyPool' });

const FEATURE_COUNT = 5;

interface ImagePromptItem {
  index: number;
  imageType?: string;
  imageUrl?: string;
  marker?: string;
  promptText?: string;
  bindIndexes?: number[];
}

const userStore = useUserStore();
const myUserId = computed(() => {
  const info = userStore.userInfo as null | Record<string, any>;
  return Number(info?.userId || info?.id || 0) || undefined;
});

const loading = ref(false);
const saving = ref(false);
const assigning = ref(false);
const closing = ref(false);
const keyword = ref('');
const tasks = ref<XqWorkOrderApi.WorkOrder[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const selectedMap = ref<Record<number, XqWorkOrderApi.WorkOrder>>({});
const activeId = ref<number | undefined>();

const assignOpen = ref(false);
const imageUserId = ref<number | undefined>();
const platformId = ref<string | undefined>();
const shopId = ref<string | undefined>();
const users = ref<SystemUserApi.User[]>([]);
const platforms = ref<XqListingApi.Platform[]>([]);
const shops = ref<XqListingApi.Shop[]>([]);

const form = reactive({
  contentTitle: '',
  sellingPoints: Array.from({ length: FEATURE_COUNT }, () => ''),
  description: '',
  highlightStyle: '',
});

const queryParams = reactive({
  keyword: '' as string | undefined,
});

const selectedCount = computed(() => Object.keys(selectedMap.value).length);
const unassignedSelected = computed(() =>
  Object.values(selectedMap.value).filter((t) => !t.imageUserId),
);

const activeTask = computed(
  () => tasks.value.find((t) => t.id === activeId.value) || null,
);

function promptImageUrl(p: ImagePromptItem, i: number) {
  return (
    p.imageUrl ||
    sourceImages.value[p.index ?? i] ||
    sourceImages.value[i] ||
    ''
  );
}

const imagePrompts = computed<ImagePromptItem[]>(() => {
  const raw = activeTask.value?.imagePromptJson;
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
});

const sourceImages = computed(() => {
  const row = activeTask.value;
  if (!row) return [] as string[];
  const urls: string[] = [];
  if (row.coverUrl) urls.push(row.coverUrl);
  if (row.sourceImageUrls) {
    try {
      const arr = JSON.parse(row.sourceImageUrls);
      if (Array.isArray(arr)) {
        for (const u of arr) {
          const s = String(u || '').trim();
          if (s && !urls.includes(s)) urls.push(s);
        }
      }
    } catch {
      // ignore
    }
  }
  return urls;
});

function coverOf(row: XqWorkOrderApi.WorkOrder) {
  return row.generatedImageUrl || row.coverUrl || undefined;
}

function isChecked(row: XqWorkOrderApi.WorkOrder) {
  return Boolean(row.id && selectedMap.value[row.id]);
}

function toggleCheck(row: XqWorkOrderApi.WorkOrder, checked?: boolean) {
  if (!row.id) return;
  const id = row.id;
  const on = checked === undefined ? !selectedMap.value[id] : checked;
  selectedMap.value = on
    ? { ...selectedMap.value, [id]: row }
    : Object.fromEntries(
        Object.entries(selectedMap.value).filter(([k]) => Number(k) !== id),
      );
}

function clearSelection() {
  selectedMap.value = {};
}

function statusText(row: XqWorkOrderApi.WorkOrder) {
  if (row.imageUserId) return '已分配美工';
  if (row.rpaCopyStatus === 'fail') return '文案失败';
  if (row.rpaCopyStatus === 'running') return '生成中';
  if (row.rpaCopyStatus === 'queued') return '待手动跑RPA';
  return '待分配美工';
}

function statusColor(row: XqWorkOrderApi.WorkOrder) {
  if (row.imageUserId) return 'success';
  if (row.rpaCopyStatus === 'fail') return 'error';
  if (row.rpaCopyStatus === 'running') return 'processing';
  if (row.rpaCopyStatus === 'queued') return 'warning';
  return 'processing';
}

function parseSellingPoints(raw?: string) {
  const lines = String(raw || '')
    .split(/\r?\n+/)
    .map((l) => l.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter(Boolean);
  const points = Array.from(
    { length: FEATURE_COUNT },
    (_, i) => lines[i] || '',
  );
  return points;
}

function parseCopyJson(row: XqWorkOrderApi.WorkOrder) {
  if (!row.copyResultJson) {
    return { highlightStyle: '', description: '' };
  }
  try {
    const obj = JSON.parse(row.copyResultJson);
    return {
      highlightStyle: String(obj.highlightStyle || '').trim(),
      description: String(obj.description || '').trim(),
    };
  } catch {
    return { highlightStyle: '', description: '' };
  }
}

function fillForm(row: null | XqWorkOrderApi.WorkOrder) {
  if (!row) {
    form.contentTitle = '';
    form.sellingPoints = Array.from({ length: FEATURE_COUNT }, () => '');
    form.description = '';
    form.highlightStyle = '';
    return;
  }
  form.contentTitle = row.contentTitle || row.title || '';
  form.sellingPoints = parseSellingPoints(row.contentSellingPoints);
  const parsed = parseCopyJson(row);
  form.description = parsed.description;
  form.highlightStyle = parsed.highlightStyle;
}

function selectTask(row: XqWorkOrderApi.WorkOrder) {
  activeId.value = row.id;
  fillForm(row);
}

watch(activeTask, (row) => {
  if (row) fillForm(row);
});

async function loadTasks() {
  if (!myUserId.value) {
    message.warning('未获取到当前用户，请重新登录');
    return;
  }
  loading.value = true;
  try {
    const res = await getXqWorkOrderPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      keyword: queryParams.keyword || undefined,
      status: 10,
      copyUserId: myUserId.value,
      copyReady: true,
    });
    tasks.value = res?.list || [];
    total.value = Number(res?.total || 0);
    if (activeId.value && !tasks.value.some((t) => t.id === activeId.value)) {
      activeId.value = undefined;
      fillForm(null);
    }
    if (!activeId.value && tasks.value[0]?.id) {
      selectTask(tasks.value[0]!);
    }
  } catch (error: any) {
    message.error(error?.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.keyword = keyword.value.trim() || undefined;
  pageNo.value = 1;
  loadTasks();
}

function onPageChange(page: number, size: number) {
  pageNo.value = page;
  pageSize.value = size;
  loadTasks();
}

async function saveCurrent() {
  const row = activeTask.value;
  if (!row?.id) {
    message.warning('请先选择左侧任务');
    return;
  }
  const points = form.sellingPoints.map((p) => p.trim()).filter(Boolean);
  const sellingText = points
    .map((p) => (p.startsWith('•') ? p : `• ${p}`))
    .join('\n');
  saving.value = true;
  try {
    await updateXqWorkOrder({
      id: row.id,
      contentTitle: form.contentTitle.trim(),
      contentSellingPoints: sellingText,
      contentHighlight: form.highlightStyle.trim(),
      contentDescription: form.description.trim(),
    });
    message.success('文案已保存');
    await loadTasks();
    const next = tasks.value.find((t) => t.id === row.id);
    if (next) selectTask(next);
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function openAssign() {
  if (unassignedSelected.value.length === 0) {
    message.warning('请勾选尚未分配美工、且文案已完成的任务');
    return;
  }
  assignOpen.value = true;
  if (users.value.length === 0) {
    users.value = (await getSimpleUserList()) || [];
  }
  if (platforms.value.length === 0) {
    try {
      platforms.value = (await getXqListingPlatforms()) || [];
    } catch {
      platforms.value = [];
    }
  }
}

async function onPlatformChange(id?: string) {
  platformId.value = id;
  shopId.value = undefined;
  if (!id) {
    shops.value = [];
    return;
  }
  shops.value = (await getXqListingShops(id)) || [];
}

async function confirmAssign() {
  if (!imageUserId.value) {
    message.warning('请选择美工人员');
    return;
  }
  const ids = unassignedSelected.value
    .map((t) => t.id)
    .filter((id): id is number => Boolean(id));
  if (ids.length === 0) return;
  assigning.value = true;
  try {
    const n = await batchAssignXqWorkOrderImage({
      ids,
      imageUserId: imageUserId.value,
      listingPlatformId: platformId.value,
      listingShopId: shopId.value,
    });
    message.success(`已分配 ${n} 个任务给美工`);
    assignOpen.value = false;
    clearSelection();
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '分配失败');
  } finally {
    assigning.value = false;
  }
}

async function closeOneTask(row: XqWorkOrderApi.WorkOrder) {
  if (!row.id) return;
  Modal.confirm({
    title: '关闭并清理任务',
    content: `确认关闭「${row.externalSku || row.title || row.id}」？将清空文案、美工与图提示词。`,
    okText: '关闭并清理',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await closeXqWorkOrder(row.id!);
        message.success('已关闭并清理进度');
        const next: Record<number, XqWorkOrderApi.WorkOrder> = {};
        for (const [key, value] of Object.entries(selectedMap.value)) {
          if (Number(key) !== row.id) {
            next[Number(key)] = value;
          }
        }
        selectedMap.value = next;
        if (activeId.value === row.id) {
          activeId.value = undefined;
          fillForm(null);
        }
        await loadTasks();
      } catch (error: any) {
        message.error(error?.message || '关闭失败');
        throw error;
      }
    },
  });
}

async function batchCloseTasks() {
  const ids = Object.values(selectedMap.value)
    .map((t) => t.id)
    .filter((id): id is number => Boolean(id));
  if (ids.length === 0) {
    message.warning('请先勾选要清理的任务');
    return;
  }
  Modal.confirm({
    title: '批量关闭并清理',
    content: `确认关闭选中的 ${ids.length} 个任务？`,
    okText: '关闭并清理',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      closing.value = true;
      try {
        const n = await batchCloseXqWorkOrder(ids);
        message.success(`已关闭并清理 ${n} 个任务`);
        clearSelection();
        activeId.value = undefined;
        fillForm(null);
        await loadTasks();
      } catch (error: any) {
        message.error(error?.message || '批量关闭失败');
        throw error;
      } finally {
        closing.value = false;
      }
    },
  });
}

function imageTypeLabel(t?: string) {
  const map: Record<string, string> = {
    main: '主图',
    dimension: '尺寸图',
    detail: '细节图',
    scene: '场景图',
    package: '包装图',
    other: '其它',
  };
  return map[String(t || '').toLowerCase()] || t || '图';
}

onMounted(loadTasks);
</script>

<template>
  <Page auto-content-height>
    <div class="xq-copy-pool">
      <div class="xq-toolbar">
        <div class="xq-title-block">
          <h2>我的文案</h2>
          <p>左选任务，右编标题 / 卖点 / 突出内容；下方查看图片提示词。</p>
        </div>
        <Input.Search
          v-model:value="keyword"
          allow-clear
          class="xq-search"
          placeholder="搜索任务号 / Item Code / 标题"
          enter-button="搜索"
          @search="handleSearch"
        />
        <Button
          type="primary"
          :disabled="unassignedSelected.length === 0"
          @click="openAssign"
        >
          批量分配美工
          {{
            unassignedSelected.length ? `(${unassignedSelected.length})` : ''
          }}
        </Button>
        <Button
          danger
          :disabled="selectedCount === 0"
          :loading="closing"
          @click="batchCloseTasks"
        >
          批量关闭清理{{ selectedCount ? ` (${selectedCount})` : '' }}
        </Button>
        <Button v-if="selectedCount" @click="clearSelection">清空选择</Button>
      </div>

      <Spin :spinning="loading">
        <div v-if="tasks.length" class="xq-split">
          <!-- 左：任务列表 -->
          <aside class="xq-list">
            <div
              v-for="row in tasks"
              :key="row.id"
              class="xq-list-item"
              :class="{ active: row.id === activeId, checked: isChecked(row) }"
              role="button"
              tabindex="0"
              @click="selectTask(row)"
              @keydown.enter="selectTask(row)"
            >
              <div
                class="xq-list-check"
                @click.stop="toggleCheck(row, !isChecked(row))"
              >
                <Checkbox :checked="isChecked(row)" />
              </div>
              <div class="xq-list-thumb">
                <Image :src="coverOf(row)" :preview="false" />
              </div>
              <div class="xq-list-body">
                <div class="xq-list-top">
                  <span class="xq-list-sku">{{ row.externalSku || '—' }}</span>
                  <Tag :color="statusColor(row)" class="xq-list-tag">
                    {{ statusText(row) }}
                  </Tag>
                </div>
                <div class="xq-list-title" :title="row.title">
                  {{ row.title || row.contentTitle || '未命名' }}
                </div>
                <div class="xq-list-meta">{{ row.no }}</div>
              </div>
            </div>
            <div v-if="total > pageSize" class="xq-list-pager">
              <Pagination
                :current="pageNo"
                :page-size="pageSize"
                :total="total"
                size="small"
                simple
                @change="onPageChange"
              />
            </div>
          </aside>

          <!-- 右：编辑区 -->
          <section v-if="activeTask" class="xq-detail">
            <div class="xq-detail-head">
              <div class="xq-detail-cover">
                <Image :src="coverOf(activeTask)" :preview="true" />
                <Tag class="xq-detail-badge" :color="statusColor(activeTask)">
                  {{ statusText(activeTask) }}
                </Tag>
              </div>
              <div class="xq-detail-info">
                <div class="xq-info-row">
                  <span class="xq-label">Item Code</span>
                  <b>{{ activeTask.externalSku || '—' }}</b>
                </div>
                <div class="xq-info-row">
                  <span class="xq-label">产品标题</span>
                  <span class="xq-info-text">{{
                    activeTask.title || '—'
                  }}</span>
                </div>
                <div v-if="activeTask.listingPlatformName" class="xq-info-row">
                  <span class="xq-label">上架</span>
                  <span class="xq-info-text">
                    {{
                      [
                        activeTask.listingPlatformName,
                        activeTask.listingShopName,
                        activeTask.listingCategoryName,
                      ]
                        .filter(Boolean)
                        .join(' / ')
                    }}
                  </span>
                </div>
                <div class="xq-detail-actions">
                  <Button type="primary" :loading="saving" @click="saveCurrent">
                    保存文案
                  </Button>
                  <Button danger @click="closeOneTask(activeTask)">
                    关闭清理
                  </Button>
                </div>
              </div>
            </div>

            <div class="xq-edit-block">
              <label class="xq-field-label">标题</label>
              <Input
                v-model:value="form.contentTitle"
                placeholder="优化后的产品标题"
                allow-clear
              />
            </div>

            <div class="xq-edit-block">
              <label class="xq-field-label">卖点</label>
              <div class="xq-points-stack">
                <Input
                  v-for="(_, idx) in form.sellingPoints"
                  :key="`sp-${idx}`"
                  v-model:value="form.sellingPoints[idx]"
                  :placeholder="`卖点 ${idx + 1}`"
                  allow-clear
                />
              </div>
            </div>

            <div class="xq-edit-block">
              <label class="xq-field-label">长描述</label>
              <Input.TextArea
                v-model:value="form.description"
                :rows="8"
                placeholder="英文 Product Description，完整句子"
                allow-clear
              />
            </div>

            <div class="xq-edit-block">
              <label class="xq-field-label">突出内容风格</label>
              <Input.TextArea
                v-model:value="form.highlightStyle"
                :rows="3"
                placeholder="中文突出卖点摘要"
                allow-clear
              />
            </div>

            <div class="xq-edit-block">
              <label class="xq-field-label">
                图片提示词
                <span class="xq-muted">
                  （{{ imagePrompts.length }} 条 · 由文案 RPA 生成）
                </span>
              </label>
              <div v-if="imagePrompts.length" class="xq-prompt-list">
                <div
                  v-for="(p, i) in imagePrompts"
                  :key="`ip-${i}`"
                  class="xq-prompt-card"
                >
                  <div class="xq-prompt-thumb">
                    <Image
                      v-if="promptImageUrl(p, i)"
                      :src="promptImageUrl(p, i)"
                      :preview="true"
                    />
                    <span v-else class="xq-muted">无图</span>
                    <span class="xq-source-idx">{{ (p.index ?? i) + 1 }}</span>
                  </div>
                  <div class="xq-prompt-body">
                    <div class="xq-prompt-head">
                      <Tag>{{ imageTypeLabel(p.imageType) }}</Tag>
                      <span v-if="p.marker" class="xq-marker">{{
                        p.marker
                      }}</span>
                    </div>
                    <pre class="xq-prompt-text">{{ p.promptText || '—' }}</pre>
                  </div>
                </div>
              </div>
              <Empty
                v-else
                description="暂无图片提示词，请先在任务列表触发「批量生成文案」"
              />
            </div>

            <div v-if="sourceImages.length" class="xq-edit-block">
              <label class="xq-field-label">Giga 原图</label>
              <div class="xq-source-grid">
                <div
                  v-for="(url, i) in sourceImages"
                  :key="`src-${i}`"
                  class="xq-source-item"
                >
                  <Image :src="url" :preview="true" />
                  <span class="xq-source-idx">{{ i + 1 }}</span>
                </div>
              </div>
            </div>
          </section>

          <Empty v-else class="xq-detail-empty" description="请选择左侧任务" />
        </div>
        <Empty
          v-else
          description="暂无数据：请先在任务列表多选「批量生成文案」"
        />
      </Spin>
    </div>

    <Modal
      v-model:open="assignOpen"
      title="批量分配美工"
      :confirm-loading="assigning"
      ok-text="确认分配"
      @ok="confirmAssign"
    >
      <div class="xq-assign-form">
        <label>美工人员</label>
        <Select
          v-model:value="imageUserId"
          show-search
          option-filter-prop="label"
          placeholder="选择美工"
          :options="
            users.map((u) => ({
              label: `${u.nickname || u.username} (#${u.id})`,
              value: u.id,
            }))
          "
        />
        <label>上架平台（可选）</label>
        <Select
          v-model:value="platformId"
          allow-clear
          placeholder="选择平台"
          :options="
            platforms.map((p) => ({
              label: `${p.name} (${p.code})`,
              value: p.id,
            }))
          "
          @change="(v: any) => onPlatformChange(v)"
        />
        <label>店铺（可选）</label>
        <Select
          v-model:value="shopId"
          allow-clear
          placeholder="选择店铺"
          :options="shops.map((s) => ({ label: s.name, value: s.id }))"
        />
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.xq-copy-pool {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  padding: 4px 2px 12px;
}

.xq-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.xq-title-block {
  flex: 1;
  min-width: 220px;
}

.xq-title-block h2 {
  margin: 0;
  font-size: 18px;
}

.xq-title-block p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.xq-search {
  width: 280px;
}

.xq-split {
  display: grid;
  grid-template-columns: minmax(280px, 340px) 1fr;
  gap: 12px;
  align-items: stretch;
  min-height: 560px;
}

.xq-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: calc(100vh - 220px);
  padding: 8px;
  overflow: auto;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
}

.xq-list-item {
  display: grid;
  grid-template-columns: 28px 64px 1fr;
  gap: 8px;
  align-items: center;
  padding: 8px;
  text-align: left;
  cursor: pointer;
  background: #fafafa;
  border: 1px solid transparent;
  border-radius: 10px;
}

.xq-list-item:hover {
  background: #f3f4f6;
}

.xq-list-item.active {
  background: #eef5ff;
  border-color: #1677ff;
}

.xq-list-thumb {
  width: 64px;
  height: 64px;
  overflow: hidden;
  background: #f3f4f6;
  border-radius: 8px;
}

.xq-list-thumb :deep(.ant-image),
.xq-list-thumb :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-list-body {
  min-width: 0;
}

.xq-list-top {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: space-between;
}

.xq-list-sku {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.xq-list-tag {
  flex-shrink: 0;
  margin: 0;
}

.xq-list-title {
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #374151;
  white-space: nowrap;
}

.xq-list-meta {
  margin-top: 2px;
  font-size: 11px;
  color: #9ca3af;
}

.xq-list-pager {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.xq-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: calc(100vh - 220px);
  padding: 16px;
  overflow: auto;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
}

.xq-detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
}

.xq-detail-head {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 16px;
}

.xq-detail-cover {
  position: relative;
  width: 160px;
  height: 160px;
  overflow: hidden;
  background: #f8fafc;
  border-radius: 10px;
}

.xq-detail-cover :deep(.ant-image),
.xq-detail-cover :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-detail-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  margin: 0;
}

.xq-detail-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.xq-info-row {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px;
  align-items: start;
  font-size: 13px;
}

.xq-label {
  color: #6b7280;
}

.xq-info-text {
  color: #111827;
  overflow-wrap: anywhere;
}

.xq-detail-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.xq-edit-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.xq-field-label {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.xq-muted {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: #9ca3af;
}

.xq-points-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.xq-prompt-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.xq-prompt-card {
  display: grid;
  grid-template-columns: 108px 1fr;
  gap: 12px;
  align-items: start;
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #eee;
  border-radius: 10px;
}

.xq-prompt-thumb {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #e5e7eb;
  border-radius: 8px;
}

.xq-prompt-thumb :deep(.ant-image),
.xq-prompt-thumb :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-prompt-body {
  min-width: 0;
}

.xq-prompt-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.xq-marker {
  font-size: 12px;
  color: #4b5563;
}

.xq-prompt-text {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #374151;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.xq-source-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 8px;
}

.xq-source-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f3f4f6;
  border-radius: 8px;
}

.xq-source-item :deep(.ant-image),
.xq-source-item :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-source-idx {
  position: absolute;
  right: 4px;
  bottom: 4px;
  padding: 0 6px;
  font-size: 11px;
  color: #fff;
  background: rgb(0 0 0 / 55%);
  border-radius: 999px;
}

.xq-assign-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.xq-assign-form label {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

@media (max-width: 960px) {
  .xq-split {
    grid-template-columns: 1fr;
  }

  .xq-list {
    max-height: 280px;
  }

  .xq-detail {
    max-height: none;
  }

  .xq-detail-head {
    grid-template-columns: 120px 1fr;
  }
}
</style>
