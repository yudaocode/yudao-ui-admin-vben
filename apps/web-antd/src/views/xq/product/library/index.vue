<script lang="ts" setup>
import type { XqListingApi } from '#/api/xq/listing';
import type { XqProductApi } from '#/api/xq/product';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

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

import { getXqListingPlatforms, getXqListingShops } from '#/api/xq/listing';
import {
  getXqCategoryTree,
  getXqProduct,
  getXqProductPage,
} from '#/api/xq/product';
import { dispatchXqWorkOrder } from '#/api/xq/work-order';

const router = useRouter();

const loading = ref(false);
const catLoading = ref(false);
const catOpen = ref(false);
const keyword = ref('');
const categoryTree = ref<XqProductApi.CategoryNode[]>([]);
/** 面板内浏览态（展开 hover 用，不直接筛产品） */
const browseL1 = ref<null | XqProductApi.CategoryNode>(null);
const browseL2 = ref<null | XqProductApi.CategoryNode>(null);
/** 已确认筛选 */
const filterL1 = ref<null | XqProductApi.CategoryNode>(null);
const filterL2 = ref<null | XqProductApi.CategoryNode>(null);
const filterL3 = ref<null | XqProductApi.CategoryNode>(null);

const products = ref<XqProductApi.Product[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);

const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<null | XqProductApi.Product>(null);
const selectedVariantSku = ref('');
const galleryIndex = ref(0);
/** 勾选待下发：key = sku/itemCode */
const selectedMap = ref<Record<string, XqProductApi.Product>>({});
const dispatching = ref(false);
const dispatchOpen = ref(false);
const dispatchExtra = ref<null | XqProductApi.Product>(null);

const platforms = ref<XqListingApi.Platform[]>([]);
const shops = ref<XqListingApi.Shop[]>([]);
const listingPlatformId = ref<string | undefined>();
const listingShopId = ref<string | undefined>();
const listingLoading = ref(false);

const selectedList = computed(() => Object.values(selectedMap.value));
const selectedCount = computed(() => selectedList.value.length);

const pageSelectable = computed(() =>
  products.value.filter((p) => Boolean(productKey(p))),
);
const pageSelectedCount = computed(
  () => pageSelectable.value.filter((p) => isSelected(p)).length,
);
const pageAllSelected = computed(
  () =>
    pageSelectable.value.length > 0 &&
    pageSelectedCount.value === pageSelectable.value.length,
);
const pageIndeterminate = computed(
  () =>
    pageSelectedCount.value > 0 &&
    pageSelectedCount.value < pageSelectable.value.length,
);

const platformOptions = computed(() =>
  platforms.value.map((p) => ({ label: p.name, value: p.id })),
);
const shopOptions = computed(() =>
  shops.value.map((s) => ({ label: s.name, value: s.id })),
);

function productKey(item: XqProductApi.Product) {
  return item.itemCode || item.sku || String(item.id || '');
}

function isSelected(item: XqProductApi.Product) {
  const key = productKey(item);
  return Boolean(key && selectedMap.value[key]);
}

function toggleSelect(item: XqProductApi.Product, checked?: boolean) {
  const key = productKey(item);
  if (!key) return;
  const on = checked === undefined ? !selectedMap.value[key] : checked;
  selectedMap.value = on
    ? { ...selectedMap.value, [key]: item }
    : Object.fromEntries(
        Object.entries(selectedMap.value).filter(([k]) => k !== key),
      );
}

function clearSelection() {
  selectedMap.value = {};
}

function toggleSelectPage(checked: boolean) {
  if (checked) {
    const next = { ...selectedMap.value };
    for (const item of pageSelectable.value) {
      const key = productKey(item);
      if (key) next[key] = item;
    }
    selectedMap.value = next;
    return;
  }
  const removeKeys = new Set(
    pageSelectable.value.map((item) => productKey(item)).filter(Boolean),
  );
  selectedMap.value = Object.fromEntries(
    Object.entries(selectedMap.value).filter(([k]) => !removeKeys.has(k)),
  );
}

async function ensureListingPlatforms() {
  if (platforms.value.length > 0) return;
  platforms.value = (await getXqListingPlatforms()) || [];
}

async function onListingPlatformChange(id?: string) {
  listingPlatformId.value = id;
  listingShopId.value = undefined;
  shops.value = [];
  if (!id) return;
  listingLoading.value = true;
  try {
    const shopRes = await getXqListingShops(id).catch((error: any) => {
      message.error(error?.message || '加载店铺失败（原库）');
      return [] as XqListingApi.Shop[];
    });
    shops.value = shopRes || [];
    if (shops.value.length === 1) {
      listingShopId.value = shops.value[0]!.id;
    }
  } finally {
    listingLoading.value = false;
  }
}

