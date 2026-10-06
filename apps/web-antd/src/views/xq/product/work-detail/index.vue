<script lang="ts" setup>
import type { XqListingApi } from '#/api/xq/listing';
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Empty,
  Image,
  Input,
  InputNumber,
  Select,
  Spin,
  Tag,
  TreeSelect,
} from 'ant-design-vue';

import {
  getXqCategoryFieldTemplate,
  getXqListingCategories,
  getXqListingShops,
} from '#/api/xq/listing';
import { getXqWorkOrder, updateXqWorkOrder } from '#/api/xq/work-order';
import { useDeskPlatformId } from '#/views/xq/desk/use-desk-scope';
import {
  isListingImageField,
  resolveListingFieldZone,
} from '#/views/xq/product/listing-field-zone';

defineOptions({ name: 'XqDeskTaskDetail' });

const FEATURE_COUNT = 5;
const LANGS = [
  { key: 'en', label: '英文' },
  { key: 'zh', label: '中文' },
];

const router = useRouter();
const route = useRoute();
const lockedPlatformId = useDeskPlatformId();

const loading = ref(false);
const saving = ref(false);
const parent = ref<null | XqWorkOrderApi.WorkOrder>(null);
const navKey = ref<'attr' | 'basic' | 'copy' | 'plus' | 'variant'>('basic');
const langKey = ref('en');

const listingShopId = ref<string | undefined>();
const listingCategoryId = ref<string | undefined>();
const listingCountryCode = ref<string | undefined>();
const listingShops = ref<XqListingApi.Shop[]>([]);
const listingCategories = ref<XqListingApi.CategoryNode[]>([]);
const categoryTemplate = ref<null | XqListingApi.CategoryFieldTemplate>(null);

const form = reactive({
  contentTitle: '',
  originalTitle: '',
  keywords: '',
  sellingPoints: Array.from({ length: FEATURE_COUNT }, () => ''),
  description: '',
  remark: '',
  brand: '',
  asin: '',
  sku: '',
  qty: undefined as number | undefined,
  cost: undefined as number | undefined,
  price: undefined as number | undefined,
  sourceUrl: '',
  purchaseUrl: '',
  color: '',
  size: '',
});

const COUNTRY_OPTIONS = [
  { value: 'US', label: '美国 US' },
  { value: 'CA', label: '加拿大 CA' },
  { value: 'GB', label: '英国 GB' },
  { value: 'DE', label: '德国 DE' },
  { value: 'FR', label: '法国 FR' },
  { value: 'IT', label: '意大利 IT' },
  { value: 'JP', label: '日本 JP' },
  { value: 'AU', label: '澳大利亚 AU' },
];

function asId(v?: null | number | string) {
  const s = String(v ?? '').trim();
  return s || undefined;
}

const workId = computed(() => {
  const n = Number(route.query.id);
  return Number.isFinite(n) && n > 0 ? n : undefined;
});

const variants = computed(() => {
  const row = parent.value;
  if (!row) return [] as XqWorkOrderApi.WorkOrder[];
  const kids = row.variants || [];
  return kids.length > 0
    ? [row, ...kids.filter((v) => v.id !== row.id)]
    : [row];
});

function parseUrls(raw?: string) {
  if (!raw) return [] as string[];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      return arr.map((u) => String(u || '').trim()).filter(Boolean);
    }
  } catch {
    // ignore
  }
  return String(raw)
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function imagesOf(row?: null | XqWorkOrderApi.WorkOrder) {
  if (!row) return [] as string[];
  const urls: string[] = [];
  const push = (u?: string) => {
    const s = String(u || '').trim();
    if (s && !urls.includes(s)) urls.push(s);
  };
  push(row.generatedImageUrl);
  push(row.coverUrl);
  for (const u of parseUrls(row.sourceImageUrls)) push(u);
  try {
    const prompts = row.imagePromptJson ? JSON.parse(row.imagePromptJson) : [];
    if (Array.isArray(prompts)) {
      for (const p of prompts) {
        push(p?.resultUrl || p?.generatedImageUrl || p?.imageUrl);
      }
    }
  } catch {
    // ignore
  }
  return urls;
}

const gallery = computed(() => imagesOf(parent.value));

