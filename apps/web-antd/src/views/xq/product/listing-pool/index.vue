<script lang="ts" setup>
import type { XqListingApi } from '#/api/xq/listing';
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  Button,
  Empty,
  Image,
  Input,
  message,
  Pagination,
  Select,
  Spin,
  Tag,
} from 'ant-design-vue';

import {
  getXqCategoryFieldTemplate,
  getXqListingCategories,
  getXqListingShops,
} from '#/api/xq/listing';
import {
  confirmXqWorkOrderListing,
  getXqWorkOrderPage,
  listXqWorkOrder,
} from '#/api/xq/work-order';
import { useDeskPlatformId } from '#/views/xq/desk/use-desk-scope';
import {
  isListingImageField,
  LISTING_FIELD_ZONE_OPTIONS,
  resolveListingFieldZone,
} from '#/views/xq/product/listing-field-zone';

defineOptions({ name: 'XqListingPool' });

type ListingTab = 'listed' | 'pending';

const userStore = useUserStore();
const lockedPlatformId = useDeskPlatformId();
const shopId = ref<string | undefined>();
const shops = ref<{ label: string; value: string }[]>([]);
const myUserId = computed(() => {
  const info = userStore.userInfo as null | Record<string, any>;
  return Number(info?.userId || info?.id || 0) || undefined;
});