async function openDispatchModal(extra?: XqProductApi.Product) {
  const map = { ...selectedMap.value };
  if (extra) {
    const key = productKey(extra);
    if (key) map[key] = extra;
  }
  if (Object.keys(map).length === 0) {
    message.warning('请先勾选要跑的产品');
    return;
  }
  dispatchExtra.value = extra || null;
  try {
    await ensureListingPlatforms();
  } catch (error: any) {
    message.error(error?.message || '加载平台失败');
    return;
  }
  dispatchOpen.value = true;
}

async function confirmDispatch() {
  if (!listingPlatformId.value) {
    message.warning('请选择上架平台');
    return;
  }
  const map = { ...selectedMap.value };
  if (dispatchExtra.value) {
    const key = productKey(dispatchExtra.value);
    if (key) map[key] = dispatchExtra.value;
  }
  const items = Object.values(map).map((p) => ({
    productId: p.id ? String(p.id) : undefined,
    sku: productKey(p),
    title: p.name || productKey(p),
    coverUrl: p.imageUrl,
    categoryName: p.categoryName,
    gigaCategoryId: p.gigaCategoryId,
  }));
  if (items.length === 0) {
    message.warning('请先勾选要跑的产品');
    return;
  }
  const platformName = platforms.value.find(
    (p) => p.id === listingPlatformId.value,
  )?.name;
  const shopName = shops.value.find((s) => s.id === listingShopId.value)?.name;
  dispatching.value = true;
  try {
    const list = await dispatchXqWorkOrder({
      listingPlatformId: listingPlatformId.value,
      listingShopId: listingShopId.value || undefined,
      listingPlatformName: platformName,
      listingShopName: shopName,
      items,
    });
    message.success(`已下发 ${list?.length ?? items.length} 个任务到工作台`);
    clearSelection();
    dispatchOpen.value = false;
    detailOpen.value = false;
    await router.push('/xq-product/workspace/work-order');
  } catch (error: any) {
    const msg = error?.message || '下发失败';
    message.error(
      /该平台已有|已有进行中|已上架/.test(msg)
        ? `${msg}（可在任务列表关闭后重试）`
        : msg,
    );
  } finally {
    dispatching.value = false;
  }
}

const l2List = computed(() => browseL1.value?.children || []);
const l3List = computed(() => browseL2.value?.children || []);