function parseSellingPoints(raw?: string) {
  const lines = String(raw || '')
    .split(/\r?\n+/)
    .map((l) => l.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter(Boolean);
  return Array.from({ length: FEATURE_COUNT }, (_, i) => lines[i] || '');
}

function parseListingValues(row?: null | XqWorkOrderApi.WorkOrder) {
  if (!row?.listingValuesJson) return {} as Record<string, any>;
  try {
    const obj = JSON.parse(row.listingValuesJson);
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

function parseCopyJson(row?: null | XqWorkOrderApi.WorkOrder) {
  if (!row?.copyResultJson) return {} as Record<string, any>;
  try {
    const obj = JSON.parse(row.copyResultJson);
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

const listingValues = computed(() => parseListingValues(parent.value));

const marketPrices = computed(() => {
  const v = listingValues.value;
  const raw = v.marketPrices || v.prices || v.countryPrices;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((r: any, i: number) => ({
      no: i + 1,
      country: r.country || r.countryName || r.name || '—',
      price: r.price ?? r.salePrice ?? '',
    }));
  }
  const row = parent.value;
  if (row?.price !== null && row?.price !== undefined) {
    return [
      {
        no: 1,
        country: row.listingCountryName || listingCountryCode.value || '—',
        price: row.price,
      },
    ];
  }
  return [];
});

function fillForm(row: XqWorkOrderApi.WorkOrder) {
  const copy = parseCopyJson(row);
  const vals = parseListingValues(row);
  form.contentTitle = row.contentTitle || copy.title || row.title || '';
  form.originalTitle = String(copy.originalTitle || row.title || '');
  form.keywords = String(copy.keywords || vals.keywords || '');
  form.sellingPoints = parseSellingPoints(
    row.contentSellingPoints ||
      (Array.isArray(copy.features) ? copy.features.join('\n') : ''),
  );
  form.description = String(copy.description || '').trim();
  form.remark = String(vals.remark || row.sourceDescription || '');
  form.brand = String(vals.brand || vals.Brand || '');
  form.asin = String(vals.asin || vals.ASIN || '');
  form.sku = row.externalSku || row.productSku || '';
  form.qty = row.qtyAvailable;
  form.cost = Number(vals.cost) || undefined;
  form.price = row.price;
  form.sourceUrl = String(vals.sourceUrl || vals.amazonUrl || '');
  form.purchaseUrl = String(vals.purchaseUrl || vals.offerUrl || '');
  form.color = row.mainColor || row.variantLabel || String(vals.color || '');
  const sizeText = vals.size;
  form.size = sizeText ? String(sizeText) : '—';
  listingShopId.value = asId(row.listingShopId);
  listingCategoryId.value = asId(row.listingCategoryId);
  listingCountryCode.value = asId(row.listingCountryCode);
}

async function loadDetail() {
  if (!workId.value) {
    parent.value = null;
    return;
  }
  loading.value = true;
  try {
    const row = await getXqWorkOrder(workId.value);
    const root =
      row?.parentWorkOrderId && row.parentWorkOrderId !== row.id
        ? (await getXqWorkOrder(row.parentWorkOrderId)) || row
        : row;
    parent.value = root;
    if (root) fillForm(root);
  } catch {
    parent.value = null;
  } finally {
    loading.value = false;
  }
}

function mapCategoryTree(nodes: XqListingApi.CategoryNode[] = []): any[] {
  return nodes.map((n) => ({
    title: n.name,
    value: asId(n.id),
    key: asId(n.id),
    children: n.children?.length ? mapCategoryTree(n.children) : undefined,
  }));
}

function findCategoryName(
  nodes: XqListingApi.CategoryNode[],
  id?: string,
): string {
  const target = asId(id);
  if (!target) return '';
  for (const n of nodes) {
    if (asId(n.id) === target) return n.name;
    const hit = findCategoryName(n.children || [], target);
    if (hit) return hit;
  }
  return '';
}

const categoryTreeData = computed(() =>
  mapCategoryTree(listingCategories.value),
);
const shopOptions = computed(() =>
  listingShops.value.map((s) => ({
    label: s.name || s.code || String(s.id),
    value: asId(s.id)!,
  })),
);

const platformId = computed(
  () =>
    asId(lockedPlatformId.value) || asId(parent.value?.listingPlatformId) || '',
);

const attrFields = computed(() => {
  const fields = categoryTemplate.value?.fields || [];
  return fields.filter((f) => {
    if (isListingImageField(f)) return false;
    const zone = resolveListingFieldZone(f);
    return zone === 'attr' || zone === 'product' || !zone;
  });
});

function attrValue(f: XqListingApi.CategoryField) {
  const vals = listingValues.value;
  if (
    vals[f.code!] !== null &&
    vals[f.code!] !== undefined &&
    vals[f.code!] !== ''
  )
    return String(vals[f.code!]);
  const h = `${f.label || ''} ${f.code || ''}`.toLowerCase();
  const row = parent.value;
  if (!row) return '';
  if (/upc|gtin/.test(h)) return row.upc || '';
  if (/sku|item code/.test(h)) return row.externalSku || '';
  if (/color/.test(h)) return row.mainColor || '';
  if (/qty|stock|库存/.test(h))
    return row.qtyAvailable === null || row.qtyAvailable === undefined
      ? ''
      : String(row.qtyAvailable);
  if (/brand/.test(h)) return form.brand;
  if (/asin/.test(h)) return form.asin;
  return f.defaultValue || '';
}

async function loadListingMeta(pid?: string, categoryId?: string) {
  if (!pid) return;
  try {
    listingShops.value = (await getXqListingShops(pid)) || [];
  } catch {
    listingShops.value = [];
  }
  try {
    listingCategories.value = (await getXqListingCategories(pid)) || [];
  } catch {
    listingCategories.value = [];
  }
  if (categoryId) {
    try {
      categoryTemplate.value = await getXqCategoryFieldTemplate(categoryId);
    } catch {
      categoryTemplate.value = null;
    }
  }
}

watch(
  [platformId, listingCategoryId],
  ([pid, cid]) => {
    loadListingMeta(pid, cid);
  },
  { immediate: true },
);

watch(workId, () => {
  loadDetail();
});

function goBack() {
  const parentPath = route.path.replace(/\/detail$/, '/list');
  router.push({
    path: parentPath,
    query: { platformId: lockedPlatformId.value || undefined },
  });
}

function openUrl(url?: string) {
  const u = String(url || '').trim();
  if (!u) return;
  window.open(u, '_blank');
}

async function saveAll() {
  const row = parent.value;
  if (!row?.id) return;
  const points = form.sellingPoints.map((p) => p.trim()).filter(Boolean);
  const sellingText = points
    .map((p) => (p.startsWith('•') ? p : `• ${p}`))
    .join('\n');
  const shop = listingShops.value.find(
    (s) => asId(s.id) === asId(listingShopId.value),
  );
  saving.value = true;
  try {
    const nextValues = {
      ...parseListingValues(row),
      brand: form.brand,
      asin: form.asin,
      keywords: form.keywords,
      remark: form.remark,
      cost: form.cost,
      sourceUrl: form.sourceUrl,
      purchaseUrl: form.purchaseUrl,
      color: form.color,
      size: form.size,
    };
    const nextCopy = {
      ...parseCopyJson(row),
      title: form.contentTitle.trim(),
      originalTitle: form.originalTitle.trim(),
      keywords: form.keywords.trim(),
      description: form.description.trim(),
      features: points,
    };
    await updateXqWorkOrder({
      id: row.id,
      contentTitle: form.contentTitle.trim(),
      contentSellingPoints: sellingText,
      contentDescription: form.description.trim(),
      copyResultJson: JSON.stringify(nextCopy),
      listingValuesJson: JSON.stringify(nextValues),
      listingShopId: listingShopId.value || '',
      listingShopName: shop?.name || row.listingShopName || '',
      listingCategoryId: listingCategoryId.value || '',
      listingCategoryName:
        findCategoryName(listingCategories.value, listingCategoryId.value) ||
        row.listingCategoryName ||
        '',
      listingCountryCode: listingCountryCode.value || '',
      listingCountryName:
        COUNTRY_OPTIONS.find((c) => c.value === listingCountryCode.value)
          ?.label ||
        row.listingCountryName ||
        '',
    });
    await loadDetail();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadDetail();
});
</script>

<template>
  <Page auto-content-height>
    <div class="xq-detail">
      <aside class="xq-nav">
        <button
          type="button"
          class="xq-nav-item"
          :class="{ active: navKey === 'basic' }"
          @click="navKey = 'basic'"
        >
          基本信息
        </button>
        <button
          type="button"
          class="xq-nav-item"
          :class="{ active: navKey === 'variant' }"
          @click="navKey = 'variant'"
        >
          变体信息
        </button>
        <button
          type="button"
          class="xq-nav-item"
          :class="{ active: navKey === 'copy' }"
          @click="navKey = 'copy'"
        >
          文案信息
        </button>
        <button
          type="button"
          class="xq-nav-item"
          :class="{ active: navKey === 'attr' }"
          @click="navKey = 'attr'"
        >
          其他属性
        </button>
        <button
          type="button"
          class="xq-nav-item"
          :class="{ active: navKey === 'plus' }"
          @click="navKey = 'plus'"
        >
          A+ 内容
        </button>
      </aside>

      <section class="xq-main">
        <div class="xq-head">
          <Button @click="goBack">返回列表</Button>
          <div class="xq-head-title">
            {{ parent?.title || parent?.contentTitle || '产品详情' }}
          </div>
          <Button
            type="primary"
            :loading="saving"
            :disabled="!parent"
            @click="saveAll"
          >
            保存
          </Button>
        </div>

        <Spin :spinning="loading">
          <Empty v-if="!parent && !loading" description="未找到产品" />

          <div v-else-if="parent" class="xq-body">
            <div v-show="navKey === 'basic'" class="xq-panel">
              <div class="xq-block-title">主题图</div>
              <div v-if="gallery.length" class="xq-gallery">
                <div
                  v-for="(url, i) in gallery"
                  :key="`${url}-${i}`"
                  class="xq-thumb"
                >
                  <Image :src="url" :width="88" :height="88" />
                </div>
              </div>
              <Empty
                v-else
                description="暂无图片"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
              />

              <div class="xq-block-title">金额及体积相关</div>
              <div class="xq-grid">
                <label>品牌名称</label>
                <Input v-model:value="form.brand" placeholder="品牌" />
                <label>ASIN</label>
                <Input v-model:value="form.asin" placeholder="ASIN" />
                <label>库存</label>
                <InputNumber v-model:value="form.qty" class="xq-full" />
                <label>SKU</label>
                <Input v-model:value="form.sku" />
                <label>成本</label>
                <InputNumber v-model:value="form.cost" class="xq-full" />
                <label>售价</label>
                <InputNumber v-model:value="form.price" class="xq-full" />
                <label>店铺</label>
                <Select
                  v-model:value="listingShopId"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  :options="shopOptions"
                  placeholder="店铺"
                />
                <label>分类</label>
                <TreeSelect
                  v-model:value="listingCategoryId"
                  allow-clear
                  show-search
                  tree-default-expand-all
                  :tree-data="categoryTreeData"
                  placeholder="分类"
                />
                <label>国家</label>
                <Select
                  v-model:value="listingCountryCode"
                  allow-clear
                  :options="COUNTRY_OPTIONS"
                  placeholder="国家"
                />
                <label>颜色</label>
                <Input v-model:value="form.color" />
                <label>尺寸</label>
                <Input v-model:value="form.size" />
                <label>来源网址</label>
                <div class="xq-url-row">
                  <Input
                    v-model:value="form.sourceUrl"
                    placeholder="https://"
                  />
                  <Button
                    :disabled="!form.sourceUrl"
                    @click="openUrl(form.sourceUrl)"
                  >
                    打开
                  </Button>
                </div>
                <label>采购网址</label>
                <Input
                  v-model:value="form.purchaseUrl"
                  placeholder="1688 / 采购链接"
                />
              </div>

              <div class="xq-block-title">站点售价</div>
              <table v-if="marketPrices.length" class="xq-price-table">
                <thead>
                  <tr>
                    <th>编号</th>
                    <th>国家</th>
                    <th>售价</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in marketPrices" :key="row.no">
                    <td>{{ row.no }}</td>
                    <td>{{ row.country }}</td>
                    <td>{{ row.price }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="xq-muted">暂无站点售价</div>
            </div>

            <div v-show="navKey === 'variant'" class="xq-panel">
              <div class="xq-variant-head">
                变体类型 colorSize
                <Tag>{{ variants.length }}</Tag>
              </div>
              <div
                v-for="(sku, idx) in variants"
                :key="sku.id || idx"
                class="xq-sku-card"
              >
                <div class="xq-sku-meta">
                  <b>SKU_{{ idx + 1 }}</b>
                  <span>{{ sku.externalSku || sku.productSku || '—' }}</span>
                  <span>颜色
                    {{
                      sku.mainColor || sku.variantLabel || form.color || '—'
                    }}</span>
                  <span>库存 {{ sku.qtyAvailable ?? form.qty ?? '—' }}</span>
                  <span>价格 {{ sku.price ?? form.price ?? '—' }}</span>
                </div>
                <div class="xq-gallery compact">
                  <div
                    v-for="(url, i) in imagesOf(sku)"
                    :key="`${sku.id}-${i}`"
                    class="xq-thumb"
                  >
                    <Image :src="url" :width="88" :height="88" />
                  </div>
                  <div v-if="!imagesOf(sku).length" class="xq-muted">
                    该变体暂无图片
                  </div>
                </div>
              </div>
            </div>

            <div v-show="navKey === 'copy'" class="xq-panel">
              <div class="xq-langs">
                <button
                  v-for="lang in LANGS"
                  :key="lang.key"
                  type="button"
                  class="xq-lang"
                  :class="{ active: langKey === lang.key }"
                  @click="langKey = lang.key"
                >
                  {{ lang.label }}
                </button>
              </div>
              <label class="xq-field">
                <span>标题</span>
                <Input v-model:value="form.contentTitle" />
              </label>
              <label class="xq-field">
                <span>原标题</span>
                <Input v-model:value="form.originalTitle" />
              </label>
              <label class="xq-field">
                <span>商品亮点</span>
                <Input.TextArea
                  :value="form.sellingPoints.filter(Boolean).join('\n')"
                  :rows="2"
                  readonly
                />
              </label>
              <label class="xq-field">
                <span>关键词</span>
                <Input v-model:value="form.keywords" />
              </label>
              <div class="xq-field">
                <span>五行</span>
                <Input
                  v-for="(_, i) in form.sellingPoints"
                  :key="i"
                  v-model:value="form.sellingPoints[i]"
                  class="xq-bullet"
                  :placeholder="`卖点 ${i + 1}`"
                />
              </div>
              <label class="xq-field">
                <span>长描述</span>
                <Input.TextArea v-model:value="form.description" :rows="10" />
              </label>
            </div>

            <div v-show="navKey === 'attr'" class="xq-panel">
              <div v-if="attrFields.length" class="xq-attr-grid">
                <div v-for="f in attrFields" :key="f.code" class="xq-attr">
                  <span>{{ f.label || f.code }}</span>
                  <Input :value="attrValue(f)" disabled />
                </div>
              </div>
              <Empty v-else description="暂无其他属性，请先选择分类模板" />
            </div>

            <div v-show="navKey === 'plus'" class="xq-panel">
              <Empty description="A+ 内容暂未接入" />
            </div>
          </div>
        </Spin>
      </section>
    </div>
  </Page>
</template>

<style scoped>
.xq-detail {
  display: flex;
  height: 100%;
  min-height: 0;
  background: #fff;
}

.xq-nav {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 128px;
  padding: 12px 8px;
  border-right: 1px solid #f0f0f0;
}

.xq-nav-item {
  padding: 10px 12px;
  margin-bottom: 4px;
  font-size: 13px;
  color: #4b5563;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;
}

.xq-nav-item.active {
  font-weight: 600;
  color: #1677ff;
  background: #e6f4ff;
}

.xq-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding: 12px 16px 20px;
  overflow: auto;
}

.xq-head {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.xq-head-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.xq-block-title {
  margin: 8px 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.xq-panel {
  min-width: 0;
}

.xq-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.xq-gallery.compact {
  margin-bottom: 0;
}

.xq-thumb {
  flex: 0 0 88px;
  width: 88px;
  height: 88px;
  overflow: hidden;
  background: #f5f6f8;
  border: 1px solid #eee;
  border-radius: 6px;
}

.xq-thumb :deep(.ant-image) {
  display: block;
  width: 88px !important;
  height: 88px !important;
}

.xq-thumb :deep(.ant-image-img),
.xq-thumb :deep(img) {
  width: 88px !important;
  max-width: 88px !important;
  height: 88px !important;
  max-height: 88px !important;
  object-fit: cover;
}

.xq-grid {
  display: grid;
  grid-template-columns: 88px minmax(160px, 1fr) 88px minmax(160px, 1fr);
  gap: 10px 12px;
  align-items: center;
  margin-bottom: 16px;
}

.xq-grid label {
  font-size: 13px;
  color: #6b7280;
  text-align: right;
}

.xq-full {
  width: 100%;
}

.xq-url-row {
  display: flex;
  gap: 8px;
}

.xq-price-table {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}

.xq-price-table th,
.xq-price-table td {
  padding: 8px 10px;
  text-align: left;
  border: 1px solid #f0f0f0;
}

.xq-price-table th {
  background: #fafafa;
}

.xq-muted {
  font-size: 13px;
  color: #9ca3af;
}

.xq-variant-head {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
}

.xq-sku-card {
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #eef0f3;
  border-radius: 8px;
}

.xq-sku-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 10px;
  font-size: 13px;
}

.xq-langs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 14px;
}

.xq-lang {
  padding: 4px 10px;
  font-size: 13px;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
}

.xq-lang.active {
  font-weight: 600;
  color: #1677ff;
  border-bottom-color: #1677ff;
}

.xq-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 13px;
}

.xq-field > span {
  color: #6b7280;
}

.xq-bullet + .xq-bullet {
  margin-top: 6px;
}

.xq-attr-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.xq-attr {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
</style>
