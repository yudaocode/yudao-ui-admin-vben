<script lang="ts" setup>
import type { XqListingApi, XqWorkbenchPlatform } from '#/api/xq/listing';
import type { XqProductApi } from '#/api/xq/product';
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { computed, onMounted, reactive, ref, watch } from 'vue';

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
  Tooltip,
  TreeSelect,
} from 'ant-design-vue';

import { getXqListingCategories, getXqWorkbenchScope } from '#/api/xq/listing';
import {
  getXqCategoryTree,
  getXqProduct,
  getXqProductPage,
} from '#/api/xq/product';
import {
  dispatchXqWorkOrder,
  lookupXqWorkOrderReuseCandidates,
} from '#/api/xq/work-order';

const loading = ref(false);
const catLoading = ref(false);
const catOpen = ref(false);
const keyword = ref('');
/** 筛选：本平台 */
const filterPlatformId = ref<string | undefined>();
/** 筛出本平台已选取的商品 */
const excludePicked = ref(false);
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

/** 当前用户工作台可见平台（含绑定店铺） */
const scopePlatforms = ref<XqWorkbenchPlatform[]>([]);
const listingPlatformIds = ref<string[]>([]);
const listingShopIds = ref<string[]>([]);
/** platformId → categoryId */
const listingCategoryByPlatform = ref<Record<string, string | undefined>>({});
/** platformId → 类目树 */
const categoryTreeByPlatform = ref<Record<string, XqListingApi.CategoryNode[]>>(
  {},
);
const listingLoading = ref(false);
const reuseLoading = ref(false);
const reuseGroups = ref<XqWorkOrderApi.ReuseSkuGroup[]>([]);
/** SKU → 复用文案任务 ID */
const reuseCopyMap = ref<Record<string, number | undefined>>({});
/** SKU → 复用图片任务 ID */
const reuseImageMap = ref<Record<string, number | undefined>>({});

const selectedList = computed(() => Object.values(selectedMap.value));
const selectedCount = computed(() => selectedList.value.length);

const pageSelectable = computed(() =>
  products.value.filter((p) => Boolean(productKey(p)) && canSelect(p)),
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
  scopePlatforms.value.map((p) => ({ label: p.name, value: p.id })),
);
const shopOptions = computed(() => {
  const set = new Set(listingPlatformIds.value);
  const out: Array<{ label: string; value: string }> = [];
  for (const p of scopePlatforms.value) {
    if (!set.has(p.id)) continue;
    for (const s of p.shops || []) {
      out.push({
        label: `${p.name} / ${s.name}`,
        value: s.id,
      });
    }
  }
  return out;
});
const selectedScopePlatforms = computed(() => {
  const set = new Set(listingPlatformIds.value);
  return scopePlatforms.value.filter((p) => set.has(p.id));
});

/** 排除即将下发的目标平台后，展示其它平台可复用内容 */
const visibleReuseGroups = computed(() => {
  const exclude = new Set(listingPlatformIds.value);
  return reuseGroups.value
    .map((g) => ({
      ...g,
      candidates: (g.candidates || []).filter(
        (c) => !exclude.has(String(c.listingPlatformId || '')),
      ),
    }))
    .filter((g) => (g.candidates || []).length > 0);
});

function cleanText(v?: null | number | string) {
  const s = String(v ?? '').trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') {
    return '';
  }
  return s;
}

function productKey(item: XqProductApi.Product) {
  return (
    cleanText(item.itemCode) || cleanText(item.sku) || String(item.id || '')
  );
}

function productCodeLabel(item: XqProductApi.Product) {
  return cleanText(item.itemCode) || cleanText(item.sku) || '—';
}

function isSelected(item: XqProductApi.Product) {
  const key = productKey(item);
  return Boolean(key && selectedMap.value[key]);
}

function pickedPlatformIds(item?: null | XqProductApi.Product) {
  return new Set(
    (item?.pickedPlatforms || []).map((p) => String(p.id)).filter(Boolean),
  );
}

/** 卡片上平台已选：只显示首字母，悬停看全名 */
function pickedPlatformAbbr(p: XqProductApi.PickedPlatform) {
  const name = String(p?.name || p?.id || '').trim();
  const letter = name.replaceAll(/[^A-Za-z0-9\u4E00-\u9FFF]/g, '').charAt(0);
  return (letter || '?').toUpperCase();
}