const categoryLabel = computed(() => {
  const parts = [
    filterL1.value?.name,
    filterL2.value?.name,
    filterL3.value?.name,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : 'Categories 类别';
});

const filterCategoryId = computed(() => {
  return (
    filterL3.value?.id || filterL2.value?.id || filterL1.value?.id || undefined
  );
});

const queryParams = reactive({
  name: '' as string | undefined,
  gigaCategoryId: undefined as number | undefined,
});

function selectL1(item: XqProductApi.CategoryNode) {
  browseL1.value = item;
  browseL2.value = item.children?.[0] || null;
}

function selectL2(item: XqProductApi.CategoryNode) {
  browseL2.value = item;
}

function selectL3(item: XqProductApi.CategoryNode) {
  filterL1.value = browseL1.value;
  filterL2.value = browseL2.value;
  filterL3.value = item;
  catOpen.value = false;
}

function clearCategory() {
  filterL1.value = null;
  filterL2.value = null;
  filterL3.value = null;
}

function toggleCategoryPanel() {
  catOpen.value = !catOpen.value;
  if (catOpen.value && !browseL1.value && categoryTree.value.length > 0) {
    selectL1(categoryTree.value[0]!);
  }
}

async function loadCategories() {
  catLoading.value = true;
  try {
    categoryTree.value = (await getXqCategoryTree()) || [];
  } catch (error: any) {
    message.error(error?.message || '类目加载失败');
  } finally {
    catLoading.value = false;
  }
}

async function loadProducts() {
  loading.value = true;
  try {
    const res = await getXqProductPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      name: queryParams.name || undefined,
      gigaCategoryId: queryParams.gigaCategoryId,
    });
    products.value = res?.list || [];
    total.value = Number(res?.total || 0);
  } catch (error: any) {
    message.error(error?.message || '产品加载失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.name = keyword.value.trim() || undefined;
  pageNo.value = 1;
  loadProducts();
}

watch(filterCategoryId, (id) => {
  queryParams.gigaCategoryId = id;
  pageNo.value = 1;
  loadProducts();
});

const familyBar = ref<XqProductApi.Variant[]>([]);

async function openDetail(item: XqProductApi.Product) {
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = item;
  selectedVariantSku.value = item.sku;
  galleryIndex.value = 0;
  familyBar.value = [];
  try {
    if (item.id) {
      await loadDetailSku(item.id, item);
    } else {
      familyBar.value = buildFamily(item);
    }
  } finally {
    detailLoading.value = false;
  }
}

async function loadDetailSku(id: string, fallback?: XqProductApi.Product) {
  const loaded = await getXqProduct(id);
  const prev = fallback?.variants || detail.value?.variants || [];
  if ((!loaded.variants || loaded.variants.length === 0) && prev.length > 0) {
    loaded.variants = prev.filter((v) => isCollectedVariant(v, loaded.sku));
  }
  detail.value = loaded;
  selectedVariantSku.value = loaded?.sku || fallback?.sku || '';
  galleryIndex.value = 0;
  familyBar.value = mergeFamily(familyBar.value, loaded);
}

function toFamilyItem(
  p: XqProductApi.Product | XqProductApi.Variant,
): XqProductApi.Variant {
  return {
    id: p.id,
    sku: p.sku,
    itemCode: p.itemCode,
    name: variantChipLabel(p),
    imageUrl: p.imageUrl,
    mainColor: p.mainColor,
    qtyAvailable: p.qtyAvailable,
    price: p.price,
    discountedPrice: p.discountedPrice,
  };
}

function variantChipLabel(
  v: Pick<XqProductApi.Variant, 'mainColor' | 'name' | 'sku'>,
): string {
  const color = cleanChipText(v.mainColor);
  if (color) return color;
  const name = cleanChipText(v.name);
  if (name) return name;
  return v.sku || '';
}

function cleanChipText(raw?: null | string): string {
  const s = String(raw ?? '').trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') {
    return '';
  }
  return s;
}

function isCollectedVariant(
  v: XqProductApi.Variant,
  currentSku?: string,
): boolean {
  if (!v?.sku) return false;
  if (currentSku && v.sku === currentSku) return true;
  return Boolean(v.id);
}

function buildFamily(p: XqProductApi.Product): XqProductApi.Variant[] {
  const map = new Map<string, XqProductApi.Variant>();
  map.set(p.sku, toFamilyItem(p));
  for (const v of p.variants || []) {
    if (!v.sku || map.has(v.sku) || !isCollectedVariant(v, p.sku)) continue;
    map.set(v.sku, v);
  }
  return [...map.values()];
}

function mergeFamily(
  prev: XqProductApi.Variant[],
  loaded: XqProductApi.Product,
): XqProductApi.Variant[] {
  const currentSku = loaded.sku;
  const map = new Map<string, XqProductApi.Variant>();
  for (const v of prev) {
    if (v.sku && isCollectedVariant(v, currentSku)) map.set(v.sku, v);
  }
  for (const v of buildFamily(loaded)) {
    map.set(v.sku, v);
  }
  return [...map.values()];
}

const selectedVariant = computed(
  () =>
    familyBar.value.find((v) => v.sku === selectedVariantSku.value) ||
    familyBar.value[0],
);

const displayGallery = computed(() => {
  const d = detail.value;
  if (!d) return [] as string[];
  return detailGallery(d);
});

const displayImage = computed(
  () => displayGallery.value[galleryIndex.value] || displayGallery.value[0],
);

const detailSpecRows = computed(() => {
  const d = detail.value;
  if (!d) return [] as { label: string; value: string }[];
  const rows: { label: string; value: string }[] = [];
  const push = (label: string, value?: null | number | string) => {
    const text = formatSpecValue(value);
    if (text) rows.push({ label, value: text });
  };
  push('SKU', d.sku);
  push('Item Code', d.itemCode);
  push('UPC', d.upc);
  push('品牌', d.brandName);
  push('类目', d.categoryName);
  push('颜色', d.mainColor);
  push('材质', d.mainMaterial);
  push('产地', d.placeOfOrigin);
  push(
    '包装尺寸（in）',
    formatDim(d.lengthIn, d.widthIn, d.heightIn, d.lengthUnit || 'in'),
  );
  push('包装尺寸（cm）', formatDim(d.lengthCm, d.widthCm, d.heightCm, 'cm'));
  push('重量', formatWeight(d.weight, d.weightUnit, d.weightKg));
  push(
    '组装尺寸',
    formatDim(
      d.assembledLength,
      d.assembledWidth,
      d.assembledHeight,
      d.assembledLengthUnit || 'in',
    ),
  );
  push(
    '组装重量',
    d.assembledWeight
      ? `${formatSpecValue(d.assembledWeight)} ${d.assembledWeightUnit || ''}`.trim()
      : '',
  );
  const attrs = parseAttributes(d.attributesJson);
  for (const [label, value] of attrs) {
    if (rows.some((r) => r.label === label || r.value === value)) continue;
    push(label, value);
  }
  if (
    d.characteristics &&
    d.characteristics !== d.description &&
    !d.characteristics.includes('<')
  ) {
    push('特点', d.characteristics);
  }
  return rows;
});