const loading = ref(false);
const listing = ref(false);
const templateLoading = ref(false);
const keyword = ref('');
const listingTab = ref<ListingTab>('pending');
const tasks = ref<XqWorkOrderApi.WorkOrder[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const activeId = ref<number | undefined>();
const queryParams = reactive({ keyword: '' as string | undefined });
const categoryTemplate = ref<null | XqListingApi.CategoryFieldTemplate>(null);
const fieldValues = ref<Record<string, string>>({});
const listingCategories = ref<XqListingApi.CategoryNode[]>([]);

const activeTask = computed(() => findTask(activeId.value));
const fields = computed(() => categoryTemplate.value?.fields || []);
const zonedFieldGroups = computed(() => {
  const groups = LISTING_FIELD_ZONE_OPTIONS.map((z) => ({
    ...z,
    fields: [] as XqListingApi.CategoryField[],
  }));
  const other = groups.find((g) => g.value === 'other');
  for (const f of fields.value) {
    if (isListingImageField(f)) continue;
    const zone = resolveListingFieldZone(f) || 'other';
    const hit = groups.find((g) => g.value === zone) || other;
    hit?.fields.push(f);
  }
  return { groups };
});
const isListed = computed(
  () => listingTab.value === 'listed' || activeTask.value?.status === 20,
);

function findTask(id?: number): null | XqWorkOrderApi.WorkOrder {
  if (!id) return null;
  return tasks.value.find((t) => t.id === id) || null;
}

function coverOf(row: XqWorkOrderApi.WorkOrder) {
  return row.generatedImageUrl || row.coverUrl || undefined;
}

function parseCopy(row: XqWorkOrderApi.WorkOrder) {
  try {
    return row.copyResultJson ? JSON.parse(row.copyResultJson) : {};
  } catch {
    return {};
  }
}

function sellingPoints(row: XqWorkOrderApi.WorkOrder) {
  return String(row.contentSellingPoints || '')
    .split(/\r?\n+/)
    .map((l) => l.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter(Boolean);
}

function imageUrls(row: XqWorkOrderApi.WorkOrder) {
  const urls: string[] = [];
  const push = (u?: string) => {
    const v = String(u || '').trim();
    if (v && !urls.includes(v)) urls.push(v);
  };
  push(row.generatedImageUrl);
  try {
    const prompts = row.imagePromptJson ? JSON.parse(row.imagePromptJson) : [];
    if (Array.isArray(prompts)) {
      for (const p of prompts) push(p?.resultUrl || p?.generatedImageUrl);
    }
  } catch {
    // ignore
  }
  return urls;
}

function resolveSource(src: string, row: XqWorkOrderApi.WorkOrder) {
  const copy = parseCopy(row);
  const points = sellingPoints(row);
  const imgs = imageUrls(row);
  const map: Record<string, string> = {
    erp_sku: row.productSku || row.externalSku || '',
    upc: row.upc || '',
    ai_title: row.contentTitle || '',
    ai_description: String(copy.description || ''),
    ai_style: row.variantLabel || '',
    giga_sku: row.externalSku || '',
    product_name: row.title || '',
    color: row.mainColor || '',
    inventory: String(row.qtyAvailable ?? ''),
    price_dropship:
      row.price === null || row.price === undefined ? '' : String(row.price),
    product_length:
      row.lengthCm === null || row.lengthCm === undefined
        ? ''
        : String(row.lengthCm),
    product_width:
      row.widthCm === null || row.widthCm === undefined
        ? ''
        : String(row.widthCm),
    product_height:
      row.heightCm === null || row.heightCm === undefined
        ? ''
        : String(row.heightCm),
  };
  for (let i = 1; i <= 8; i++) {
    map[`ai_bullet_${i}`] = points[i - 1] || '';
  }
  map.ai_image_main = imgs[0] || '';
  for (let i = 1; i <= 9; i++) {
    map[`ai_image_${i}`] = imgs[i] || '';
  }
  return map[src] || '';
}

function fillValues(
  row: XqWorkOrderApi.WorkOrder,
  tplFields: XqListingApi.CategoryField[],
) {
  let saved: Record<string, string>;
  try {
    saved = row.listingValuesJson ? JSON.parse(row.listingValuesJson) : {};
  } catch {
    saved = {};
  }
  const next: Record<string, string> = {};
  for (const f of tplFields) {
    const fromSaved = saved[f.code];
    if (fromSaved) {
      next[f.code] = fromSaved;
      continue;
    }
    if (f.valueSource) {
      next[f.code] = resolveSource(f.valueSource, row) || f.defaultValue || '';
      continue;
    }
    next[f.code] = f.defaultValue || '';
  }
  fieldValues.value = next;
}

async function loadTemplate(row: XqWorkOrderApi.WorkOrder) {
  const cid = row.listingCategoryId;
  if (!cid) {
    categoryTemplate.value = null;
    fieldValues.value = {};
    return;
  }
  templateLoading.value = true;
  try {
    if (row.listingPlatformId && listingCategories.value.length === 0) {
      listingCategories.value =
        (await getXqListingCategories(row.listingPlatformId)) || [];
    }
    const tpl = await getXqCategoryFieldTemplate(cid);
    categoryTemplate.value = tpl;
    fillValues(row, tpl?.fields || []);
  } catch (error: any) {
    categoryTemplate.value = null;
    message.error(error?.message || '加载类目模板失败');
  } finally {
    templateLoading.value = false;
  }
}

function selectTask(row: XqWorkOrderApi.WorkOrder) {
  activeId.value = row.id;
  loadTemplate(row);
}

async function loadTasks() {
  if (!lockedPlatformId.value && !myUserId.value) {
    message.warning('未获取到当前用户，请重新登录');
    return;
  }
  loading.value = true;
  try {
    const res = await getXqWorkOrderPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      keyword: queryParams.keyword || undefined,
      status: listingTab.value === 'listed' ? 20 : 10,
      listingReady: listingTab.value === 'pending' ? true : undefined,
      listingPlatformId: lockedPlatformId.value || undefined,
      listingShopId: shopId.value,
      mineImageUserId: lockedPlatformId.value ? undefined : myUserId.value,
    });
    tasks.value = res?.list || [];
    total.value = Number(res?.total || 0);
    if (activeId.value && !findTask(activeId.value)) activeId.value = undefined;
    if (!activeId.value && tasks.value[0]?.id) selectTask(tasks.value[0]!);
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

async function submitListing(mode: 'api' | 'export') {
  const row = activeTask.value;
  if (!row?.id) return;
  if (!row.listingCategoryId) {
    message.warning('请先在文案侧选择上架类目');
    return;
  }
  listing.value = true;
  try {
    await listXqWorkOrder({
      id: row.id,
      listingMode: mode,
      productSku: row.externalSku || undefined,
      productName: row.contentTitle || row.title || undefined,
      values: { ...fieldValues.value },
    });
    if (mode === 'export') {
      message.success('导表成功，请确认是否已上架');
    } else {
      message.success('API 上架成功');
      listingTab.value = 'listed';
    }
    pageNo.value = 1;
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '上架失败');
  } finally {
    listing.value = false;
  }
}

async function confirmExportListed() {
  const row = activeTask.value;
  if (!row?.id) return;
  listing.value = true;
  try {
    await confirmXqWorkOrderListing(row.id);
    message.success('已确认上架');
    listingTab.value = 'listed';
    pageNo.value = 1;
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '确认失败');
  } finally {
    listing.value = false;
  }
}