function pickedPlatformTitle(p: XqProductApi.PickedPlatform) {
  const name = String(p?.name || p?.id || '').trim() || '未知平台';
  return `${name} 已选`;
}

/** 账号下仍有尚未选取的平台，才允许勾选 */
function canSelect(item: XqProductApi.Product) {
  const bound = scopePlatforms.value.map((p) => p.id);
  if (bound.length === 0) return true;
  const picked = pickedPlatformIds(item);
  return bound.some((id) => !picked.has(String(id)));
}

function isPickedByPlatform(item: XqProductApi.Product, platformId?: string) {
  if (!platformId) return false;
  return pickedPlatformIds(item).has(String(platformId));
}

function toggleSelect(item: XqProductApi.Product, checked?: boolean) {
  const key = productKey(item);
  if (!key) return;
  const on = checked === undefined ? !selectedMap.value[key] : checked;
  if (on && !canSelect(item)) {
    message.warning('该商品在你绑定的平台均已选取，不能再下发');
    return;
  }
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

function mapListingCategoryTree(
  nodes: XqListingApi.CategoryNode[],
): Array<Record<string, any>> {
  return (nodes || []).map((n) => ({
    title: n.name,
    value: n.id,
    key: n.id,
    children: n.children?.length
      ? mapListingCategoryTree(n.children)
      : undefined,
  }));
}

function findCategoryName(
  nodes: XqListingApi.CategoryNode[],
  id?: string,
): string {
  if (!id) return '';
  for (const n of nodes || []) {
    if (n.id === id) return n.name || '';
    const hit = findCategoryName(n.children || [], id);
    if (hit) return hit;
  }
  return '';
}

function categoryTreeDataFor(platformId: string) {
  return mapListingCategoryTree(categoryTreeByPlatform.value[platformId] || []);
}

async function ensureUserListingScope() {
  const res = await getXqWorkbenchScope();
  scopePlatforms.value = (res?.platforms || []).filter(
    (p) => (p.shops || []).length > 0,
  );
  if (scopePlatforms.value.length === 0) {
    throw new Error('当前账号未绑定可用平台/店铺，请先在配置里绑店');
  }
}

async function loadCategoriesForPlatforms(platformIds: string[]) {
  const need = platformIds.filter((id) => !categoryTreeByPlatform.value[id]);
  if (need.length === 0) return;
  listingLoading.value = true;
  try {
    const results = await Promise.all(
      need.map(async (id) => {
        const tree = await getXqListingCategories(id).catch((error: any) => {
          message.error(error?.message || `加载类目失败（平台 ${id}）`);
          return [] as XqListingApi.CategoryNode[];
        });
        return [id, tree || []] as const;
      }),
    );
    const next = { ...categoryTreeByPlatform.value };
    for (const [id, tree] of results) {
      next[id] = tree;
    }
    categoryTreeByPlatform.value = next;
  } finally {
    listingLoading.value = false;
  }
}

/** 每个平台最多保留一家店（后选覆盖先选） */
function enforceOneShopPerPlatform(shopIds: string[]) {
  const shopPlatform = new Map<string, string>();
  for (const p of scopePlatforms.value) {
    for (const s of p.shops || []) {
      if (s.id) shopPlatform.set(s.id, p.id);
    }
  }
  const pickedByPlatform = new Map<string, string>();
  for (const sid of shopIds || []) {
    const pid = shopPlatform.get(sid);
    if (!pid) continue;
    // 同一平台后出现的店铺覆盖先前选择
    pickedByPlatform.set(pid, sid);
  }
  return [...pickedByPlatform.values()];
}

function onListingShopsChange(ids: string[]) {
  const next = enforceOneShopPerPlatform(ids || []);
  if ((ids || []).length > next.length) {
    message.info('每个平台只能选 1 家店铺');
  }
  listingShopIds.value = next;
}

async function onListingPlatformsChange(ids: string[]) {
  listingPlatformIds.value = ids || [];
  const allowedShop = new Set(shopOptions.value.map((o) => o.value));
  listingShopIds.value = enforceOneShopPerPlatform(
    listingShopIds.value.filter((id) => allowedShop.has(id)),
  );
  // 各平台若仅一店则自动勾上
  const autoShops: string[] = [...listingShopIds.value];
  for (const p of selectedScopePlatforms.value) {
    const shops = p.shops || [];
    if (
      shops.length === 1 &&
      shops[0]?.id &&
      !autoShops.includes(shops[0].id)
    ) {
      autoShops.push(shops[0].id);
    }
  }
  listingShopIds.value = enforceOneShopPerPlatform(autoShops);
  listingCategoryByPlatform.value = Object.fromEntries(
    Object.entries(listingCategoryByPlatform.value).filter(([id]) =>
      listingPlatformIds.value.includes(id),
    ),
  );
  await loadCategoriesForPlatforms(listingPlatformIds.value);
  // 目标平台变更后，清掉落在目标平台上的复用勾选
  const exclude = new Set(listingPlatformIds.value);
  const validIds = new Set<number>();
  for (const g of reuseGroups.value) {
    for (const c of g.candidates || []) {
      if (!exclude.has(String(c.listingPlatformId || '')) && c.workOrderId) {
        validIds.add(c.workOrderId);
      }
    }
  }
  const nextCopy = { ...reuseCopyMap.value };
  const nextImage = { ...reuseImageMap.value };
  for (const sku of Object.keys(nextCopy)) {
    const id = nextCopy[sku];
    if (id && !validIds.has(id)) nextCopy[sku] = undefined;
  }
  for (const sku of Object.keys(nextImage)) {
    const id = nextImage[sku];
    if (id && !validIds.has(id)) nextImage[sku] = undefined;
  }
  reuseCopyMap.value = nextCopy;
  reuseImageMap.value = nextImage;
}

function onListingCategoryChange(platformId: string, categoryId?: string) {
  listingCategoryByPlatform.value = {
    ...listingCategoryByPlatform.value,
    [platformId]: categoryId || undefined,
  };
}

async function loadReuseCandidates(skus: string[]) {
  reuseLoading.value = true;
  try {
    reuseGroups.value =
      (await lookupXqWorkOrderReuseCandidates({
        skus,
        excludePlatformIds: listingPlatformIds.value,
      })) || [];
  } catch (error: any) {
    reuseGroups.value = [];
    message.error(error?.message || '反查其它平台成品失败');
  } finally {
    reuseLoading.value = false;
  }
}

function refreshReuseCandidates() {
  const map = { ...selectedMap.value };
  if (dispatchExtra.value) {
    const key = productKey(dispatchExtra.value);
    if (key) map[key] = dispatchExtra.value;
  }
  return loadReuseCandidates(Object.keys(map));
}

function setReuseCopy(sku: string, workOrderId?: number) {
  const cur = reuseCopyMap.value[sku];
  reuseCopyMap.value = {
    ...reuseCopyMap.value,
    [sku]: cur === workOrderId ? undefined : workOrderId,
  };
}

function setReuseImage(sku: string, workOrderId?: number) {
  const cur = reuseImageMap.value[sku];
  reuseImageMap.value = {
    ...reuseImageMap.value,
    [sku]: cur === workOrderId ? undefined : workOrderId,
  };
}

function clearReuseForSku(sku: string) {
  reuseCopyMap.value = { ...reuseCopyMap.value, [sku]: undefined };
  reuseImageMap.value = { ...reuseImageMap.value, [sku]: undefined };
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
  listingPlatformIds.value = [];
  listingShopIds.value = [];
  listingCategoryByPlatform.value = {};
  reuseCopyMap.value = {};
  reuseImageMap.value = {};
  reuseGroups.value = [];
  try {
    await ensureUserListingScope();
  } catch (error: any) {
    message.error(error?.message || '加载平台失败');
    return;
  }
  // 仅一个平台时默认选中
  if (scopePlatforms.value.length === 1) {
    await onListingPlatformsChange([scopePlatforms.value[0]!.id]);
  }
  dispatchOpen.value = true;
  const skus = Object.keys(map);
  await loadReuseCandidates(skus);
}

async function confirmDispatch() {
  if (listingPlatformIds.value.length === 0) {
    message.warning('请选择上架平台');
    throw new Error('请选择上架平台');
  }
  const map = { ...selectedMap.value };
  if (dispatchExtra.value) {
    const key = productKey(dispatchExtra.value);
    if (key) map[key] = dispatchExtra.value;
  }
  const selectedProducts = Object.values(map);
  if (selectedProducts.length === 0) {
    message.warning('请先勾选要跑的产品');
    throw new Error('请先勾选要跑的产品');
  }
  const reuseCopyFromIds: Record<string, number> = {};
  const reuseImageFromIds: Record<string, number> = {};
  for (const [sku, id] of Object.entries(reuseCopyMap.value)) {
    if (id) reuseCopyFromIds[sku] = id;
  }
  for (const [sku, id] of Object.entries(reuseImageMap.value)) {
    if (id) reuseImageFromIds[sku] = id;
  }
  for (const p of selectedScopePlatforms.value) {
    const cid = listingCategoryByPlatform.value[p.id];
    if (!cid) {
      message.warning(`请选择平台「${p.name}」的类目`);
      throw new Error(`请选择平台「${p.name}」的类目`);
    }
  }
  type ShopTarget = { platform: XqWorkbenchPlatform; shop: XqListingApi.Shop };
  const targets: ShopTarget[] = [];
  for (const platform of selectedScopePlatforms.value) {
    let platformShops = (platform.shops || []).filter((s) =>
      listingShopIds.value.includes(s.id),
    );
    if (platformShops.length === 0 && (platform.shops || []).length === 1) {
      platformShops = [platform.shops![0]!];
    }
    if (platformShops.length === 0) {
      message.warning(`请选择平台「${platform.name}」的店铺`);
      throw new Error(`请选择平台「${platform.name}」的店铺`);
    }
    if (platformShops.length > 1) {
      message.warning(`平台「${platform.name}」只能选择 1 家店铺`);
      throw new Error(`平台「${platform.name}」只能选择 1 家店铺`);
    }
    targets.push({ platform, shop: platformShops[0]! });
  }
  dispatching.value = true;
  let totalCreated = 0;
  try {
    for (const { platform, shop } of targets) {
      const categoryId = listingCategoryByPlatform.value[platform.id];
      const categoryName = findCategoryName(
        categoryTreeByPlatform.value[platform.id] || [],
        categoryId,
      );
      const remain = selectedProducts.filter(
        (p) => !isPickedByPlatform(p, platform.id),
      );
      if (remain.length === 0) {
        message.warning(`所选商品在「${platform.name}」均已选取，已跳过该平台`);
        continue;
      }
      if (remain.length < selectedProducts.length) {
        message.info(
          `「${platform.name}」已跳过 ${selectedProducts.length - remain.length} 个已选取商品`,
        );
      }
      const list = await dispatchXqWorkOrder({
        listingPlatformId: platform.id,
        listingShopId: shop.id,
        listingCategoryId: categoryId,
        listingPlatformName: platform.name,
        listingShopName: shop.name,
        listingCategoryName: categoryName || undefined,
        reuseCopyFromIds:
          Object.keys(reuseCopyFromIds).length > 0
            ? reuseCopyFromIds
            : undefined,
        reuseImageFromIds:
          Object.keys(reuseImageFromIds).length > 0
            ? reuseImageFromIds
            : undefined,
        items: remain.map((p) => ({
          productId: p.id ? String(p.id) : undefined,
          sku: productKey(p),
          title: p.name || productKey(p),
          coverUrl: p.imageUrl,
          categoryName: p.categoryName,
          gigaCategoryId: p.gigaCategoryId,
        })),
      });
      totalCreated += list?.length ?? remain.length;
    }
    if (totalCreated === 0) {
      message.warning('没有可下发的商品（所选平台均已选取）');
      throw new Error('没有可下发的商品');
    }
    message.success(`已下发 ${totalCreated} 个任务到工作台`);
    clearSelection();
    dispatchOpen.value = false;
    detailOpen.value = false;
    await loadProducts();
  } catch (error: any) {
    const msg = error?.message || '下发失败';
    message.error(
      /该平台已有|已有进行中|已上架/.test(msg)
        ? `${msg}（可在任务列表关闭后重试）`
        : msg,
    );
    throw error instanceof Error ? error : new Error(msg);
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
      excludePickedPlatformId:
        excludePicked.value && filterPlatformId.value
          ? filterPlatformId.value
          : undefined,
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

function reloadFiltered() {
  pageNo.value = 1;
  loadProducts();
}

function onFilterPlatformChange() {
  if (!filterPlatformId.value) {
    excludePicked.value = false;
  }
  reloadFiltered();
}

function onExcludePickedChange(checked: boolean) {
  excludePicked.value = checked;
  if (checked && !filterPlatformId.value && scopePlatforms.value[0]) {
    filterPlatformId.value = scopePlatforms.value[0]!.id;
  }
  reloadFiltered();
}

onMounted(async () => {
  await loadCategories();
  try {
    await ensureUserListingScope();
    if (!filterPlatformId.value && scopePlatforms.value[0]) {
      filterPlatformId.value = scopePlatforms.value[0]!.id;
    }
  } catch {
    // 未绑店仍可浏览选品库
  }
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
        <Select
          v-model:value="filterPlatformId"
          allow-clear
          class="xq-filter-platform"
          placeholder="本平台"
          :options="platformOptions"
          @change="onFilterPlatformChange"
        />
        <label class="xq-select-all">
          <Checkbox
            :checked="excludePicked"
            :disabled="!filterPlatformId"
            @change="
              (e: any) => onExcludePickedChange(Boolean(e?.target?.checked))
            "
          />
          <span>筛出本平台已选</span>
        </label>
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
            :class="{
              selected: isSelected(item),
              locked: !canSelect(item),
            }"
            @click="openDetail(item)"
          >
            <div
              class="xq-card-check"
              @click.stop="toggleSelect(item, !isSelected(item))"
            >
              <Checkbox
                :checked="isSelected(item)"
                :disabled="!canSelect(item)"
              />
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
                <b>{{ productCodeLabel(item) }}</b>
              </div>
              <div class="xq-price-block">
                <div class="xq-price-line">
                  <span class="xq-price-label">自提</span>
                  <span
                    v-if="formatMoney(item.pickupPrice ?? item.price)"
                    class="xq-price-main"
                  >
                    ${{ formatMoney(item.pickupPrice ?? item.price) }}
                  </span>
                  <span v-else class="xq-price-muted">—</span>
                </div>
                <div class="xq-price-line">
                  <span class="xq-price-label">代发</span>
                  <span
                    v-if="formatMoney(item.dropshipPrice)"
                    class="xq-price-sale"
                  >
                    ${{ formatMoney(item.dropshipPrice) }}
                  </span>
                  <span
                    v-else-if="formatMoney(item.discountedPrice ?? item.price)"
                    class="xq-price-sale"
                  >
                    ${{ formatMoney(item.discountedPrice ?? item.price) }}
                  </span>
                  <span v-else class="xq-price-muted">—</span>
                </div>
              </div>
              <div class="xq-qty">
                Qty Available
                <span>{{ item.qtyAvailable ?? '---' }}</span>
              </div>
              <div v-if="item.pickedPlatforms?.length" class="xq-picked-row">
                <Tooltip
                  v-for="p in item.pickedPlatforms"
                  :key="p.id"
                  :title="pickedPlatformTitle(p)"
                >
                  <span class="xq-picked-dot" :title="pickedPlatformTitle(p)">
                    {{ pickedPlatformAbbr(p) }}
                  </span>
                </Tooltip>
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
      wrap-class-name="xq-detail-modal-wrap"
      :footer="null"
    >
      <Spin :spinning="detailLoading">
        <div v-if="detail" class="xq-detail-toolbar">
          <Button
            type="primary"
            :disabled="!canSelect(detail)"
            :loading="dispatching"
            @click="openDispatchModal(detail)"
          >
            下发
          </Button>
          <Button @click="detailOpen = false">取消</Button>
        </div>
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
              <div class="xq-shop-price-roles">
                <div class="xq-shop-price-role">
                  <span class="xq-shop-price-role-label">自提</span>
                  <strong
                    v-if="
                      formatMoney(
                        selectedVariant?.pickupPrice ||
                          detail.pickupPrice ||
                          selectedVariant?.price ||
                          detail.price,
                      )
                    "
                  >
                    ${{
                      formatMoney(
                        selectedVariant?.pickupPrice ||
                          detail.pickupPrice ||
                          selectedVariant?.price ||
                          detail.price,
                      )
                    }}
                  </strong>
                  <strong v-else>—</strong>
                </div>
                <div class="xq-shop-price-role">
                  <span class="xq-shop-price-role-label">一件代发</span>
                  <strong
                    v-if="
                      formatMoney(
                        selectedVariant?.dropshipPrice || detail.dropshipPrice,
                      )
                    "
                    class="xq-price-sale"
                  >
                    ${{
                      formatMoney(
                        selectedVariant?.dropshipPrice || detail.dropshipPrice,
                      )
                    }}
                  </strong>
                  <strong
                    v-else-if="
                      formatMoney(
                        selectedVariant?.discountedPrice ||
                          detail.discountedPrice ||
                          selectedVariant?.price ||
                          detail.price,
                      )
                    "
                    class="xq-price-sale"
                  >
                    ${{
                      formatMoney(
                        selectedVariant?.discountedPrice ||
                          detail.discountedPrice ||
                          selectedVariant?.price ||
                          detail.price,
                      )
                    }}
                  </strong>
                  <strong v-else>—</strong>
                </div>
              </div>
              <span
                v-if="
                  formatMoney(
                    selectedVariant?.dropshipShippingFee ||
                      detail.dropshipShippingFee,
                  )
                "
                class="xq-exclusive"
              >
                代发运费 ${{
                  formatMoney(
                    selectedVariant?.dropshipShippingFee ||
                      detail.dropshipShippingFee,
                  )
                }}
              </span>
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
            <div
              v-if="detail.pickedPlatforms?.length"
              class="xq-picked-row xq-picked-row--detail"
            >
              <span class="xq-spec-label">已选平台</span>
              <Tooltip
                v-for="p in detail.pickedPlatforms"
                :key="`d-${p.id}`"
                :title="pickedPlatformTitle(p)"
              >
                <span class="xq-picked-dot" :title="pickedPlatformTitle(p)">
                  {{ pickedPlatformAbbr(p) }}
                </span>
              </Tooltip>
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
      title="下发到工作台"
      ok-text="确认下发"
      :confirm-loading="dispatching"
      destroy-on-close
      centered
      width="920px"
      class="xq-dispatch-modal"
      :body-style="{ padding: '12px 16px 8px' }"
      @ok="confirmDispatch"
    >
      <div class="xq-dispatch-layout">
        <section class="xq-dispatch-pane xq-dispatch-pane--form">
          <div class="xq-pane-title">目标配置</div>
          <p class="xq-dispatch-hint">
            仅本人已绑平台/店铺；平台可多选，每个平台只选 1 家店铺并选类目。
          </p>
          <Spin :spinning="listingLoading">
            <div class="xq-dispatch-form">
              <div class="xq-field">
                <label>上架平台</label>
                <Select
                  v-model:value="listingPlatformIds"
                  mode="multiple"
                  allow-clear
                  show-search
                  max-tag-count="responsive"
                  option-filter-prop="label"
                  placeholder="可多选平台"
                  :options="platformOptions"
                  @change="(v: any) => onListingPlatformsChange(v || [])"
                />
              </div>
              <div class="xq-field">
                <label>上架店铺</label>
                <Select
                  v-model:value="listingShopIds"
                  mode="multiple"
                  allow-clear
                  show-search
                  max-tag-count="responsive"
                  option-filter-prop="label"
                  :placeholder="
                    listingPlatformIds.length
                      ? shopOptions.length
                        ? '每平台选 1 家店'
                        : '暂无绑定店铺'
                      : '请先选平台'
                  "
                  :options="shopOptions"
                  :disabled="listingPlatformIds.length === 0"
                  @change="(v: any) => onListingShopsChange(v || [])"
                />
              </div>
              <div
                v-if="selectedScopePlatforms.length"
                class="xq-category-grid"
              >
                <div
                  v-for="p in selectedScopePlatforms"
                  :key="p.id"
                  class="xq-field"
                >
                  <label>
                    类目
                    <em>{{ p.name }}</em>
                  </label>
                  <TreeSelect
                    :value="listingCategoryByPlatform[p.id]"
                    allow-clear
                    show-search
                    tree-default-expand-all
                    tree-node-filter-prop="title"
                    placeholder="选择类目"
                    :tree-data="categoryTreeDataFor(p.id)"
                    :dropdown-style="{ maxHeight: '280px', overflow: 'auto' }"
                    @change="(v: any) => onListingCategoryChange(p.id, v)"
                  />
                </div>
              </div>
            </div>
          </Spin>
        </section>

        <section class="xq-dispatch-pane xq-dispatch-pane--reuse">
          <div class="xq-reuse-head">
            <div class="xq-pane-title">其它平台已做内容</div>
            <Button
              type="link"
              size="small"
              :loading="reuseLoading"
              @click="refreshReuseCandidates"
            >
              刷新
            </Button>
          </div>
          <p class="xq-dispatch-hint">
            同 SKU 可分别复用文案/图片；不勾则从零做。
          </p>
          <Spin :spinning="reuseLoading">
            <div class="xq-reuse-scroll">
              <Empty
                v-if="!visibleReuseGroups.length"
                :image="Empty.PRESENTED_IMAGE_SIMPLE"
                description="暂无可复用文案或图片"
              />
              <div
                v-for="group in visibleReuseGroups"
                :key="group.sku"
                class="xq-reuse-sku"
              >
                <div class="xq-reuse-sku-title">
                  <code>{{ group.sku }}</code>
                  <Button
                    type="link"
                    size="small"
                    @click="clearReuseForSku(group.sku)"
                  >
                    清除
                  </Button>
                </div>
                <div
                  v-for="c in group.candidates"
                  :key="c.workOrderId"
                  class="xq-reuse-card"
                  :class="{
                    'is-copy': reuseCopyMap[group.sku] === c.workOrderId,
                    'is-image': reuseImageMap[group.sku] === c.workOrderId,
                  }"
                >
                  <div class="xq-reuse-meta">
                    <Tag color="processing">
                      {{ c.listingPlatformName || '平台' }}
                    </Tag>
                    <span class="xq-reuse-shop">{{
                      c.listingShopName || '—'
                    }}</span>
                    <span class="xq-reuse-no" :title="c.no">{{ c.no }}</span>
                  </div>
                  <div
                    class="xq-reuse-body"
                    :class="{
                      'has-imgs': c.hasImage && (c.imageUrls?.length || 0) > 0,
                    }"
                  >
                    <div
                      v-if="c.hasImage && c.imageUrls?.length"
                      class="xq-reuse-imgs"
                    >
                      <Image.PreviewGroup>
                        <Image
                          v-for="(url, idx) in c.imageUrls.slice(0, 4)"
                          :key="`${c.workOrderId}-${idx}`"
                          :src="url"
                          :width="48"
                          :height="48"
                          class="xq-reuse-thumb"
                        />
                      </Image.PreviewGroup>
                      <span
                        v-if="(c.imageUrls?.length || 0) > 4"
                        class="xq-reuse-more"
                      >
                        +{{ (c.imageUrls?.length || 0) - 4 }}
                      </span>
                    </div>
                    <div v-if="c.hasCopy" class="xq-reuse-copy">
                      <div class="xq-reuse-copy-title">
                        {{ c.contentTitle || '（无标题）' }}
                      </div>
                      <pre
                        v-if="c.contentSellingPoints"
                        class="xq-reuse-points"
                        >{{ c.contentSellingPoints }}</pre>
                      <p v-if="c.description" class="xq-reuse-desc">
                        {{ c.description }}
                      </p>
                    </div>
                    <div v-else-if="!c.hasImage" class="xq-reuse-empty-tip">
                      无文案与图片
                    </div>
                  </div>
                  <div class="xq-reuse-actions">
                    <button
                      type="button"
                      class="xq-reuse-chip"
                      :class="{
                        active: reuseCopyMap[group.sku] === c.workOrderId,
                      }"
                      :disabled="!c.hasCopy"
                      @click="
                        c.hasCopy && setReuseCopy(group.sku, c.workOrderId)
                      "
                    >
                      使用文案
                    </button>
                    <button
                      type="button"
                      class="xq-reuse-chip"
                      :class="{
                        active: reuseImageMap[group.sku] === c.workOrderId,
                      }"
                      :disabled="!c.hasImage"
                      @click="
                        c.hasImage && setReuseImage(group.sku, c.workOrderId)
                      "
                    >
                      使用图片
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Spin>
        </section>
      </div>
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