async function selectAssociate(v: XqProductApi.Variant) {
  if (!v?.sku || v.sku === detail.value?.sku) return;
  if (!v.id) {
    selectedVariantSku.value = v.sku;
    return;
  }
  detailLoading.value = true;
  try {
    await loadDetailSku(v.id);
  } finally {
    detailLoading.value = false;
  }
}

function formatMoney(value?: null | number) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }
  const n = Number(value);
  // 业务上 0 视为无价
  if (n <= 0) return null;
  return n.toFixed(2);
}

function formatSpecValue(value?: null | number | string) {
  if (value === null || value === undefined) return '';
  const s = String(value).trim();
  if (!s || s.toLowerCase() === 'null' || s === '0' || s === '0.00') return '';
  return s;
}

function formatDim(
  l?: null | number,
  w?: null | number,
  h?: null | number,
  unit?: string,
) {
  const parts = [l, w, h].map((n) => formatSpecValue(n)).filter(Boolean);
  if (parts.length === 0) return '';
  return `${parts.join(' × ')} ${unit || ''}`.trim();
}

function formatWeight(
  weight?: null | number,
  unit?: string,
  kg?: null | number,
) {
  const w = formatSpecValue(weight);
  const k = formatSpecValue(kg);
  if (w && k) return `${w} ${unit || 'lb'} / ${k} kg`;
  if (w) return `${w} ${unit || ''}`.trim();
  if (k) return `${k} kg`;
  return '';
}

function parseAttributes(raw?: string) {
  const out: [string, string][] = [];
  if (!raw) return out;
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return out;
    for (const [k, v] of Object.entries(obj)) {
      const val = formatSpecValue(v as string);
      if (k && val) out.push([k, val]);
    }
  } catch {
    // ignore
  }
  return out;
}

function imgBadgeText(item: XqProductApi.Product) {
  const n = item.variants?.length || 0;
  if (n > 0) return `${n + 1} 款`;
  const imgs = item.imageCount || item.imageUrls?.length || 0;
  if (imgs > 1) return `${imgs} imgs`;
  return item.listedTag || '';
}

function detailGallery(item: null | XqProductApi.Product) {
  if (!item) return [];
  const urls = [...(item.imageUrls || [])];
  if (item.imageUrl && !urls.includes(item.imageUrl)) {
    urls.unshift(item.imageUrl);
  }
  return urls;
}

function onPageChange(page: number, size: number) {
  pageNo.value = page;
  pageSize.value = size;
  loadProducts();
}

onMounted(async () => {
  await loadCategories();
  await loadProducts();
});
</script>