const exportPendingConfirm = computed(
  () => activeTask.value?.listingStatus === 'export_pending_confirm',
);

watch(activeId, () => {
  const row = activeTask.value;
  if (row) loadTemplate(row);
});

async function loadShops() {
  if (!lockedPlatformId.value) {
    shops.value = [];
    return;
  }
  try {
    const list = (await getXqListingShops(lockedPlatformId.value)) || [];
    shops.value = list.map((s) => ({ label: s.name, value: s.id }));
    if (shops.value.length === 1) shopId.value = shops.value[0]!.value;
  } catch {
    shops.value = [];
  }
}

watch(lockedPlatformId, async () => {
  shopId.value = undefined;
  await loadShops();
  handleSearch();
});

onMounted(async () => {
  await loadShops();
  await loadTasks();
});
</script>

<template>
  <Page auto-content-height>
    <div class="xq-copy-pool">
      <div class="xq-toolbar">
        <div class="xq-title-block">
          <h2>上架</h2>
          <p>
            {{
              lockedPlatformId
                ? '本平台工作台：店铺已按绑店锁定。待上架提交，已上架回看。'
                : '待上架核对模板后提交；已上架可回看字段快照。'
            }}
          </p>
        </div>
        <Select
          v-if="lockedPlatformId"
          v-model:value="shopId"
          allow-clear
          placeholder="绑定店铺"
          style="width: 200px"
          :options="shops"
          @change="handleSearch"
        />
        <Input.Search
          v-model:value="keyword"
          allow-clear
          class="xq-search"
          placeholder="搜索任务号 / Item Code / 标题"
          enter-button="搜索"
          @search="handleSearch"
        />
        <div class="xq-status-tabs">
          <Button
            size="small"
            :type="listingTab === 'pending' ? 'primary' : 'default'"
            @click="
              listingTab = 'pending';
              handleSearch();
            "
          >
            待上架
          </Button>
          <Button
            size="small"
            :type="listingTab === 'listed' ? 'primary' : 'default'"
            @click="
              listingTab = 'listed';
              handleSearch();
            "
          >
            已上架
          </Button>
        </div>
        <template v-if="activeTask && !isListed">
          <Button
            v-if="exportPendingConfirm"
            type="primary"
            :loading="listing"
            @click="confirmExportListed"
          >
            确认已上架
          </Button>
          <template v-else>
            <Button :loading="listing" @click="submitListing('export')">
              导表上架
            </Button>
            <Button
              type="primary"
              :loading="listing"
              @click="submitListing('api')"
            >
              API 上架
            </Button>
          </template>
        </template>
      </div>

      <Spin :spinning="loading">
        <div v-if="tasks.length" class="xq-split">
          <aside class="xq-list">
            <div
              v-for="row in tasks"
              :key="row.id"
              class="xq-list-item"
              :class="{ active: activeId === row.id }"
              role="button"
              tabindex="0"
              @click="selectTask(row)"
            >
              <div></div>
              <div class="xq-list-thumb">
                <Image :src="coverOf(row)" :preview="false" />
              </div>
              <div class="xq-list-body">
                <div class="xq-list-top">
                  <span class="xq-list-sku">{{ row.externalSku || '—' }}</span>
                  <Tag
                    :color="
                      isListed
                        ? 'success'
                        : row.listingStatus === 'export_pending_confirm'
                          ? 'warning'
                          : 'processing'
                    "
                  >
                    {{
                      isListed
                        ? '已上架'
                        : row.listingStatus === 'export_pending_confirm'
                          ? '导表待确认'
                          : '待上架'
                    }}
                  </Tag>
                </div>
                <div class="xq-list-title">
                  {{ row.contentTitle || row.title || '未命名' }}
                </div>
                <div class="xq-list-meta">
                  {{
                    [row.listingPlatformName, row.listingCategoryName]
                      .filter(Boolean)
                      .join(' / ') || row.no
                  }}
                </div>
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

          <section v-if="activeTask" class="xq-detail">
            <div class="xq-detail-head">
              <div class="xq-detail-cover">
                <Image :src="coverOf(activeTask)" :preview="true" />
              </div>
              <div>
                <div class="xq-info-row">
                  <span class="xq-label">Item Code</span>
                  <b>{{ activeTask.externalSku || '—' }}</b>
                </div>
                <div class="xq-info-row">
                  <span class="xq-label">上架</span>
                  <span class="xq-info-text">
                    {{
                      [
                        activeTask.listingPlatformName,
                        activeTask.listingShopName,
                        activeTask.listingCategoryName,
                      ]
                        .filter(Boolean)
                        .join(' / ') || '未选类目'
                    }}
                  </span>
                </div>
                <div class="xq-detail-actions">
                  <template v-if="!isListed">
                    <Button
                      v-if="exportPendingConfirm"
                      type="primary"
                      :loading="listing"
                      @click="confirmExportListed"
                    >
                      确认已上架
                    </Button>
                    <template v-else>
                      <Button
                        :loading="listing"
                        @click="submitListing('export')"
                      >
                        导表上架
                      </Button>
                      <Button
                        type="primary"
                        :loading="listing"
                        @click="submitListing('api')"
                      >
                        API 上架
                      </Button>
                    </template>
                  </template>
                  <Tag v-else color="success">已上架</Tag>
                </div>
              </div>
            </div>

            <Spin :spinning="templateLoading">
              <div v-if="fields.length" class="xq-edit-block">
                <label class="xq-field-label">
                  类目模板字段（{{ fields.length }}）
                </label>
                <template v-for="g in zonedFieldGroups.groups" :key="g.value">
                  <div v-if="g.fields.length" class="xq-zone-block">
                    <div class="xq-zone-title">
                      {{ g.label }}
                      <span>{{ g.fields.length }}</span>
                    </div>
                    <div
                      v-for="f in g.fields"
                      :key="f.code"
                      class="xq-list-field"
                    >
                      <div class="xq-list-field-h">
                        <em>{{ f.label || f.code }}</em>
                        <Tag v-if="f.required" color="red">必填</Tag>
                        <span v-if="f.valueSource" class="xq-map">{{
                          f.valueSource
                        }}</span>
                      </div>
                      <Input.TextArea
                        v-if="(f.type || '').toUpperCase().includes('LONG')"
                        v-model:value="fieldValues[f.code]"
                        :rows="3"
                        :readonly="isListed"
                        :placeholder="f.defaultValue || f.label"
                      />
                      <Input
                        v-else
                        v-model:value="fieldValues[f.code]"
                        :readonly="isListed"
                        :placeholder="f.defaultValue || f.label"
                      />
                    </div>
                  </div>
                </template>
              </div>
              <Empty
                v-else
                description="没有类目模板。请先在「我的文案」选择上架类目。"
              />
            </Spin>
          </section>
          <Empty v-else description="请选择左侧任务" />
        </div>
        <Empty
          v-else
          :description="
            listingTab === 'listed'
              ? '暂无已上架产品'
              : '暂无待上架产品（图片需已出图或已完成）'
          "
        />
      </Spin>
    </div>
  </Page>
</template>

<style scoped src="../_pool.css"></style>
<style scoped>
.xq-list-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.xq-zone-title {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 12px 0 4px;
  font-size: 13px;
  font-weight: 700;
}

.xq-zone-title span {
  font-size: 12px;
  font-weight: 400;
  color: #9ca3af;
}

.xq-list-field-h {
  display: flex;
  gap: 8px;
  align-items: center;
}

.xq-list-field-h em {
  font-style: normal;
  font-weight: 600;
}

.xq-map {
  font-size: 12px;
  color: #9ca3af;
}
</style>