.xq-dispatch-layout {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 12px;
  max-height: min(68vh, 640px);
}

.xq-dispatch-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 12px;
  background: #fafbfc;
  border: 1px solid #e8eaed;
  border-radius: 10px;
}

.xq-dispatch-pane--reuse {
  background: #fff;
}

.xq-pane-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
  color: #111827;
}

.xq-dispatch-hint {
  margin: 4px 0 10px;
  font-size: 12px;
  line-height: 1.45;
  color: #8b93a1;
}

.xq-dispatch-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.xq-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.xq-field label {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
}

.xq-field label em {
  margin-left: 4px;
  font-style: normal;
  font-weight: 400;
  color: #1677ff;
}

.xq-category-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.xq-reuse-head {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.xq-reuse-scroll {
  flex: 1;
  min-height: 180px;
  max-height: min(52vh, 480px);
  padding-right: 2px;
  overflow: auto;
}

.xq-reuse-sku {
  margin-bottom: 10px;
}

.xq-reuse-sku-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.xq-reuse-sku-title code {
  padding: 1px 6px;
  font-size: 12px;
  color: #1f2937;
  background: #f3f4f6;
  border-radius: 4px;
}

.xq-reuse-card {
  padding: 10px;
  margin-bottom: 8px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}

.xq-reuse-card.is-copy,
.xq-reuse-card.is-image {
  background: #f0f7ff;
  border-color: #91caff;
  box-shadow: 0 0 0 1px rgb(22 119 255 / 12%);
}

.xq-reuse-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #6b7280;
}