<template>
  <Page auto-content-height>
    <div class="xq-library">
      <div class="xq-toolbar">
        <button
          class="xq-cat-trigger"
          type="button"
          :class="{ open: catOpen }"
          @click="toggleCategoryPanel"
        >
          <IconifyIcon icon="lucide:menu" class="xq-cat-trigger-icon" />
          <span class="xq-cat-trigger-text">{{ categoryLabel }}</span>
          <IconifyIcon
            :icon="catOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'"
            class="xq-cat-trigger-arrow"
          />
        </button>
        <button
          v-if="filterL1 || filterL2 || filterL3"
          class="xq-cat-clear"
          type="button"
          @click="clearCategory"
        >
          清除筛选
        </button>
        <Input.Search
          v-model:value="keyword"
          allow-clear
          class="xq-search-input"
          placeholder="搜索 SKU / Item Code / 名称"
          enter-button="搜索"
          @search="handleSearch"
        />
        <label class="xq-select-all">
          <Checkbox
            :checked="pageAllSelected"
            :indeterminate="pageIndeterminate"
            :disabled="pageSelectable.length === 0"
            @change="(e: any) => toggleSelectPage(Boolean(e?.target?.checked))"
          />
          <span>全选本页</span>
        </label>
        <Button
          type="primary"
          :disabled="selectedCount === 0"
          :loading="dispatching"
          @click="openDispatchModal()"
        >
          下发工作台{{ selectedCount ? ` (${selectedCount})` : '' }}
        </Button>
        <Button v-if="selectedCount" @click="clearSelection">清空选择</Button>
      </div>

      <!-- Giga 三列级联分类：默认收起 -->
      <div v-show="catOpen" class="xq-cat-panel">
        <Spin :spinning="catLoading">
          <div v-if="categoryTree.length" class="category-cascader">
            <div class="col col-l1">
              <div
                v-for="item in categoryTree"
                :key="`l1-${item.id}`"
                class="l1-item"
                :class="{ active: browseL1?.id === item.id }"
                @mouseenter="selectL1(item)"
                @click="selectL1(item)"
              >
                <span class="name">{{ item.name }}</span>
                <span class="arrow">›</span>
              </div>
            </div>

            <div class="col col-l2">
              <div
                v-for="item in l2List"
                :key="`l2-${item.id}-${item.pathIds}`"
                class="l2-item"
                :class="{
                  active:
                    browseL2?.id === item.id &&
                    browseL2?.pathIds === item.pathIds,
                }"
                @mouseenter="selectL2(item)"
                @click="selectL2(item)"
              >
                <span
                  class="name"
                  :class="{ bold: browseL2?.id === item.id }"
                  >{{ item.name }}</span>
                <span v-if="item.children?.length" class="arrow">›</span>
              </div>
              <Empty
                v-if="!l2List.length"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
                description="暂无二级类目"
              />
            </div>

            <div class="col col-l3">
              <div class="l3-title">{{ browseL2?.name || '—' }}</div>
              <div v-if="l3List.length" class="l3-grid">
                <button
                  v-for="item in l3List"
                  :key="`l3-${item.id}-${item.pathIds}`"
                  class="l3-card"
                  :class="{ active: filterL3?.id === item.id }"
                  type="button"
                  @click="selectL3(item)"
                >
                  <div class="l3-avatar">
                    <img
                      v-if="item.imagePath"
                      :src="item.imagePath"
                      :alt="item.name"
                      loading="lazy"
                    />
                    <span v-else class="l3-fallback">{{
                      item.name?.slice(0, 1) || '?'
                    }}</span>
                  </div>
                  <div class="l3-name">{{ item.name }}</div>
                </button>
              </div>
              <Empty
                v-else
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
                description="暂无三级类目"
              />
            </div>
          </div>
          <Empty v-else-if="!catLoading" description="暂无类目数据" />
        </Spin>
      </div>

      <div class="xq-section-title">
        选品库
        <span class="xq-path">· 勾选后下发到工作台做文案 / 图片 / 上架</span>
        <span v-if="filterL1" class="xq-path">
          ·
          {{
            [filterL1?.name, filterL2?.name, filterL3?.name]
              .filter(Boolean)
              .join(' / ')
          }}
        </span>
      </div>

      <Spin :spinning="loading">
        <div v-if="products.length" class="xq-product-grid">
          <div
            v-for="item in products"
            :key="item.id"
            class="xq-product-card"
            :class="{ selected: isSelected(item) }"
            @click="openDetail(item)"
          >
            <div
              class="xq-card-check"
              @click.stop="toggleSelect(item, !isSelected(item))"
            >
              <Checkbox :checked="isSelected(item)" />
            </div>
            <div class="xq-card-cover">
              <Image
                :src="item.imageUrl || undefined"
                :preview="false"
                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' fill='%239ca3af' text-anchor='middle' dy='.3em' font-size='18'%3ENo Image%3C/text%3E%3C/svg%3E"
              />
              <span v-if="imgBadgeText(item)" class="xq-img-badge">{{
                imgBadgeText(item)
              }}</span>
            </div>
            <div class="xq-card-body">
              <div class="xq-item-code">
                Item Code:
                <b>{{ item.itemCode || item.sku }}</b>
              </div>
              <div class="xq-price-block">
                <div class="xq-price-line">
                  <span class="xq-price-label">原价</span>
                  <span v-if="formatMoney(item.price)" class="xq-price-main">
                    ${{ formatMoney(item.price) }}
                  </span>
                  <span v-else class="xq-price-muted">—</span>
                </div>
                <div class="xq-price-line">
                  <span class="xq-price-label">折扣价</span>
                  <span
                    v-if="formatMoney(item.discountedPrice)"
                    class="xq-price-sale"
                  >
                    ${{ formatMoney(item.discountedPrice) }}
                  </span>
                  <span v-else class="xq-price-muted">—</span>
                </div>
              </div>
              <div class="xq-qty">
                Qty Available
                <span>{{ item.qtyAvailable ?? '---' }}</span>
              </div>
              <Tag v-if="item.listedTag" color="orange" class="xq-listed-tag">
                {{ item.listedTag }}
              </Tag>
              <div class="xq-supplier">
                <span>{{ item.supplierCode || '—' }}</span>
                <span class="xq-supplier-name">{{
                  item.supplierName || item.categoryName || ''
                }}</span>
              </div>
              <div v-if="item.variants?.length" class="xq-assoc">
                同品 {{ item.variants.length + 1 }} 个 SKU
                <span
                  v-for="v in item.variants.slice(0, 4)"
                  :key="v.sku"
                  class="xq-assoc-tag"
                  :title="v.sku"
                >
                  {{ variantChipLabel(v) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <Empty v-else description="暂无产品" class="xq-empty" />
      </Spin>

      <div v-if="total > 0" class="xq-pager">
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
      :title="detail?.name || '产品详情'"
      width="1080px"
      destroy-on-close
      class="xq-detail-modal"
      ok-text="下发工作台"
      :confirm-loading="dispatching"
      @ok="detail && openDispatchModal(detail)"
    >
      <Spin :spinning="detailLoading">
        <div v-if="detail" class="xq-shop">
          <div class="xq-shop-media">
            <div v-if="displayGallery.length" class="xq-shop-thumbs">
              <button
                v-for="(url, idx) in displayGallery.slice(0, 12)"
                :key="`g-${idx}`"
                type="button"
                class="xq-shop-thumb"
                :class="{ active: galleryIndex === idx }"
                @click="galleryIndex = idx"
              >
                <img :src="url" alt="" />
              </button>
            </div>
            <div class="xq-shop-main">
              <Image
                :src="displayImage || detail.imageUrl || undefined"
                :preview="true"
                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3C/svg%3E"
              />
            </div>
          </div>

          <div class="xq-shop-buy">
            <h3 class="xq-shop-title">{{ detail.name }}</h3>
            <div class="xq-shop-price">
              <strong
                v-if="
                  formatMoney(
                    selectedVariant?.discountedPrice || detail.discountedPrice,
                  )
                "
              >
                ${{
                  formatMoney(
                    selectedVariant?.discountedPrice || detail.discountedPrice,
                  )
                }}
              </strong>
              <strong
                v-else-if="formatMoney(selectedVariant?.price || detail.price)"
              >
                ${{ formatMoney(selectedVariant?.price || detail.price) }}
              </strong>
              <strong v-else>—</strong>
              <s
                v-if="
                  formatMoney(detail.price) &&
                  formatMoney(detail.discountedPrice)
                "
              >
                ${{ formatMoney(detail.price) }}
              </s>
              <span
                v-if="formatMoney(detail.exclusivePrice)"
                class="xq-exclusive"
              >
                专享 ${{ formatMoney(detail.exclusivePrice) }}
              </span>
            </div>
            <div class="xq-shop-meta">
              <span>Item Code
                {{
                  selectedVariant?.itemCode || detail.itemCode || detail.sku
                }}</span>
              <span>库存
                {{
                  selectedVariant?.qtyAvailable ?? detail.qtyAvailable ?? '—'
                }}</span>
            </div>

            <div v-if="familyBar.length > 1" class="xq-shop-spec">
              <div class="xq-spec-label">同品 SKU</div>
              <p class="xq-spec-hint">
                独立货号，各有自己的图/价/库存（非一条详情里的变体字段）
              </p>
              <div class="xq-spec-list">
                <button
                  v-for="v in familyBar"
                  :key="v.sku"
                  type="button"
                  class="xq-spec-item"
                  :class="{ active: detail.sku === v.sku }"
                  :title="`${v.sku} ${v.name || ''}`"
                  @click="selectAssociate(v)"
                >
                  <img v-if="v.imageUrl" :src="v.imageUrl" alt="" />
                  <span>{{ variantChipLabel(v) }}</span>
                </button>
              </div>
            </div>
          </div>

          <div v-if="detailSpecRows.length" class="xq-shop-copy">
            <div class="xq-copy-title">规格参数</div>
            <dl class="xq-spec-table">
              <template v-for="row in detailSpecRows" :key="row.label">
                <dt>{{ row.label }}</dt>
                <dd>{{ row.value }}</dd>
              </template>
            </dl>
          </div>

          <div v-if="detail.description" class="xq-shop-copy">
            <div class="xq-copy-title">产品详情</div>
            <div class="xq-copy-body" v-html="detail.description"></div>
          </div>
        </div>
      </Spin>
    </Modal>

    <Modal
      v-model:open="dispatchOpen"
      title="选择上架平台 / 店铺"
      ok-text="确认下发"
      :confirm-loading="dispatching"
      destroy-on-close
      @ok="confirmDispatch"
    >
      <p class="xq-dispatch-hint">
        勾选时会把 associateProductList 里的同品 SKU 一并下发到工作台。
      </p>
      <Spin :spinning="listingLoading">
        <div class="xq-dispatch-form">
          <label>上架平台（原库）</label>
          <Select
            v-model:value="listingPlatformId"
            allow-clear
            show-search
            option-filter-prop="label"
            placeholder="从原库选择平台"
            :options="platformOptions"
            @change="(v: any) => onListingPlatformChange(v)"
          />
          <label>上架店铺（原库 sys_store）</label>
          <Select
            v-model:value="listingShopId"
            allow-clear
            show-search
            option-filter-prop="label"
            :placeholder="
              listingPlatformId
                ? shopOptions.length
                  ? '选择店铺'
                  : '该平台在店铺管理中暂无店铺'
                : '请先选平台'
            "
            :options="shopOptions"
            :disabled="!listingPlatformId"
          />
        </div>
      </Spin>
    </Modal>
  </Page>
</template>

<style scoped>
.xq-library {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  padding: 4px 2px 16px;
}

.xq-dispatch-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7280;
}

.xq-dispatch-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.xq-dispatch-form label {
  margin-top: 4px;
  font-size: 13px;
  color: #374151;
}

.xq-search-bar {
  max-width: 720px;
}

.xq-search-input {
  width: 100%;
}

.xq-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.xq-select-all {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

.xq-cat-trigger {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  max-width: 360px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #121212;
  cursor: pointer;
  background: #111;
  border: 0;
  border-radius: 6px;
}

.xq-cat-trigger.open {
  background: #333;
}

.xq-cat-trigger-icon,
.xq-cat-trigger-arrow {
  flex: none;
  color: #fff;
}

.xq-cat-trigger-text {
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
  white-space: nowrap;
}

.xq-cat-clear {
  padding: 8px 12px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.xq-toolbar .xq-search-input {
  flex: 1;
  min-width: 220px;
  max-width: 480px;
}

.xq-cat-panel {
  margin-top: -4px;
}

.category-cascader {
  display: grid;
  grid-template-columns: 240px 260px 1fr;
  min-height: 420px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}

.col {
  max-height: 520px;
  overflow: auto;
}

.col-l1 {
  padding: 12px 0;
  background: #fafafa;
  border-right: 1px solid #eee;
}

.col-l2 {
  padding: 12px 0;
  background: #fff;
  border-right: 1px solid #eee;
}

.col-l3 {
  padding: 16px 20px 24px;
}

.l1-item,
.l2-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  font-size: 14px;
  color: #121212;
  cursor: pointer;
}

.l1-item:hover,
.l2-item:hover,
.l1-item.active,
.l2-item.active {
  background: #f0f0f0;
}

.l2-item .name.bold {
  font-weight: 700;
}

.arrow {
  font-size: 16px;
  line-height: 1;
  color: #999;
}

.l3-title {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 700;
  color: #121212;
}

.l3-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px 16px;
}

.l3-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  color: #121212;
  text-align: center;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.l3-card:hover .l3-name,
.l3-card.active .l3-name {
  color: #004bd8;
}

.l3-card.active .l3-avatar {
  box-shadow: 0 0 0 2px #004bd8;
}

.l3-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: 8px;
  overflow: hidden;
  background: #f3f3f3;
  border-radius: 40px;
}

.l3-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.l3-fallback {
  font-size: 22px;
  color: #999;
}

.l3-name {
  max-width: 140px;
  font-size: 13px;
  line-height: 1.35;
}

.xq-section-title {
  margin-top: 4px;
  font-size: 16px;
  font-weight: 700;
  color: #121212;
}

.xq-path {
  font-size: 13px;
  font-weight: 400;
  color: #666;
}

.xq-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.xq-product-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease,
    border-color 0.15s ease;
}

.xq-product-card:hover {
  box-shadow: 0 8px 24px rgb(0 0 0 / 8%);
  transform: translateY(-2px);
}

.xq-product-card.selected {
  border-color: #1677ff;
  box-shadow: 0 6px 18px rgb(22 119 255 / 12%);
}

.xq-card-check {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  padding: 2px 4px;
  line-height: 1;
  background: rgb(255 255 255 / 92%);
  border-radius: 6px;
}

.xq-card-cover {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f8fafc;
}

.xq-card-cover :deep(.ant-image) {
  width: 100%;
  height: 100%;
}

.xq-card-cover :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-img-badge {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 2px 8px;
  font-size: 11px;
  color: #fff;
  background: rgb(0 0 0 / 45%);
  border-radius: 999px;
}

.xq-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
}

.xq-item-code {
  font-size: 13px;
  color: #111;
}