.xq-reuse-shop {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.xq-reuse-no {
  max-width: 120px;
  margin-left: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
}

.xq-reuse-body {
  display: block;
}

.xq-reuse-body.has-imgs {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.xq-reuse-imgs {
  display: grid;
  grid-template-columns: repeat(2, 48px);
  gap: 4px;
  align-content: start;
}

.xq-reuse-thumb {
  display: block;
  object-fit: cover;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.xq-reuse-more {
  grid-column: 1 / -1;
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
}

.xq-reuse-copy {
  min-width: 0;
}

.xq-reuse-copy-title {
  display: -webkit-box;
  margin-bottom: 4px;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  color: #111827;
  -webkit-box-orient: vertical;
}

.xq-reuse-points {
  max-height: 52px;
  margin: 0 0 4px;
  overflow: auto;
  font-size: 11px;
  line-height: 1.4;
  color: #4b5563;
  white-space: pre-wrap;
}

.xq-reuse-desc {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: 11px;
  line-height: 1.4;
  color: #9ca3af;
  -webkit-box-orient: vertical;
}

.xq-reuse-empty-tip {
  grid-column: 1 / -1;
  font-size: 12px;
  color: #9ca3af;
}

.xq-reuse-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.xq-reuse-chip {
  padding: 2px 10px;
  font-size: 12px;
  line-height: 22px;
  color: #4b5563;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 999px;
}

.xq-reuse-chip:hover:not(:disabled) {
  color: #1677ff;
  border-color: #91caff;
}

.xq-reuse-chip.active {
  color: #fff;
  background: #1677ff;
  border-color: #1677ff;
}

.xq-reuse-chip:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (max-width: 800px) {
  .xq-dispatch-layout {
    grid-template-columns: 1fr;
    max-height: none;
  }

  .xq-reuse-scroll {
    max-height: 40vh;
  }
}

.xq-search-bar {
  max-width: 720px;
}

.xq-search-input {
  width: 100%;
  min-width: 220px;
  max-width: 360px;
}

.xq-filter-platform {
  width: 168px;
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

.xq-product-card.locked {
  cursor: default;
}

.xq-picked-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.xq-picked-row--detail {
  margin: 8px 0 4px;
}

.xq-picked-dot {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  color: #1677ff;
  cursor: default;
  user-select: none;
  background: #e6f4ff;
  border: 1px solid #91caff;
  border-radius: 999px;
}

.xq-picked-dot:hover {
  color: #fff;
  background: #1677ff;
  border-color: #1677ff;
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
  flex-shrink: 0;
  width: 36px;
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
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 14px;
  background: #fff7f2;
}

.xq-shop-price-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  align-items: baseline;
}

.xq-shop-price-role {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.xq-shop-price-role-label {
  font-size: 13px;
  color: #6b7280;
}

.xq-shop-price strong {
  font-size: 24px;
  font-weight: 700;
  color: #ff5000;
}

.xq-shop-price strong.xq-price-sale {
  color: #dc2626;
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

.xq-detail-toolbar {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin: -4px 0 14px;
}

.xq-copy-body {
  font-size: 13px;
  line-height: 1.6;
  color: #333;
}

:global(.xq-detail-modal-wrap) .ant-modal {
  top: 24px;
  padding-bottom: 24px;
}

:global(.xq-detail-modal-wrap) .ant-modal-body {
  max-height: none;
  overflow: visible;
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