.xq-price-row {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #111;
}

.xq-price-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.xq-price-line {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 13px;
}

.xq-price-label {
  width: 42px;
  font-size: 12px;
  color: #9ca3af;
}

.xq-price-main {
  font-weight: 600;
  color: #111;
}

.xq-price-sale {
  font-weight: 700;
  color: #dc2626;
}

.xq-price-muted {
  color: #9ca3af;
}

.xq-lock {
  font-size: 12px;
  color: #9ca3af;
}

.xq-qty {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.xq-listed-tag {
  align-self: flex-start;
  margin: 0;
}

.xq-supplier {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.xq-supplier-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.xq-assoc {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  margin-top: 6px;
  font-size: 11px;
  color: #6b7280;
}

.xq-assoc-tag {
  max-width: 120px;
  padding: 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #374151;
  white-space: nowrap;
  background: #f3f4f6;
  border-radius: 4px;
}

.xq-shop {
  display: grid;
  grid-template-columns: 460px 1fr;
  gap: 20px;
}

.xq-shop-media {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 8px;
  align-items: start;
}

.xq-shop-thumbs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 420px;
  overflow: auto;
}

.xq-shop-thumb {
  width: 64px;
  height: 64px;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
}

.xq-shop-thumb.active {
  border-color: #ff6a00;
}

.xq-shop-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-shop-main {
  overflow: hidden;
  background: #f8fafc;
  border-radius: 6px;
}

.xq-shop-main :deep(.ant-image),
.xq-shop-main :deep(img) {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  background: #fff;
}

.xq-shop-buy {
  min-width: 0;
}

.xq-shop-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: #111;
}

.xq-shop-price {
  display: flex;
  gap: 10px;
  align-items: baseline;
  padding: 10px 12px;
  margin-bottom: 14px;
  background: #fff7f2;
}

.xq-shop-price strong {
  font-size: 28px;
  font-weight: 700;
  color: #ff5000;
}

.xq-shop-price s {
  font-size: 13px;
  color: #9ca3af;
}

.xq-shop-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #6b7280;
}

.xq-shop-spec {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.xq-spec-label {
  font-size: 13px;
  color: #6b7280;
}

.xq-spec-hint {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}

.xq-spec-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.xq-spec-item {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  max-width: 100%;
  padding: 4px 8px 4px 4px;
  font-size: 12px;
  color: #111;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.xq-spec-item.active {
  border-color: #ff6a00;
}

.xq-spec-item img {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 2px;
}

.xq-spec-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.xq-shop-copy {
  grid-column: 1 / -1;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.xq-copy-title {
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 700;
}

.xq-copy-body {
  max-height: 360px;
  overflow: auto;
  font-size: 13px;
  line-height: 1.6;
  color: #333;
}

.xq-copy-body :deep(img) {
  max-width: 100%;
  height: auto;
}

.xq-spec-table {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0;
  margin: 0;
}

.xq-spec-table dt,
.xq-spec-table dd {
  padding: 8px 12px;
  font-size: 13px;
  border-bottom: 1px solid #f3f4f6;
}

.xq-spec-table dt {
  color: #6b7280;
  background: #fafafa;
}

.xq-spec-table dd {
  margin: 0;
  color: #111827;
  overflow-wrap: anywhere;
}

.xq-exclusive {
  margin-left: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #b45309;
}

.xq-pager {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

.xq-empty {
  padding: 48px 0;
}

@media (max-width: 1100px) {
  .category-cascader {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .col {
    max-height: none;
    border-right: 0;
    border-bottom: 1px solid #eee;
  }

  .l3-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .xq-shop,
  .xq-shop-media {
    grid-template-columns: 1fr;
  }

  .xq-shop-thumbs {
    flex-direction: row;
    max-height: none;
  }
}
</style>
