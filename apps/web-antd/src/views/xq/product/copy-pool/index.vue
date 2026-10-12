<script lang="ts" setup>
import type { XqListingApi, XqSpecialConfigApi } from '#/api/xq/listing';
import type { XqWorkOrderApi } from '#/api/xq/work-order';
import type { CopyPromptPack } from '#/views/xq/product/copy-prompt-file';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useUserStore } from '@vben/stores';

import {
  Alert,
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
  Switch,
  Tag,
  Textarea,
  TreeSelect,
  Upload,
} from 'ant-design-vue';

import { uploadFile } from '#/api/infra/file';
import { getSimpleUser } from '#/api/system/user';
import {
  getXqCategoryFieldTemplate,
  getXqFieldPool,
  getXqListingCategories,
  getXqListingShops,
  getXqPriceMarkupRules,
  getXqSkuRules,
} from '#/api/xq/listing';
import {
  batchAssignXqWorkOrderImage,
  batchCloseXqWorkOrder,
  closeXqWorkOrder,
  enqueueXqWorkOrderCopyRpa,
  getXqAssignableImageUsers,
  getXqWorkOrder,
  getXqWorkOrderPage,
  pullXqWorkOrderCopyRpa,
  regenerateXqWorkOrderCopy,
  updateXqWorkOrder,
  updateXqWorkOrderImageStatus,
} from '#/api/xq/work-order';
import { useDeskPlatformId } from '#/views/xq/desk/use-desk-scope';
import {
  copyPromptCount,
  exportCopyPromptTemplate,
  normalizeCopyPromptPack,
  parseCopyPromptsFromFile,
} from '#/views/xq/product/copy-prompt-file';
import { imageSlotTypeLabel } from '#/views/xq/product/image-slot-rule';
import {
  dedupeListingFieldsByCode,
  isListingImageField,
  LISTING_FIELD_ZONE_OPTIONS,
  resolveListingFieldZone,
  resolveListingHeaderFactKey,
} from '#/views/xq/product/listing-field-zone';
import { translateFieldLabel } from '#/views/xq/product/template-config/field-label-zh';
import XqSourceProductDrawer from '#/views/xq/product/xq-source-product-drawer.vue';

import EditFieldRow from './edit-field-row.vue';

defineOptions({ name: 'XqCopyPool' });

const FEATURE_COUNT = 5;

interface ImagePromptItem {
  index: number;
  imageType?: string;
  imageUrl?: string;
  resultUrl?: string;
  generatedImageUrl?: string;
  marker?: string;
  promptText?: string;
  bindIndexes?: number[];
  rejectReason?: string;
}

const userStore = useUserStore();
const route = useRoute();
const lockedPlatformId = useDeskPlatformId();
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
const assignTargetIds = ref<number[]>([]);
const users = ref<Array<{ id: number; nickname?: string; username?: string }>>(
  [],
);
/** imageUserId → 展示名（含非美工列表用户的补查） */
const imageUserNameMap = reactive<Record<number, string>>({});
const regenerateOpen = ref(false);
const regenerating = ref(false);
const revisionPrompt = ref('');
/** all | title | description | feature */
const reviseTarget = ref<'all' | 'description' | 'feature' | 'title'>('all');
const reviseFeatureIndex = ref(0);
/** 文案提示词弹窗 */
const promptOpen = ref(false);
const promptSaving = ref(false);
const copyPrompts = reactive<CopyPromptPack>({
  title: '',
  features: Array.from({ length: FEATURE_COUNT }, () => ''),
  description: '',
});
const batchPromptOpen = ref(false);
const batchPromptBusy = ref(false);
/** 左侧勾选：独立跑文案 RPA 的变体 id（主体始终包含） */
const rpaSelectedMap = reactive<Record<number, boolean>>({});
const enqueueingRpa = ref(false);
const refreshing = ref(false);
const pullTestOpen = ref(false);
const pullTestBusy = ref(false);
const pullTestJson = ref('');

const reviseTargetLabel = computed(() => {
  if (reviseTarget.value === 'title') return '标题';
  if (reviseTarget.value === 'description') return '长描述';
  if (reviseTarget.value === 'feature') {
    return `卖点 ${reviseFeatureIndex.value + 1}`;
  }
  return '标题 / 卖点 / 长描述（全部）';
});

const form = reactive({
  contentTitle: '',
  sellingPoints: Array.from({ length: FEATURE_COUNT }, () => ''),
  description: '',
  styleDescription: '',
  highlightTags: [] as string[],
  selectedHighlight: [] as string[],
});
const tagDraft = ref('');

const queryParams = reactive({
  keyword: '' as string | undefined,
});

const selectedCount = computed(() => Object.keys(selectedMap.value).length);
const unassignedSelected = computed(() =>
  Object.values(selectedMap.value).filter((t) => !t.imageUserId),
);

const listingCategoryId = ref<string | undefined>();
const listingShopId = ref<string | undefined>();
const listingCountryCode = ref<string | undefined>();
const listingShops = ref<XqListingApi.Shop[]>([]);
const listingCategories = ref<XqListingApi.CategoryNode[]>([]);
const categoryTemplate = ref<null | XqListingApi.CategoryFieldTemplate>(null);
const fieldPool = ref<null | XqListingApi.FieldPool>(null);
const templateLoading = ref(false);
const templateLoaded = ref(false);
const fieldValues = reactive<Record<string, string>>({});

const activeTask = computed(() => findTask(activeId.value));

const familyParent = computed(() => comboRootOf(activeTask.value));

const expandedIds = ref<Record<number, boolean>>({});

function asId(v?: null | number | string) {
  const s = String(v ?? '').trim();
  return s || undefined;
}

function comboRootOf(row?: null | XqWorkOrderApi.WorkOrder) {
  if (!row) return null;
  if (row.parentWorkOrderId) {
    return tasks.value.find((t) => t.id === row.parentWorkOrderId) || row;
  }
  return row;
}

function comboMembers(row: XqWorkOrderApi.WorkOrder) {
  const kids = row.variants || [];
  if (kids.length === 0) return [row];
  return isSellableParent(row) ? [row, ...kids] : kids;
}

/** 有变体时：主体若无可售规格则只做分组框；单品没有主次 */
function isSellableParent(row: XqWorkOrderApi.WorkOrder) {
  const kids = row.variants || [];
  if (kids.length === 0) return true;
  const hasOffer = (r: XqWorkOrderApi.WorkOrder) =>
    Boolean(
      cleanText(r.mainColor) ||
      cleanText(r.variantLabel) ||
      (r.price !== null && r.price !== undefined) ||
      (r.qtyAvailable !== null && r.qtyAvailable !== undefined),
    );
  const parentOffer = hasOffer(row);
  const childOffer = kids.some((k) => hasOffer(k));
  if (childOffer && !parentOffer) return false;
  return true;
}

const categoryTreeData = computed(() => {
  const tree = mapCategoryTree(listingCategories.value);
  const cid = asId(listingCategoryId.value);
  if (!cid || findCategoryName(listingCategories.value, cid)) return tree;
  const label = familyParent.value?.listingCategoryName || cid;
  return [{ title: label, value: cid, key: cid }, ...tree];
});

const listingPlatformId = computed(
  () =>
    asId(lockedPlatformId.value) ||
    asId(activeTask.value?.listingPlatformId) ||
    asId(familyParent.value?.listingPlatformId) ||
    '',
);

const listingPlatformName = computed(
  () =>
    activeTask.value?.listingPlatformName ||
    familyParent.value?.listingPlatformName ||
    '',
);

const shopOptions = computed(() => {
  const opts = listingShops.value.map((s) => ({
    label: s.name || s.code || String(s.id),
    value: asId(s.id)!,
  }));
  const sid = asId(listingShopId.value);
  if (sid && !opts.some((o) => o.value === sid)) {
    opts.unshift({
      label:
        activeTask.value?.listingShopName ||
        familyParent.value?.listingShopName ||
        sid,
      value: sid,
    });
  }
  return opts;
});

const COUNTRY_OPTIONS = [
  { value: 'US', label: '美国 US' },
  { value: 'CA', label: '加拿大 CA' },
  { value: 'MX', label: '墨西哥 MX' },
  { value: 'UK', label: '英国 UK' },
  { value: 'GB', label: '英国 GB' },
  { value: 'DE', label: '德国 DE' },
  { value: 'FR', label: '法国 FR' },
  { value: 'IT', label: '意大利 IT' },
  { value: 'ES', label: '西班牙 ES' },
  { value: 'JP', label: '日本 JP' },
  { value: 'AU', label: '澳大利亚 AU' },
  { value: 'IN', label: '印度 IN' },
  { value: 'AE', label: '阿联酋 AE' },
  { value: 'SG', label: '新加坡 SG' },
  { value: 'NL', label: '荷兰 NL' },
  { value: 'SE', label: '瑞典 SE' },
  { value: 'PL', label: '波兰 PL' },
  { value: 'BE', label: '比利时 BE' },
  { value: 'IE', label: '爱尔兰 IE' },
  { value: 'BR', label: '巴西 BR' },
];

const countryOptions = computed(() => {
  const code = asId(listingCountryCode.value);
  if (code && !COUNTRY_OPTIONS.some((o) => o.value === code)) {
    return [{ value: code, label: code }, ...COUNTRY_OPTIONS];
  }
  return COUNTRY_OPTIONS;
});

function countryNameOf(code?: string) {
  const c = asId(code);
  if (!c) return '';
  return COUNTRY_OPTIONS.find((o) => o.value === c)?.label || c;
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

const showCopyEditor = computed(() => Boolean(activeTask.value));

/**
 * 编辑区字段来源（与 listing-pool / 上架模板一致）：
 * - 已选类目 → 只用该类目模板（category-template）
 * - 未选类目 → 不展示全平台 field-pool（否则会出现几十个「Color」分属不同类目）
 * field-pool 仍用于分区配置（partitions），不直接当表单字段源
 */
const templateFields = computed(() => {
  const cid = asId(listingCategoryId.value);
  if (cid) {
    return dedupeListingFieldsByCode(categoryTemplate.value?.fields || []);
  }
  return [];
});

const hasCategoryTemplate = computed(() => templateFields.value.length > 0);

type TplBucket = 'copy' | 'dim' | 'image' | 'other' | 'required';
type TplField = XqListingApi.CategoryField & {
  bucket: TplBucket;
  copyIndex?: number;
  copyKind?: 'description' | 'feature' | 'other' | 'title';
};

function fieldHay(f: XqListingApi.CategoryField) {
  return `${f.label || ''} ${f.code || ''} ${f.type || ''}`
    .toLowerCase()
    .replaceAll(/[_-]+/g, ' ');
}

function classifyTplField(f: XqListingApi.CategoryField): TplField {
  const hay = fieldHay(f);
  const type = String(f.type || '').toUpperCase();
  if (
    type.includes('MEDIA') ||
    type.includes('IMAGE') ||
    /(^|\s)(image|photo|img|主图|附图|zoom|swatch)(\s|$)/.test(hay)
  ) {
    return { ...f, bucket: 'image' };
  }
  if (
    /(product title|^title$|\btitle\b|product_title)/.test(hay) &&
    !/subtitle|feature|style description/.test(hay)
  ) {
    return { ...f, bucket: 'copy', copyKind: 'title' };
  }
  if (
    /(long description|product description|^description$|商品描述|长描述)/.test(
      hay,
    ) &&
    !/short description|style description/.test(hay)
  ) {
    return { ...f, bucket: 'copy', copyKind: 'description' };
  }
  if (/style description/.test(hay)) {
    return { ...f, bucket: 'copy', copyKind: 'other' };
  }
  const feat = hay.match(/(?:product feature|feature|卖点|bullet)\s*(\d+)/);
  if (feat) {
    return {
      ...f,
      bucket: 'copy',
      copyKind: 'feature',
      copyIndex: Math.max(0, Number(feat[1]) - 1),
    };
  }
  if (/style description|selling point|highlight|bullet|卖点/.test(hay)) {
    return { ...f, bucket: 'copy', copyKind: 'other' };
  }
  if (
    /(pack(?:age|aging)?\s*(length|width|height)|item\s*(length|width|height)|overall\s*(length|width|height)|dimension|包装尺寸|长宽高|\blength\b|\bwidth\b|\bheight\b|\bweight\b)/.test(
      hay,
    ) &&
    !/font size|file size|battery|screen/.test(hay)
  ) {
    return { ...f, bucket: 'dim' };
  }
  if (f.required) return { ...f, bucket: 'required' };
  return { ...f, bucket: 'other' };
}

const wbCopyFilled = computed(() => {
  const vals = [
    form.contentTitle,
    form.description,
    form.styleDescription,
    ...form.sellingPoints,
  ];
  return vals.filter((v) => String(v || '').trim()).length;
});

const hasCopyContent = computed(() => wbCopyFilled.value > 0);

function promptAiUrl(p?: ImagePromptItem) {
  return String(p?.resultUrl || p?.generatedImageUrl || '').trim();
}

const uploadedAiImages = ref<string[]>([]);
const imageUploading = ref<null | number>(null);

/** 与图片页同一套槽位序号：按 imagePromptJson 下标，避免驳回绑错图 */
const wbImageSlots = computed(() => {
  const prompts = imagePrompts.value;
  const uploaded = uploadedAiImages.value;
  const row = activeTask.value;
  const n = Math.max(
    prompts.length,
    uploaded.length,
    promptAiUrl(prompts[0] as ImagePromptItem) || row?.generatedImageUrl
      ? 1
      : 0,
  );
  const slots = Array.from({ length: n }, (_, i) => {
    const p = prompts[i];
    const typeLabel =
      imageSlotTypeLabel(p?.imageType) || (i === 0 ? '主图' : '附图');
    return {
      label: `${typeLabel} ${String(i + 1).padStart(2, '0')}`,
      url:
        String(uploaded[i] || '').trim() ||
        promptAiUrl(p) ||
        (i === 0 ? String(row?.generatedImageUrl || '').trim() : ''),
      rejectReason: String(p?.rejectReason || '').trim(),
    };
  });
  const filled = slots.filter((s) => s.url).length;
  if (filled === slots.length) {
    slots.push({
      label: `附图 ${String(slots.length + 1).padStart(2, '0')}`,
      url: '',
      rejectReason: '',
    });
  }
  return slots;
});

const wbImageFilled = computed(
  () => wbImageSlots.value.filter((s) => s.url).length,
);

async function persistAiImages(urls: string[]) {
  const row = activeTask.value;
  if (!row?.id) return;
  const prompts = imagePrompts.value.map((p, i) => {
    const nextUrl = urls[i] || (p as ImagePromptItem).resultUrl || '';
    const prevUrl = String(p.resultUrl || p.generatedImageUrl || '');
    return {
      ...p,
      resultUrl: nextUrl,
      rejectReason: nextUrl === prevUrl ? p.rejectReason : undefined,
    };
  });
  while (prompts.length < urls.length) {
    const i = prompts.length;
    prompts.push({
      index: i,
      imageType: i === 0 ? 'main' : 'detail',
      marker: 'ai',
      resultUrl: urls[i] || '',
    });
  }
  await updateXqWorkOrder({
    id: row.id,
    generatedImageUrl: urls[0] || '',
    imagePromptJson: JSON.stringify(prompts),
  });
}

async function onUploadAiImage(index: number, file: File) {
  imageUploading.value = index;
  try {
    const res: any = await uploadFile({ file, directory: 'xq/ai-image' });
    const url = String(res?.url || res?.data || res || '').trim();
    if (!url) {
      message.error('上传未返回地址');
      return false;
    }
    const next = wbImageSlots.value.map((s) => s.url);
    while (next.length <= index) next.push('');
    next[index] = url;
    uploadedAiImages.value = [...next];
    await persistAiImages(next.some((item) => item !== '') ? next : [url]);
    message.success('已上传 AI 图');
  } catch (error: any) {
    message.error(error?.message || '上传失败');
  } finally {
    imageUploading.value = null;
  }
  return false;
}

function clearAiImage(index: number) {
  const next = wbImageSlots.value.map((s) => s.url);
  next[index] = '';
  uploadedAiImages.value = [...next];
  persistAiImages(next);
}

watch(activeId, () => {
  uploadedAiImages.value = [];
});

const HEADER_FACT_LABEL: Record<string, string> = {
  sku: 'SKU',
  upc: 'UPC',
  brand: '品牌',
  price: '价格',
};

const tplGroups = computed(() => {
  const groups = {
    copyExtra: [] as TplField[],
    product: [] as TplField[],
    attr: [] as TplField[],
    unset: [] as TplField[],
    image: [] as TplField[],
    custom: [] as Array<{ fields: TplField[]; id: string; name: string }>,
  };
  const customMap = new Map<string, TplField[]>();
  const headerSeen = new Set<string>();
  for (const f of templateFields.value) {
    const factKey = resolveListingHeaderFactKey(f);
    // SKU / UPC / 品牌 / 价格：只在顶栏展示一次，不进分区
    if (factKey) {
      if (headerSeen.has(factKey)) continue;
      headerSeen.add(factKey);
      continue;
    }
    const row = classifyTplField(f);
    const zone = resolveListingFieldZone(f);
    if (zone === 'copy') {
      if (
        row.copyKind === 'title' ||
        row.copyKind === 'description' ||
        row.copyKind === 'feature'
      ) {
        continue;
      }
      // 卖点已有固定表单，不再重复展示 bullet_point 等
      if (/bullet|卖点|selling point|highlight/.test(fieldHay(f))) {
        continue;
      }
      groups.copyExtra.push(row);
      continue;
    }
    if (zone === 'product') {
      groups.product.push(row);
      continue;
    }
    if (zone === 'attr') {
      groups.attr.push(row);
      continue;
    }
    if (isListingImageField(f) || row.bucket === 'image') {
      groups.image.push(row);
      continue;
    }
    if (/^u_[a-z0-9_]{1,40}$/.test(zone)) {
      const list = customMap.get(zone) || [];
      list.push(row);
      customMap.set(zone, list);
      continue;
    }
    // other / 空分区 / 历史未分区 → 其他属性
    groups.unset.push(row);
  }
  const names = new Map(
    (fieldPool.value?.partitions || []).map((p) => [p.id, p.name || p.id]),
  );
  for (const [id, fields] of customMap) {
    groups.custom.push({
      id,
      name: names.get(id) || id,
      fields,
    });
  }
  return groups;
});

/** 顶栏仅保留 UPC/品牌只读摘要；SKU/价格改由特殊配置规则下拉 */
const headerFacts = computed(() => {
  const out: Array<{ key: string; label: string; value: string }> = [];
  const order = ['upc', 'brand'] as const;
  const picked = new Map<string, TplField>();
  for (const f of templateFields.value) {
    const key = resolveListingHeaderFactKey(f);
    if (!key || key === 'sku' || key === 'price' || picked.has(key)) continue;
    picked.set(key, classifyTplField(f));
  }
  for (const key of order) {
    const f = picked.get(key);
    if (!f) continue;
    out.push({
      key,
      label: HEADER_FACT_LABEL[key] || f.label || key,
      value: tplAttrValue(f),
    });
  }
  return out;
});

const skuRules = ref<XqSpecialConfigApi.SkuRule[]>([]);
const markupRules = ref<XqSpecialConfigApi.MarkupRule[]>([]);
const selectedSkuRuleId = ref<string | undefined>();
const selectedMarkupRuleId = ref<string | undefined>();

function pickDefaultRuleId(
  rules: Array<{
    enabled?: boolean;
    id?: string;
    isDefault?: boolean;
    ownerUserId?: string;
  }>,
) {
  const enabled = rules.filter((r) => r.enabled !== false && r.id);
  if (enabled.length === 0) return undefined;
  const me = myUserId.value ? String(myUserId.value) : '';
  const mineDefault = enabled.find(
    (r) => String(r.ownerUserId || '') === me && r.isDefault,
  );
  if (mineDefault?.id) return mineDefault.id;
  const mine = enabled.find((r) => String(r.ownerUserId || '') === me);
  if (mine?.id) return mine.id;
  const shopDefault = enabled.find((r) => r.isDefault);
  if (shopDefault?.id) return shopDefault.id;
  const shop = enabled.find((r) => !r.ownerUserId);
  if (shop?.id) return shop.id;
  return enabled[0]?.id;
}

async function loadSpecialRules() {
  const pid = listingPlatformId.value || lockedPlatformId.value;
  const shopId = listingShopId.value;
  if (!pid || !shopId) {
    skuRules.value = [];
    markupRules.value = [];
    selectedSkuRuleId.value = undefined;
    selectedMarkupRuleId.value = undefined;
    return;
  }
  try {
    const [sku, markup] = await Promise.all([
      getXqSkuRules(pid, shopId),
      getXqPriceMarkupRules(pid, shopId),
    ]);
    skuRules.value = (sku || []).filter((r) => r.enabled !== false);
    markupRules.value = (markup || []).filter((r) => r.enabled !== false);
    selectedSkuRuleId.value = pickDefaultRuleId(skuRules.value);
    selectedMarkupRuleId.value = pickDefaultRuleId(markupRules.value);
  } catch {
    skuRules.value = [];
    markupRules.value = [];
  }
}

const selectedSkuRule = computed(() =>
  skuRules.value.find((r) => r.id === selectedSkuRuleId.value),
);
const selectedMarkupRule = computed(() =>
  markupRules.value.find((r) => r.id === selectedMarkupRuleId.value),
);

function previewSkuByRule(rule?: XqSpecialConfigApi.SkuRule) {
  if (!rule) return '—';
  if (rule.skipSku) return '不生成';
  const shop =
    listingShops.value.find(
      (s) => s.id === (rule.shopId || listingShopId.value),
    )?.name || 'SHOP';
  const info = userStore.userInfo as null | Record<string, any>;
  const owner = rule.ownerUserName || info?.nickname || info?.username || 'xx';
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  return (
    (rule.segments || [])
      .map((seg) => {
        if (seg.type === 'text') return seg.value || '';
        if (seg.type === 'shopCode') return shop;
        if (seg.type === 'ownerInitials') return String(owner).slice(0, 2);
        if (seg.type === 'date') return ymd;
        if (seg.type === 'seq')
          return String(seg.start || 1).padStart(seg.width || 3, '0');
        if (seg.type === 'randomDigits')
          return ''.padStart(seg.width || 5, '0');
        return '';
      })
      .join('') || '—'
  );
}

/** 涨幅利润比文案，如 ×175%÷0.85 */
function markupRatioText(rule?: XqSpecialConfigApi.MarkupRule) {
  if (!rule) return '';
  if (rule.summary) return rule.summary.replaceAll(/货价\s*/g, '').trim();
  const v = Number(rule.value);
  const r = Number(rule.freightRate) || 0.85;
  if (!Number.isFinite(v) || r <= 0) return '';
  const rate = String(r);
  if (rule.mode === 'fixed') return `(+${v})÷${rate}`;
  if (rule.mode === 'percent') return `×${v}%÷${rate}`;
  if (rule.mode === 'ratio') return `×${v}÷${rate}`;
  return '';
}

function calcSellByMarkupRule(rule?: XqSpecialConfigApi.MarkupRule) {
  const base = Number(activeTask.value?.price);
  if (!rule || !Number.isFinite(base)) return '';
  const v = Number(rule.value);
  const r = Number(rule.freightRate) || 0.85;
  if (!Number.isFinite(v) || r <= 0) return '';
  let marked: number;
  if (rule.mode === 'fixed') marked = base + v;
  else if (rule.mode === 'percent') marked = base * (v / 100);
  else marked = base * v;
  return String(Math.round((marked / r) * 100) / 100);
}

/** 兼容字段映射：优先售价，否则只回涨幅比 */
function previewPriceByRule(rule?: XqSpecialConfigApi.MarkupRule) {
  return calcSellByMarkupRule(rule) || markupRatioText(rule) || '—';
}

const skuRuleOptions = computed(() =>
  skuRules.value.map((r) => {
    const who = r.ownerUserId ? r.ownerUserName || r.ownerUserId : '店铺通用';
    const name = r.name || 'SKU 规则';
    return {
      value: r.id!,
      label: r.isDefault ? `${name}（默认）` : name,
      title: `${name} · ${who}`,
    };
  }),
);

const markupRuleOptions = computed(() =>
  markupRules.value.map((r) => {
    const who = r.ownerUserId ? r.ownerUserName || r.ownerUserId : '店铺通用';
    const name = r.name || '价格规则';
    return {
      value: r.id!,
      label: r.isDefault ? `${name}（默认）` : name,
      title: `${name} · ${who}${r.summary ? ` · ${r.summary}` : ''}`,
    };
  }),
);

const headerImageSlots = computed(() => wbImageSlots.value);

/** 运营审图：对比原图 / AI 图，可写驳回原因 */
/** 右侧原内容侧栏：弹出 / 收起 */
const sourcePanelOpen = ref(false);
const sourceSku = computed(
  () => String(activeTask.value?.externalSku || '').trim() || '原内容',
);
const sourceFamily = computed(() => {
  const root = comboRootOf(activeTask.value);
  return root ? comboMembers(root) : [];
});

function toggleSourcePanel(force?: boolean) {
  sourcePanelOpen.value = force === undefined ? !sourcePanelOpen.value : force;
}

function onSelectSourceMember(row: XqWorkOrderApi.WorkOrder) {
  if (!row?.id) return;
  const root = comboRootOf(row);
  if (root?.id) expandedIds.value[root.id] = true;
  activeId.value = row.id;
}

const reviewOpen = ref(false);
const reviewIndex = ref(0);
const reviewRejectReason = ref('');
const reviewBusy = ref(false);

const reviewSlot = computed(
  () => headerImageSlots.value[reviewIndex.value] || null,
);

function openImageReview(index: number) {
  reviewIndex.value = index;
  reviewRejectReason.value = headerImageSlots.value[index]?.rejectReason || '';
  reviewOpen.value = true;
}

watch(reviewIndex, (i) => {
  if (!reviewOpen.value) return;
  reviewRejectReason.value = headerImageSlots.value[i]?.rejectReason || '';
});

async function submitImageReject() {
  const row = activeTask.value;
  if (!row?.id) return;
  const reason = reviewRejectReason.value.trim();
  if (!reason) {
    message.warning('请填写驳回原因');
    return;
  }
  reviewBusy.value = true;
  try {
    await updateXqWorkOrderImageStatus({
      id: row.id,
      imageStatus: 'rejected',
      rejectReason: reason,
      rejectIndex: reviewIndex.value,
    });
    message.success('已驳回该图，美工可在图片页红框中看到原因');
    reviewOpen.value = false;
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '驳回失败');
  } finally {
    reviewBusy.value = false;
  }
}

/** 审核中：当前任务（及同家族已出图成员）可确认图文进待上架 */
const isReviewPendingActive = computed(() => {
  const img = String(activeTask.value?.imageStatus || '').toLowerCase();
  return img === 'generated' || img === 'revised';
});

function reviewConfirmIds() {
  const root = comboRootOf(activeTask.value);
  let members: XqWorkOrderApi.WorkOrder[] = [];
  if (root) {
    members = comboMembers(root);
  } else if (activeTask.value) {
    members = [activeTask.value];
  }
  return members
    .filter((m) => {
      if (!m.id) return false;
      const img = String(m.imageStatus || '').toLowerCase();
      return img === 'generated' || img === 'revised';
    })
    .map((m) => m.id!);
}

function confirmReviewDone() {
  const row = activeTask.value;
  if (!row?.id) return;
  const ids = reviewConfirmIds();
  if (ids.length === 0) {
    message.warning('没有待确认的已出图任务');
    return;
  }
  Modal.confirm({
    title: '确认图文无误',
    content: `已核对「${row.itemCode || row.externalSku || row.title || row.id}」图片与文案？确认后 ${ids.length} 条将进入「待上架」。`,
    okText: '确认进入待上架',
    cancelText: '再看看',
    async onOk() {
      let ok = 0;
      let fail = 0;
      for (const id of ids) {
        try {
          await updateXqWorkOrderImageStatus({ id, imageStatus: 'done' });
          ok += 1;
        } catch {
          fail += 1;
        }
      }
      if (ok) {
        message.success(
          `已确认 ${ok} 条进入待上架${fail ? `，失败 ${fail}` : ''}`,
        );
        await loadTasks();
      } else {
        message.error('确认失败，请检查文案与图片是否齐全');
        throw new Error('确认失败');
      }
    },
  });
}

const showCopyInTemplate = computed(
  () => hasCategoryTemplate.value || Boolean(listingCategoryId.value),
);

const zoneCollapsed = reactive<Record<string, boolean>>({
  attr: true,
  other: true,
});
const zoneQuery = reactive<Record<string, string>>({ other: '' });
const showZh = ref(true);

type EditZone = {
  color: string;
  fields: TplField[];
  hasCopyForm?: boolean;
  hint: string;
  key: string;
  label: string;
};

function fieldSortLeaf(f: TplField) {
  const code = String(f.code || '');
  const i = code.lastIndexOf('.');
  return (i === -1 ? code : code.slice(i + 1)).toLowerCase();
}

/** 两层：先字段名（color / sku），再类目编码；必填 → 固定 → 非必填 */
function sortZoneFields(fields: TplField[]) {
  const rank = (f: TplField) => {
    if (f.fixed) return 1;
    if (f.required) return 0;
    return 2;
  };
  return [...fields].toSorted((a, b) => {
    const ar = rank(a);
    const br = rank(b);
    if (ar !== br) return ar - br;
    const leaf = fieldSortLeaf(a).localeCompare(fieldSortLeaf(b), 'en');
    if (leaf !== 0) return leaf;
    return String(a.code || '').localeCompare(String(b.code || ''), 'en');
  });
}

const editZones = computed((): EditZone[] => {
  const g = tplGroups.value;
  const partMap = new Map(
    (fieldPool.value?.partitions || []).map((p) => [p.id, p]),
  );
  const zoneOf = (
    key: string,
    fallbackLabel: string,
    fallbackColor: string,
    fallbackHint: string,
    fields: TplField[],
    hasCopyForm?: boolean,
  ): EditZone => {
    const fromOpt = LISTING_FIELD_ZONE_OPTIONS.find((z) => z.value === key);
    const p = partMap.get(key);
    return {
      key,
      label: p?.name || fromOpt?.label || fallbackLabel,
      color: p?.color || fallbackColor,
      hint: p?.keywords || fallbackHint,
      fields: sortZoneFields(fields),
      hasCopyForm,
    };
  };
  // 系统三区 → 用户自定义 →「其他属性」永远在尾
  const candidates: EditZone[] = [
    zoneOf(
      'copy',
      '产品文案',
      '#2563eb',
      '标题 · 卖点 · 长描述',
      g.copyExtra,
      true,
    ),
    zoneOf(
      'product',
      '产品基本信息',
      '#059669',
      '颜色 · 库存 · 其它基本信息',
      g.product,
    ),
    zoneOf('attr', '产品规格', '#d97706', '尺寸 · 重量 · 材质', g.attr),
  ];
  for (const z of g.custom) {
    const p = partMap.get(z.id);
    candidates.push({
      key: z.id,
      label: p?.name || z.name,
      hint: p?.keywords || '自定义分区',
      color: p?.color || '#7c3aed',
      fields: sortZoneFields(z.fields),
    });
  }
  candidates.push(
    zoneOf('other', '其他属性', '#94a3b8', '未归入任何分组的字段', g.unset),
  );
  // 只展示模板里实际有字段的分区；文案区有固定表单时保留
  return candidates.filter(
    (z) => z.fields.length > 0 || (z.hasCopyForm && showCopyInTemplate.value),
  );
});

function zoneOpen(key: string) {
  return zoneCollapsed[key] !== true;
}

function toggleZone(key: string) {
  zoneCollapsed[key] = zoneOpen(key);
}

function zoneCount(zone: EditZone) {
  return (zone.hasCopyForm ? 3 : 0) + zone.fields.length;
}

function zoneFieldVisible(zoneKey: string, f: TplField) {
  const q = (zoneQuery[zoneKey] || '').trim().toLowerCase();
  if (!q) return true;
  const zh = translateFieldLabel(f.label, f.code).toLowerCase();
  return (
    (f.label || '').toLowerCase().includes(q) ||
    (f.code || '').toLowerCase().includes(q) ||
    zh.includes(q)
  );
}

function textStats(text?: string) {
  const s = String(text || '').trim();
  const chars = s.length;
  const words = s ? s.split(/\s+/).filter(Boolean).length : 0;
  return `${chars} 字符 · ${words} 词`;
}

function parseSavedListingValues(row?: null | XqWorkOrderApi.WorkOrder) {
  if (!row?.listingValuesJson) return {} as Record<string, string>;
  try {
    const obj = JSON.parse(row.listingValuesJson);
    const out: Record<string, string> = {};
    if (obj && typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        out[k] = v === null || v === undefined ? '' : String(v);
      }
    }
    return out;
  } catch {
    return {};
  }
}

function resolveTplSource(src: string, row: XqWorkOrderApi.WorkOrder) {
  const copy = parseCopyJson(row);
  const points = parseSellingPoints(row.contentSellingPoints);
  const rawPrice =
    row.price === null || row.price === undefined ? '' : String(row.price);
  const marked = previewPriceByRule(selectedMarkupRule.value);
  const priceText = marked && marked !== '—' ? marked : rawPrice;
  const skuByRule = previewSkuByRule(selectedSkuRule.value);
  const map: Record<string, string> = {
    erp_sku:
      (skuByRule && skuByRule !== '—' && skuByRule !== '不生成'
        ? skuByRule
        : '') ||
      row.productSku ||
      row.externalSku ||
      '',
    upc: row.upc || '',
    ai_title: row.contentTitle || form.contentTitle || '',
    ai_description: String(copy.description || form.description || ''),
    ai_style: row.variantLabel || '',
    giga_sku: row.externalSku || '',
    product_name: row.title || '',
    brand: parseSavedListingValues(row).brand || '',
    color: row.mainColor || '',
    inventory:
      row.qtyAvailable === null || row.qtyAvailable === undefined
        ? ''
        : String(row.qtyAvailable),
    price_dropship: priceText,
    price_pickup: priceText,
    product_length: dimText(row.lengthCm),
    product_width: dimText(row.widthCm),
    product_height: dimText(row.heightCm),
    unit_inches: 'Inches',
    unit_pounds: 'Pounds',
  };
  for (let i = 1; i <= 8; i++) {
    map[`ai_bullet_${i}`] = points[i - 1] || '';
  }
  return map[src] || '';
}

function tplAttrValue(f: TplField) {
  const hay = fieldHay(f);
  const row = activeTask.value;
  if (!row) return '';
  if (f.valueSource) {
    const fromSrc = resolveTplSource(f.valueSource, row);
    if (fromSrc) return fromSrc;
  }
  if (/brand|品牌/.test(hay)) {
    return parseSavedListingValues(row).brand || '';
  }
  if (/upc|gtin/.test(hay)) return row.upc || '';
  if (/seller sku|shop sku|vendor style|item code|platform sku/.test(hay)) {
    return row.externalSku || '';
  }
  if (
    /\b(list\s*)?price\b|售价|单价|标价|销售价|selling price|item price|your price|standard price/.test(
      hay,
    )
  ) {
    return row.price === null || row.price === undefined
      ? ''
      : String(row.price);
  }
  if (/display color|color family|\bcolor\b|main color/.test(hay)) {
    return row.mainColor || row.variantLabel || '';
  }
  if (/qty|inventory|stock|库存/.test(hay)) {
    return row.qtyAvailable === null || row.qtyAvailable === undefined
      ? ''
      : String(row.qtyAvailable);
  }
  if (/length|长/.test(hay)) return dimText(row.lengthCm);
  if (/width|宽/.test(hay)) return dimText(row.widthCm);
  if (/height|高/.test(hay)) return dimText(row.heightCm);
  return '';
}

function fillTplFieldValues() {
  const row = activeTask.value;
  const saved = parseSavedListingValues(row);
  const next: Record<string, string> = {};
  for (const f of templateFields.value) {
    const code = f.code;
    if (!code) continue;
    const fromSaved = saved[code];
    if (fromSaved) {
      next[code] = fromSaved;
      continue;
    }
    if (f.valueSource && row) {
      next[code] = resolveTplSource(f.valueSource, row) || f.defaultValue || '';
      continue;
    }
    if (f.defaultValue) {
      next[code] = f.defaultValue;
      continue;
    }
    next[code] = row ? tplAttrValue({ ...f, bucket: 'other' }) : '';
  }
  const staleKeys = Object.keys(fieldValues).filter((k) => !(k in next));
  Object.assign(fieldValues, next);
  for (const key of staleKeys) {
    Reflect.deleteProperty(fieldValues, key);
  }
}

function dimText(v?: number) {
  if (v === undefined || v === null) return '';
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : String(v);
}

function findTask(id?: number) {
  if (!id) return null;
  for (const t of tasks.value) {
    if (t.id === id) return t;
    const hit = (t.variants || []).find((v) => v.id === id);
    if (hit) return hit;
  }
  return null;
}

function sourceImagesOf(row?: null | XqWorkOrderApi.WorkOrder) {
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

const sourceImages = computed(() => sourceImagesOf(activeTask.value));

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
  if (row.rpaCopyStatus === 'fail') return '文案失败';
  if (row.rpaCopyStatus === 'running') return '生成中';
  if (row.rpaCopyStatus === 'queued') return '排队中';
  if (row.rpaCopyStatus === 'inherited') return '沿用主体';
  if (row.rpaCopyStatus === 'success') return '文案完成';
  if (row.imageUserId) return '已分配美工';
  return '待跑文案';
}

function statusColor(row: XqWorkOrderApi.WorkOrder) {
  if (row.rpaCopyStatus === 'fail') return 'error';
  if (row.rpaCopyStatus === 'running') return 'processing';
  if (row.rpaCopyStatus === 'queued') return 'warning';
  if (row.rpaCopyStatus === 'inherited') return 'default';
  if (row.rpaCopyStatus === 'success') return 'success';
  if (row.imageUserId) return 'success';
  return 'default';
}

function isFamilyMain(
  member: XqWorkOrderApi.WorkOrder,
  root: XqWorkOrderApi.WorkOrder,
) {
  const members = comboMembers(root);
  return members[0]?.id === member.id;
}

function syncRpaSelectionFromTasks() {
  for (const root of tasks.value) {
    for (const m of comboMembers(root)) {
      if (!m.id) continue;
      // 主体始终勾选；变体跟库里的勾选状态
      rpaSelectedMap[m.id] = isFamilyMain(m, root) || !!m.copyRpaSelected;
    }
  }
}

function familyRootOfActive() {
  const row = activeTask.value;
  if (!row) return null;
  return comboRootOf(row);
}

function familyProgress(root: XqWorkOrderApi.WorkOrder) {
  const members = comboMembers(root);
  const done = members.filter((m) =>
    ['inherited', 'success'].includes(String(m.rpaCopyStatus || '')),
  ).length;
  const running = members.filter((m) =>
    ['queued', 'running'].includes(String(m.rpaCopyStatus || '')),
  ).length;
  return { total: members.length, done, running };
}

function familyProgressText(root: XqWorkOrderApi.WorkOrder) {
  const members = comboMembers(root);
  const variantN = Math.max(0, members.length - 1);
  const p = familyProgress(root);
  const shape = variantN > 0 ? `1 主体 · ${variantN} 变体` : '单品';
  if (p.running > 0)
    return `${shape} · ${p.done}/${p.total} · ${p.running} 进行中`;
  if (p.done > 0) return `${shape} · ${p.done}/${p.total} 已完成`;
  return shape;
}

function cleanText(v?: null | number | string) {
  const s = String(v ?? '').trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') {
    return '';
  }
  return s;
}

function skuLabel(row: XqWorkOrderApi.WorkOrder) {
  return (
    cleanText(row.externalSku) ||
    cleanText(row.itemCode) ||
    cleanText(row.title) ||
    (row.id === null || row.id === undefined ? '—' : String(row.id))
  );
}

function variantCaption(member: XqWorkOrderApi.WorkOrder) {
  return cleanText(member.variantLabel) || cleanText(member.mainColor) || '';
}

function toggleRpaSelect(
  member: XqWorkOrderApi.WorkOrder,
  root: XqWorkOrderApi.WorkOrder,
  on: boolean,
) {
  if (!member.id) return;
  if (isFamilyMain(member, root)) {
    rpaSelectedMap[member.id] = true;
    return;
  }
  rpaSelectedMap[member.id] = on;
}

async function enqueueFamilyCopyRpa() {
  const root = familyRootOfActive();
  if (!root?.id) {
    message.warning('请先选择左侧任务');
    return;
  }
  const members = comboMembers(root);
  const selectedIds = members
    .filter((m) => m.id && (isFamilyMain(m, root) || rpaSelectedMap[m.id!]))
    .map((m) => m.id!)
    .filter(Boolean);
  enqueueingRpa.value = true;
  try {
    const n = await enqueueXqWorkOrderCopyRpa({
      rootId: root.id,
      selectedIds,
    });
    message.success(
      `已入队 ${n} 条并自动触发文案 RPA；未勾选变体将在主体完成后沿用主体文案`,
    );
    await loadTasks({ soft: true });
  } catch (error: any) {
    message.error(error?.message || '入队失败');
  } finally {
    enqueueingRpa.value = false;
  }
}

async function testCopyPull(dryRun = true) {
  pullTestBusy.value = true;
  pullTestOpen.value = true;
  pullTestJson.value = '请求中…';
  try {
    const data = await pullXqWorkOrderCopyRpa({ dryRun, limit: 20 });
    pullTestJson.value = JSON.stringify(data, null, 2);
  } catch (error: any) {
    pullTestJson.value = error?.message || '拉取失败';
  } finally {
    pullTestBusy.value = false;
  }
}

function parseSellingPoints(raw?: unknown) {
  let lines: string[] = [];
  if (Array.isArray(raw)) {
    lines = raw
      .map((x) =>
        String(x ?? '')
          .replace(/^\s*[•·\-*\d.、)]+\s*/, '')
          .trim(),
      )
      .filter(Boolean);
  } else {
    const text = String(raw ?? '').trim();
    if (text.startsWith('[')) {
      try {
        return parseSellingPoints(JSON.parse(text));
      } catch {
        // fall through
      }
    }
    lines = text
      .split(/\r?\n+/)
      .map((l) => l.replace(/^\s*[•·\-*\d.、)]+\s*/, '').trim())
      .filter(Boolean);
  }
  return Array.from({ length: FEATURE_COUNT }, (_, i) => lines[i] || '');
}

function sellingPointsFromRow(row: XqWorkOrderApi.WorkOrder) {
  const fromCol = parseSellingPoints(row.contentSellingPoints);
  if (fromCol.some((p) => p.trim())) return fromCol;
  try {
    const raw = row.copyResultJson ? JSON.parse(row.copyResultJson) : null;
    if (raw && typeof raw === 'object') {
      const fromJson = parseSellingPoints(
        raw.sellingPoints ?? raw.bulletPoints ?? raw.bullets,
      );
      if (fromJson.some((p) => p.trim())) return fromJson;
    }
  } catch {
    // ignore
  }
  return fromCol;
}

function parseHighlightTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((x) => String(x || '').trim())
      .filter((s) => s && s.length <= 12);
  }
  const text = String(raw || '').trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    try {
      return parseHighlightTags(JSON.parse(text));
    } catch {
      // ignore
    }
  }
  const parts = text
    .split(/[,，、;；|/]+/)
    .map((s) => s.trim())
    .filter((s) => s && s.length <= 12);
  return parts.length >= 2 ? [...new Set(parts)] : [];
}

function parseCopyJson(row: XqWorkOrderApi.WorkOrder) {
  if (!row.copyResultJson) {
    return {
      highlightTags: [] as string[],
      description: '',
      copyPrompts: normalizeCopyPromptPack(null),
      raw: {} as Record<string, unknown>,
    };
  }
  try {
    const obj = JSON.parse(row.copyResultJson);
    return {
      highlightTags: parseHighlightTags(obj.highlightStyle),
      description: String(obj.description || '').trim(),
      copyPrompts: normalizeCopyPromptPack(obj.copyPrompts),
      raw: obj && typeof obj === 'object' ? obj : {},
    };
  } catch {
    return {
      highlightTags: [] as string[],
      description: '',
      copyPrompts: normalizeCopyPromptPack(null),
      raw: {} as Record<string, unknown>,
    };
  }
}

function applyCopyPrompts(pack: CopyPromptPack) {
  copyPrompts.title = pack.title || '';
  copyPrompts.description = pack.description || '';
  copyPrompts.features = Array.from(
    { length: FEATURE_COUNT },
    (_, i) => pack.features[i] || '',
  );
}

function fillForm(row: null | XqWorkOrderApi.WorkOrder) {
  if (!row) {
    form.contentTitle = '';
    form.sellingPoints = Array.from({ length: FEATURE_COUNT }, () => '');
    form.description = '';
    form.styleDescription = '';
    form.highlightTags = [];
    form.selectedHighlight = [];
    applyCopyPrompts(normalizeCopyPromptPack(null));
    listingCategoryId.value = undefined;
    listingShopId.value = undefined;
    listingCountryCode.value = undefined;
    return;
  }
  form.contentTitle = row.contentTitle || row.title || '';
  form.sellingPoints = sellingPointsFromRow(row);
  const parsed = parseCopyJson(row);
  form.description = parsed.description;
  form.styleDescription = row.variantLabel || row.mainColor || '';
  form.highlightTags = parsed.highlightTags;
  form.selectedHighlight = [...parsed.highlightTags];
  applyCopyPrompts(parsed.copyPrompts);
  const root = comboRootOf(row);
  listingCategoryId.value =
    asId(row.listingCategoryId) || asId(root?.listingCategoryId);
  listingShopId.value = asId(row.listingShopId) || asId(root?.listingShopId);
  listingCountryCode.value =
    asId(row.listingCountryCode) || asId(root?.listingCountryCode);
  ensureDefaultCountry();
  fillTplFieldValues();
}

const activePromptCount = computed(() => copyPromptCount(copyPrompts));

function buildMergedCopyResultJson(
  row: XqWorkOrderApi.WorkOrder,
  prompts: CopyPromptPack,
) {
  const parsed = parseCopyJson(row);
  const next = {
    ...parsed.raw,
    title: form.contentTitle.trim() || parsed.raw.title,
    sellingPoints:
      buildSellingText() ||
      parsed.raw.sellingPoints ||
      row.contentSellingPoints,
    description: form.description.trim() || parsed.description,
    highlightStyle: form.selectedHighlight,
    copyPrompts: {
      title: prompts.title.trim(),
      features: prompts.features.map((f) => String(f || '').trim()),
      description: prompts.description.trim(),
    },
  };
  return JSON.stringify(next);
}

async function saveCopyPrompts() {
  const row = activeTask.value;
  if (!row?.id) {
    message.warning('请先选择左侧任务');
    return;
  }
  promptSaving.value = true;
  try {
    await updateXqWorkOrder({
      id: row.id,
      copyResultJson: buildMergedCopyResultJson(row, copyPrompts),
    });
    message.success('文案提示词已保存');
    promptOpen.value = false;
    await loadTasks({ soft: true });
    const next = findTask(row.id);
    if (next) selectTask(next);
  } catch (error: any) {
    message.error(error?.message || '保存提示词失败');
    throw error instanceof Error
      ? error
      : new Error(error?.message || '保存失败');
  } finally {
    promptSaving.value = false;
  }
}

function openPromptModal() {
  if (!activeTask.value) {
    message.warning('请先选择左侧任务');
    return;
  }
  promptOpen.value = true;
}

function promptForRevise(
  target: 'all' | 'description' | 'feature' | 'title',
  featureIndex = 0,
) {
  if (target === 'title') return copyPrompts.title.trim();
  if (target === 'description') return copyPrompts.description.trim();
  if (target === 'feature') {
    return String(copyPrompts.features[featureIndex] || '').trim();
  }
  const parts = [
    copyPrompts.title && `【标题】${copyPrompts.title}`,
    ...copyPrompts.features
      .map((f, i) => (f.trim() ? `【卖点${i + 1}】${f.trim()}` : ''))
      .filter(Boolean),
    copyPrompts.description && `【长描述】${copyPrompts.description}`,
  ].filter(Boolean);
  return parts.join('\n');
}

async function persistCopyPromptsToOrder(
  order: XqWorkOrderApi.WorkOrder,
  pack: CopyPromptPack,
) {
  if (!order.id) return;
  let raw: Record<string, unknown>;
  try {
    raw = order.copyResultJson ? JSON.parse(order.copyResultJson) : {};
  } catch {
    raw = {};
  }
  const next = {
    ...raw,
    copyPrompts: {
      title: pack.title.trim(),
      features: pack.features.map((f) => String(f || '').trim()),
      description: pack.description.trim(),
    },
  };
  await updateXqWorkOrder({
    id: order.id,
    copyResultJson: JSON.stringify(next),
  });
}

function flatTaskMembers() {
  const out: XqWorkOrderApi.WorkOrder[] = [];
  for (const row of tasks.value) {
    out.push(...comboMembers(row));
  }
  return out;
}

async function onBatchCopyPromptFile(file: File) {
  batchPromptBusy.value = true;
  try {
    const rows = await parseCopyPromptsFromFile(file);
    const members = flatTaskMembers();
    const bySku = new Map(
      members
        .filter((m) => m.externalSku)
        .map((m) => [String(m.externalSku).trim(), m] as const),
    );
    let ok = 0;
    let skip = 0;
    for (const row of rows) {
      let sku = row.sku.trim();
      let pack: CopyPromptPack = {
        title: row.title,
        features: row.features,
        description: row.description,
      };
      if (!sku) {
        const cur = activeTask.value;
        if (!cur?.externalSku) {
          skip += 1;
          continue;
        }
        sku = cur.externalSku;
      }
      const target = bySku.get(sku);
      if (!target) {
        skip += 1;
        continue;
      }
      await persistCopyPromptsToOrder(target, pack);
      ok += 1;
      if (target.id === activeTask.value?.id) {
        applyCopyPrompts(pack);
      }
    }
    message.success(
      `已导入 ${ok} 条文案提示词${skip ? `，跳过 ${skip} 条（无匹配 SKU）` : ''}`,
    );
    batchPromptOpen.value = false;
    promptOpen.value = true;
    await loadTasks({ soft: true });
    if (activeTask.value?.id) {
      const next = findTask(activeTask.value.id);
      if (next) selectTask(next);
    }
  } catch (error: any) {
    message.error(error?.message || '导入失败');
  } finally {
    batchPromptBusy.value = false;
  }
  return false;
}

function selectTask(row: XqWorkOrderApi.WorkOrder) {
  activeId.value = row.id;
  fillForm(row);
  const parentId = row.parentWorkOrderId || row.id;
  if (parentId) {
    expandedIds.value = { ...expandedIds.value, [parentId]: true };
  }
}

function isLeftActive(row: XqWorkOrderApi.WorkOrder) {
  return row.id === activeId.value;
}

function ensureDefaultCountry() {
  if (listingShopId.value && !listingCountryCode.value) {
    listingCountryCode.value = 'US';
  }
}

async function loadTemplates() {
  const platformId = listingPlatformId.value;
  const shopId = listingShopId.value;
  const country = listingCountryCode.value;
  const categoryId = asId(listingCategoryId.value);
  fieldPool.value = null;
  categoryTemplate.value = null;
  templateLoaded.value = false;
  if (!platformId) return;
  templateLoading.value = true;
  try {
    // 分区配置仍可从 field-pool 取；表单字段必须以类目模板为准
    try {
      const pool = await getXqFieldPool({
        platformId,
        shopId,
        country,
      });
      fieldPool.value = pool || null;
    } catch {
      fieldPool.value = null;
    }
    categoryTemplate.value = categoryId
      ? await getXqCategoryFieldTemplate(categoryId)
      : null;
    templateLoaded.value = true;
    fillTplFieldValues();
  } catch {
    fieldPool.value = null;
    categoryTemplate.value = null;
    if (categoryId) {
      try {
        categoryTemplate.value = await getXqCategoryFieldTemplate(categoryId);
      } catch {
        categoryTemplate.value = null;
      }
    }
    templateLoaded.value = true;
    fillTplFieldValues();
  } finally {
    templateLoading.value = false;
  }
}

watch(activeTask, (row) => {
  if (row) fillForm(row);
  if (row?.imageUserId) {
    void resolveImageUserName(row.imageUserId);
  }
});

watch(
  listingPlatformId,
  async (platformId) => {
    listingCategories.value = [];
    listingShops.value = [];
    fieldPool.value = null;
    categoryTemplate.value = null;
    templateLoaded.value = false;
    if (!platformId) return;
    try {
      listingCategories.value =
        (await getXqListingCategories(platformId)) || [];
    } catch {
      listingCategories.value = [];
    }
    try {
      listingShops.value = (await getXqListingShops(platformId)) || [];
      if (!listingShopId.value && listingShops.value.length === 1) {
        listingShopId.value = asId(listingShops.value[0]!.id);
        ensureDefaultCountry();
        await Promise.all([persistListingMeta(), loadSpecialRules()]);
      } else {
        await loadSpecialRules();
      }
    } catch {
      listingShops.value = [];
    }
  },
  { immediate: true },
);

watch(listingShopId, () => {
  void loadSpecialRules();
});

watch(
  () =>
    [
      listingPlatformId.value,
      listingShopId.value,
      listingCountryCode.value,
      listingCategoryId.value,
    ] as const,
  async () => {
    ensureDefaultCountry();
    await loadTemplates();
  },
  { immediate: true },
);

async function persistListingMeta() {
  const row = activeTask.value;
  if (!row?.id) return;
  const shopId = asId(listingShopId.value);
  const categoryId = asId(listingCategoryId.value);
  const countryCode = asId(listingCountryCode.value) || '';
  const shop = listingShops.value.find((s) => asId(s.id) === shopId);
  const shopName = shop?.name || row.listingShopName || '';
  const categoryName =
    findCategoryName(listingCategories.value, categoryId) ||
    row.listingCategoryName ||
    '';
  const countryName = countryNameOf(countryCode);
  try {
    await updateXqWorkOrder({
      id: row.id,
      listingShopId: shopId || '',
      listingShopName: shopName,
      listingCategoryId: categoryId || '',
      listingCategoryName: categoryName,
      listingCountryCode: countryCode,
      listingCountryName: countryName,
    });
    row.listingShopId = shopId;
    row.listingShopName = shopName;
    row.listingCategoryId = categoryId;
    row.listingCategoryName = categoryName;
    row.listingCountryCode = countryCode;
    row.listingCountryName = countryName;
  } catch {
    // 选择先本地生效
  }
}

async function onListingShopChange(id?: string) {
  listingShopId.value = asId(id);
  ensureDefaultCountry();
  await Promise.all([persistListingMeta(), loadSpecialRules()]);
}

async function onListingCategoryChange(id?: string) {
  listingCategoryId.value = asId(id);
  await persistListingMeta();
}

async function onListingCountryChange(code?: string) {
  listingCountryCode.value = asId(code);
  await persistListingMeta();
}

async function loadTasks(opts?: { soft?: boolean }) {
  const soft = !!opts?.soft;
  if (soft) refreshing.value = true;
  else loading.value = true;
  try {
    const fid = Number(route.query.id);
    if (Number.isFinite(fid) && fid > 0) {
      const row = await getXqWorkOrder(fid);
      let root = row;
      if (row?.parentWorkOrderId) {
        root = (await getXqWorkOrder(row.parentWorkOrderId)) || row;
      }
      tasks.value = root ? [root] : [];
      total.value = root ? 1 : 0;
      const members = root ? comboMembers(root) : [];
      const keep =
        (activeId.value && members.find((m) => m.id === activeId.value)) ||
        members.find((m) => m.id === fid) ||
        members[0];
      if (keep) {
        if (soft && keep.id === activeId.value) {
          // 软刷新：只回填当前条，避免整页 Spin + 重选导致闪烁
          fillForm(keep);
        } else {
          selectTask(keep);
        }
      } else {
        fillForm(null);
      }
      return;
    }
    const res = await getXqWorkOrderPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      keyword: queryParams.keyword || undefined,
      status: 10,
      listingPlatformId: lockedPlatformId.value || undefined,
    });
    tasks.value = res?.list || [];
    total.value = Number(res?.total || 0);
    if (activeId.value && !findTask(activeId.value)) {
      activeId.value = undefined;
      fillForm(null);
    }
    if (!activeId.value && tasks.value[0]) {
      const first = comboMembers(tasks.value[0]!)[0];
      if (first) selectTask(first);
    } else if (activeId.value) {
      // 软/硬刷新都要回填当前选中条，否则 RPA 回调写库后右侧仍是旧空表单
      const keep = findTask(activeId.value);
      if (keep) fillForm(keep);
    }
  } catch (error: any) {
    message.error(error?.message || '加载失败');
  } finally {
    loading.value = false;
    refreshing.value = false;
    syncRpaSelectionFromTasks();
  }
}

function refreshTasks() {
  loadTasks({ soft: true });
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

function buildSellingText() {
  return form.sellingPoints
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith('•') ? p : `• ${p}`))
    .join('\n');
}

function openRegenerateCopy(
  target: 'all' | 'description' | 'feature' | 'title' = 'all',
  featureIndex = 0,
) {
  if (!activeTask.value?.id) {
    message.warning('请先选择左侧任务');
    return;
  }
  reviseTarget.value = target;
  reviseFeatureIndex.value =
    target === 'feature'
      ? Math.max(0, Math.min(FEATURE_COUNT - 1, featureIndex))
      : 0;
  revisionPrompt.value = promptForRevise(target, reviseFeatureIndex.value);
  regenerateOpen.value = true;
}

async function confirmRegenerateCopy() {
  const row = activeTask.value;
  if (!row?.id) return;
  regenerating.value = true;
  try {
    await regenerateXqWorkOrderCopy({
      id: row.id,
      target: reviseTarget.value,
      featureIndex:
        reviseTarget.value === 'feature' ? reviseFeatureIndex.value : undefined,
      revisionPrompt: revisionPrompt.value.trim(),
      contentTitle: form.contentTitle.trim(),
      contentSellingPoints: buildSellingText(),
      contentDescription: form.description.trim(),
    });
    regenerateOpen.value = false;
    message.success(
      `已提交「${reviseTargetLabel.value}」的 AI 改写，将参考现有内容与提示词，其它字段保持不变`,
    );
    await loadTasks();
    const next = findTask(row.id);
    if (next) selectTask(next);
  } catch (error: any) {
    message.error(error?.message || '提交重新生成失败');
  } finally {
    regenerating.value = false;
  }
}

async function saveCurrent() {
  const row = activeTask.value;
  if (!row?.id) {
    message.warning('请先选择左侧任务');
    return;
  }
  const sellingText = buildSellingText();
  saving.value = true;
  try {
    await updateXqWorkOrder({
      id: row.id,
      contentTitle: form.contentTitle.trim(),
      contentSellingPoints: sellingText,
      contentHighlight: JSON.stringify(form.selectedHighlight),
      contentDescription: form.description.trim(),
      listingCategoryId: listingCategoryId.value || '',
      listingCategoryName: findCategoryName(
        listingCategories.value,
        listingCategoryId.value,
      ),
      listingShopId: listingShopId.value || '',
      listingShopName:
        listingShops.value.find((s) => s.id === listingShopId.value)?.name ||
        '',
      listingCountryCode: listingCountryCode.value || '',
      listingCountryName: countryNameOf(listingCountryCode.value),
      listingValuesJson: JSON.stringify({
        ...parseSavedListingValues(row),
        ...fieldValues,
      }),
    });
    message.success('文案已保存');
    await loadTasks();
    const next = findTask(row.id);
    if (next) selectTask(next);
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

function hasCopyReady(row?: null | XqWorkOrderApi.WorkOrder) {
  if (!row) return false;
  if (row.contentTitle?.trim()) return true;
  return ['inherited', 'success'].includes(String(row.rpaCopyStatus || ''));
}

function isImageStarted(row?: null | XqWorkOrderApi.WorkOrder) {
  if (!row?.imageUserId) return false;
  return ['done', 'generated', 'rejected', 'revised', 'running'].includes(
    String(row.imageStatus || '').toLowerCase(),
  );
}

/** 家族内：主体有文案则变体一并分配；美工未开跑可改派 */
function collectAssignableIds(rows: XqWorkOrderApi.WorkOrder[]) {
  const main = rows[0];
  const mainReady = hasCopyReady(main);
  return rows
    .filter((t) => {
      if (!t.id || t.status !== 10) return false;
      if (isImageStarted(t)) return false;
      if (hasCopyReady(t)) return true;
      return (
        mainReady && Boolean(t.parentWorkOrderId || (main && t.id !== main.id))
      );
    })
    .map((t) => t.id!)
    .filter(Boolean);
}

function rememberImageUserName(
  uid?: null | number,
  nickname?: null | string,
  username?: null | string,
) {
  if (!uid) return;
  const name = String(nickname || username || '').trim();
  if (name) imageUserNameMap[uid] = name;
}

async function ensureImageUsersLoaded() {
  if (users.value.length > 0) return users.value;
  users.value = (await getXqAssignableImageUsers()) || [];
  for (const u of users.value) {
    rememberImageUserName(u.id, u.nickname, u.username);
  }
  return users.value;
}

async function resolveImageUserName(uid?: null | number) {
  if (!uid) return '';
  if (imageUserNameMap[uid]) return imageUserNameMap[uid];
  const hit = users.value.find((u) => u.id === uid);
  if (hit?.nickname || hit?.username) {
    rememberImageUserName(uid, hit.nickname, hit.username);
    return imageUserNameMap[uid] || '';
  }
  try {
    await ensureImageUsersLoaded();
    const again = users.value.find((u) => u.id === uid);
    if (again?.nickname || again?.username) {
      rememberImageUserName(uid, again.nickname, again.username);
      return imageUserNameMap[uid] || '';
    }
    const simple = await getSimpleUser(uid);
    rememberImageUserName(uid, simple?.nickname, simple?.username);
  } catch {
    /* 兜底显示 #id */
  }
  return imageUserNameMap[uid] || '';
}

function imageUserLabel(uid?: null | number) {
  if (!uid) return '';
  const name = imageUserNameMap[uid] || '';
  return name ? `已分配 ${name}` : `已分配 #${uid}`;
}

async function loadAssignableUsers() {
  await ensureImageUsersLoaded();
  if (myUserId.value && users.value.some((u) => u.id === myUserId.value)) {
    imageUserId.value = myUserId.value;
  } else if (users.value[0]?.id) {
    imageUserId.value = users.value[0].id;
  } else {
    imageUserId.value = undefined;
  }
}

/** 列表勾选批量分配 */
async function openAssign() {
  const ids = collectAssignableIds(unassignedSelected.value);
  if (ids.length === 0) {
    message.warning('请勾选尚未分配美工、且文案已完成的任务');
    return;
  }
  assignTargetIds.value = ids;
  assignOpen.value = true;
  try {
    await loadAssignableUsers();
  } catch (error: any) {
    users.value = [];
    message.error(error?.message || '加载美工列表失败');
  }
}

/** 编辑页：仅左侧勾选的 SKU 可分配美工（不整家族扩展） */
async function openAssignCurrent() {
  const row = activeTask.value;
  if (!row?.id) {
    message.warning('请先选择任务');
    return;
  }
  const root = familyRootOfActive() || row;
  const checked = comboMembers(root).filter(
    (m) => m.id && rpaSelectedMap[m.id],
  );
  if (checked.length === 0) {
    message.warning('请先勾选要分配的主体/变体');
    return;
  }
  const ids = collectAssignableIds(checked);
  if (ids.length === 0) {
    if (checked.some((m) => m.imageUserId && isImageStarted(m))) {
      message.warning('勾选项中美工已开始执行，无法改派');
    } else if (checked.some((m) => hasCopyReady(m))) {
      message.warning('勾选项没有可分配/改派的任务');
    } else {
      message.warning('请先完成文案再分配美工');
    }
    return;
  }
  assignTargetIds.value = ids;
  assignOpen.value = true;
  try {
    await loadAssignableUsers();
  } catch (error: any) {
    users.value = [];
    message.error(error?.message || '加载美工列表失败');
  }
}

async function confirmAssign() {
  if (!imageUserId.value) {
    message.warning('请选择美工人员');
    throw new Error('请选择美工人员');
  }
  const ids = assignTargetIds.value.filter(Boolean);
  if (ids.length === 0) {
    message.warning('没有可分配的任务');
    throw new Error('没有可分配的任务');
  }
  assigning.value = true;
  try {
    const n = await batchAssignXqWorkOrderImage({
      ids,
      imageUserId: imageUserId.value,
      listingPlatformId: lockedPlatformId.value || undefined,
      expandFamily: false,
    });
    const picked = users.value.find((u) => u.id === imageUserId.value);
    rememberImageUserName(
      imageUserId.value,
      picked?.nickname,
      picked?.username,
    );
    message.success(
      `已分配 ${n} 个任务给${imageUserNameMap[imageUserId.value!] || '美工'}`,
    );
    assignOpen.value = false;
    clearSelection();
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '分配失败');
    throw error instanceof Error
      ? error
      : new Error(error?.message || '分配失败');
  } finally {
    assigning.value = false;
  }
}

function canAssignCurrent() {
  const row = activeTask.value;
  if (!row?.id || row.status !== 10) return false;
  const root = familyRootOfActive() || row;
  const checked = comboMembers(root).filter(
    (m) => m.id && rpaSelectedMap[m.id],
  );
  return collectAssignableIds(checked).length > 0;
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

function toggleHighlight(tag: string, checked: boolean) {
  if (checked) {
    if (!form.selectedHighlight.includes(tag)) {
      form.selectedHighlight.push(tag);
    }
    return;
  }
  form.selectedHighlight = form.selectedHighlight.filter((t) => t !== tag);
}

function addHighlightTag() {
  const tag = tagDraft.value.trim().replaceAll(/[。.!！?？]/g, '');
  if (!tag) return;
  if (tag.length > 12) {
    message.warning('标签不超过 12 个字');
    return;
  }
  if (!form.highlightTags.includes(tag)) {
    form.highlightTags.push(tag);
  }
  if (!form.selectedHighlight.includes(tag)) {
    form.selectedHighlight.push(tag);
  }
  tagDraft.value = '';
}

function removeHighlightTag(tag: string) {
  form.highlightTags = form.highlightTags.filter((t) => t !== tag);
  form.selectedHighlight = form.selectedHighlight.filter((t) => t !== tag);
}

onMounted(async () => {
  void ensureImageUsersLoaded().catch(() => {
    /* 姓名展示兜底用 #id，失败不挡主流程 */
  });
  await loadTasks();
});

watch(lockedPlatformId, () => {
  handleSearch();
});

watch(
  () => String(route.query.id || ''),
  () => {
    loadTasks();
  },
);
</script>

<template>
  <Page auto-content-height>
    <div class="xq-copy-pool">
      <div v-if="!route.query.id" class="xq-toolbar">
        <Input.Search
          v-model:value="keyword"
          allow-clear
          class="xq-search"
          placeholder="搜索任务号 / Item Code / 标题"
          enter-button="搜索"
          @search="handleSearch"
        />
      </div>

      <Spin :spinning="loading">
        <div v-if="tasks.length" class="xq-split">
          <!-- 左：任务列表 -->
          <aside class="xq-list">
            <div v-if="familyRootOfActive()" class="xq-list-rpa-bar">
              <div class="xq-list-rpa-meta">
                <div>
                  <b>主体进度</b>
                  <span>{{ familyProgressText(familyRootOfActive()!) }}</span>
                </div>
                <Button
                  type="text"
                  size="small"
                  :loading="refreshing"
                  @click="refreshTasks"
                >
                  刷新
                </Button>
              </div>
              <Button
                type="primary"
                size="small"
                block
                :loading="enqueueingRpa"
                @click="enqueueFamilyCopyRpa"
              >
                执行文案
              </Button>
              <Button size="small" block @click="batchPromptOpen = true">
                批量导入提示词
              </Button>
            </div>
            <div v-for="row in tasks" :key="row.id" class="xq-list-group">
              <div
                v-for="member in comboMembers(row)"
                :key="member.id"
                class="xq-list-item"
                :class="{
                  active: isLeftActive(member),
                  main: isFamilyMain(member, row),
                  variant: !isFamilyMain(member, row),
                }"
                role="button"
                tabindex="0"
                @click="selectTask(member)"
                @keydown.enter="selectTask(member)"
              >
                <label class="xq-list-check" @click.stop>
                  <Checkbox
                    :checked="
                      !!member.id &&
                      (isFamilyMain(member, row) || !!rpaSelectedMap[member.id])
                    "
                    :disabled="isFamilyMain(member, row)"
                    @change="
                      (e: any) =>
                        toggleRpaSelect(member, row, !!e?.target?.checked)
                    "
                  />
                </label>
                <div class="xq-list-thumb">
                  <Image
                    :src="coverOf(member)"
                    :preview="false"
                    :width="40"
                    :height="40"
                  />
                </div>
                <div class="xq-list-body">
                  <div class="xq-list-sku" :title="skuLabel(member)">
                    {{ skuLabel(member) }}
                  </div>
                  <div
                    v-if="!isFamilyMain(member, row) && variantCaption(member)"
                    class="xq-list-variant"
                    :title="variantCaption(member)"
                  >
                    {{ variantCaption(member) }}
                  </div>
                  <div class="xq-list-flags">
                    <Tag
                      v-if="isFamilyMain(member, row)"
                      color="blue"
                      class="xq-mini-tag"
                    >
                      主体
                    </Tag>
                    <Tag v-else color="cyan" class="xq-mini-tag"> 变体 </Tag>
                    <Tag :color="statusColor(member)" class="xq-mini-tag">
                      {{ statusText(member) }}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>
            <div
              v-if="!route.query.id && total > pageSize"
              class="xq-list-pager"
            >
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
            <Alert
              v-if="isReviewPendingActive || route.query.review === '1'"
              type="warning"
              show-icon
              class="xq-review-banner"
              message="当前处于审核中：请核对成品图与文案，无误后点「确认图文无误」进入待上架；有问题可审图驳回。"
            />
            <div class="xq-detail-head">
              <div class="xq-head-imgs-bar">
                <div class="xq-head-imgs-title">
                  <div class="xq-head-imgs-title-left">
                    <b>成品图</b>
                    <span class="xq-head-imgs-count">
                      {{ wbImageFilled }} / {{ headerImageSlots.length }}
                    </span>
                    <span class="xq-muted">悬停可移除 · ≤5MB · png/jpg</span>
                  </div>
                  <div class="xq-head-imgs-actions">
                    <Button
                      type="primary"
                      ghost
                      size="small"
                      class="xq-review-entry"
                      :disabled="wbImageFilled === 0"
                      @click="openImageReview(0)"
                    >
                      <template #icon>
                        <IconifyIcon icon="lucide:scan-search" />
                      </template>
                      审图对比
                    </Button>
                    <Button
                      v-if="isReviewPendingActive"
                      type="primary"
                      size="small"
                      @click="confirmReviewDone"
                    >
                      确认图文无误
                    </Button>
                  </div>
                </div>
                <div class="xq-head-imgs">
                  <div
                    v-for="(slot, i) in headerImageSlots"
                    :key="`head-img-${i}`"
                    class="xq-wb-img"
                    :class="{
                      'has-url': !!slot.url,
                      'is-rejected': !!slot.rejectReason,
                    }"
                  >
                    <div v-if="slot.url" class="xq-wb-img-fill">
                      <Image
                        :src="slot.url"
                        :preview="true"
                        :width="72"
                        :height="72"
                      />
                      <button
                        type="button"
                        class="xq-wb-img-del"
                        title="移除"
                        @click.stop="clearAiImage(i)"
                      >
                        <IconifyIcon icon="lucide:x" />
                      </button>
                      <div
                        v-if="slot.rejectReason"
                        class="xq-wb-img-reject"
                        :title="slot.rejectReason"
                      >
                        {{ slot.rejectReason }}
                      </div>
                    </div>
                    <Upload
                      v-else
                      accept="image/*"
                      :show-upload-list="false"
                      :disabled="imageUploading !== null"
                      :before-upload="
                        (file) => {
                          onUploadAiImage(i, file as File);
                          return false;
                        }
                      "
                    >
                      <div class="xq-wb-img-upload">
                        <span>{{ imageUploading === i ? '…' : '+' }}</span>
                      </div>
                    </Upload>
                    <span class="xq-wb-img-label" :title="slot.label">{{
                      slot.label
                    }}</span>
                  </div>
                </div>
              </div>
              <div class="xq-head-meta">
                <div class="xq-head-row">
                  <div class="xq-head-fields">
                    <div class="xq-chip">
                      <span class="xq-listing-flag">平台</span>
                      <b class="xq-plat-name">{{
                        listingPlatformName || '当前平台'
                      }}</b>
                    </div>
                    <div class="xq-chip">
                      <span class="xq-listing-flag">店铺</span>
                      <Select
                        :value="listingShopId"
                        allow-clear
                        show-search
                        size="small"
                        option-filter-prop="label"
                        placeholder="选择店铺"
                        class="xq-chip-ctl"
                        :options="shopOptions"
                        :disabled="!listingPlatformId"
                        @change="(v: any) => onListingShopChange(v)"
                      />
                    </div>
                    <div class="xq-chip">
                      <span class="xq-listing-flag">分类</span>
                      <TreeSelect
                        :value="listingCategoryId"
                        allow-clear
                        show-search
                        size="small"
                        tree-default-expand-all
                        tree-node-filter-prop="title"
                        :tree-data="categoryTreeData"
                        :disabled="!listingPlatformId"
                        placeholder="选择分类"
                        class="xq-chip-ctl xq-chip-ctl-wide"
                        :dropdown-style="{
                          maxHeight: '360px',
                          overflow: 'auto',
                        }"
                        @change="(v: any) => onListingCategoryChange(v)"
                      />
                    </div>
                    <div class="xq-chip">
                      <span class="xq-listing-flag">国家</span>
                      <Select
                        :value="listingCountryCode"
                        allow-clear
                        show-search
                        size="small"
                        option-filter-prop="label"
                        placeholder="国家"
                        class="xq-chip-ctl xq-chip-ctl-sm"
                        :options="countryOptions"
                        @change="(v: any) => onListingCountryChange(v)"
                      />
                    </div>
                    <div
                      v-for="fact in headerFacts"
                      :key="fact.key"
                      class="xq-chip"
                    >
                      <span class="xq-listing-flag">{{ fact.label }}</span>
                      <b>{{ fact.value || '—' }}</b>
                    </div>
                  </div>
                  <div class="xq-head-actions">
                    <Button
                      size="small"
                      :type="sourcePanelOpen ? 'primary' : 'default'"
                      :title="sourcePanelOpen ? '关闭原内容' : '打开原内容抽屉'"
                      @click="toggleSourcePanel()"
                    >
                      {{ sourceSku }}
                    </Button>
                    <Button
                      size="small"
                      :type="activePromptCount ? 'primary' : 'default'"
                      title="查看 / 编辑文案提示词"
                      @click="openPromptModal"
                    >
                      提示词{{
                        activePromptCount ? ` ${activePromptCount}` : ''
                      }}
                    </Button>
                    <Tag
                      v-if="activeTask?.imageUserId"
                      color="purple"
                      :title="`用户 #${activeTask.imageUserId}`"
                    >
                      {{ imageUserLabel(activeTask.imageUserId) }}
                    </Tag>
                    <Button
                      size="small"
                      :disabled="!canAssignCurrent()"
                      @click="openAssignCurrent"
                    >
                      {{
                        activeTask?.imageUserId && !isImageStarted(activeTask)
                          ? '改派美工'
                          : '分配美工'
                      }}
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      :loading="saving"
                      @click="saveCurrent"
                    >
                      保存
                    </Button>
                  </div>
                </div>
                <div class="xq-head-row xq-head-rules">
                  <div class="xq-rule-card">
                    <span class="xq-listing-flag">SKU 规则</span>
                    <Select
                      v-model:value="selectedSkuRuleId"
                      allow-clear
                      show-search
                      size="small"
                      option-filter-prop="label"
                      placeholder="选特殊配置规则"
                      class="xq-rule-select"
                      :options="skuRuleOptions"
                      :disabled="!listingShopId || !skuRuleOptions.length"
                    />
                    <code
                      class="xq-rule-preview"
                      :title="previewSkuByRule(selectedSkuRule)"
                      >{{ previewSkuByRule(selectedSkuRule) }}</code>
                  </div>
                  <div class="xq-rule-card">
                    <span class="xq-listing-flag">价格规则</span>
                    <Select
                      v-model:value="selectedMarkupRuleId"
                      allow-clear
                      show-search
                      size="small"
                      option-filter-prop="label"
                      placeholder="选特殊配置规则"
                      class="xq-rule-select"
                      :options="markupRuleOptions"
                      :disabled="!listingShopId || !markupRuleOptions.length"
                    />
                    <span
                      v-if="selectedMarkupRule"
                      class="xq-rule-ratio"
                      :title="
                        selectedMarkupRule.summary ||
                        markupRatioText(selectedMarkupRule)
                      "
                    >
                      {{ markupRatioText(selectedMarkupRule) || '—' }}
                    </span>
                    <code
                      v-if="calcSellByMarkupRule(selectedMarkupRule)"
                      class="xq-rule-preview"
                      :title="`货价 ${activeTask?.price} → 售价 ${calcSellByMarkupRule(selectedMarkupRule)}`"
                    >
                      ≈{{ calcSellByMarkupRule(selectedMarkupRule) }}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="showCopyEditor" class="xq-copy-section">
              <div class="xq-edit-block">
                <Spin :spinning="templateLoading">
                  <div v-if="!listingPlatformId" class="xq-tpl-empty">
                    请从平台工作台进入后再加载模板字段
                  </div>
                  <div v-else-if="!listingCategoryId" class="xq-tpl-empty">
                    请先选择上方「分类」，将按该类目的表格/接口模板展示字段
                  </div>
                  <div
                    v-else-if="
                      templateLoaded &&
                      !templateLoading &&
                      editZones.length === 0
                    "
                    class="xq-tpl-empty"
                  >
                    当前分类暂无字段模板，请在类目字段配置里补齐后再编辑
                  </div>
                  <div v-else class="xq-zone-board">
                    <section
                      v-for="zone in editZones"
                      :key="zone.key"
                      class="xq-zone-col"
                      :class="{ collapsed: !zoneOpen(zone.key) }"
                      :style="{ '--zone-color': zone.color }"
                    >
                      <div class="xq-zone-h" @click="toggleZone(zone.key)">
                        <span class="caret">{{
                          zoneOpen(zone.key) ? '▾' : '▸'
                        }}</span>
                        <b>{{ zone.label }}</b>
                        <span>{{ zoneCount(zone) }}</span>
                      </div>
                      <template v-if="zoneOpen(zone.key)">
                        <div class="xq-zone-meta">
                          <p class="xq-zone-hint">{{ zone.hint }}</p>
                          <div class="xq-zone-tools" @click.stop>
                            <Input
                              v-model:value="zoneQuery[zone.key]"
                              allow-clear
                              size="small"
                              class="xq-zone-search"
                              placeholder="搜索字段名 / 编码"
                            />
                            <label class="xq-zh-switch">
                              翻译
                              <Switch v-model:checked="showZh" size="small" />
                            </label>
                            <Button
                              v-if="zone.hasCopyForm"
                              type="primary"
                              size="small"
                              ghost
                              @click.stop="openRegenerateCopy('all')"
                            >
                              AI 全部重写
                            </Button>
                          </div>
                        </div>
                        <div v-if="zone.hasCopyForm" class="xq-zone-copy">
                          <div class="xq-wb-copy wide">
                            <div class="xq-wb-copy-h">
                              <em>标题</em>
                              <span>{{ textStats(form.contentTitle) }}</span>
                              <button
                                type="button"
                                class="xq-auto-link"
                                @click.stop="openRegenerateCopy('title')"
                              >
                                AI 改写
                              </button>
                            </div>
                            <Input
                              v-model:value="form.contentTitle"
                              placeholder="优化后的产品标题"
                            />
                          </div>
                          <div class="xq-wb-copy wide">
                            <div class="xq-wb-copy-h">
                              <em>卖点</em>
                              <span>{{
                                  form.sellingPoints.filter((p) => p.trim())
                                    .length
                                }}/{{ form.sellingPoints.length }}</span>
                            </div>
                            <div class="xq-points-stack">
                              <div
                                v-for="(_, idx) in form.sellingPoints"
                                :key="`tpl-sp-${idx}`"
                                class="xq-point-row"
                              >
                                <Input
                                  v-model:value="form.sellingPoints[idx]"
                                  :placeholder="`卖点 ${idx + 1}`"
                                  allow-clear
                                />
                                <button
                                  type="button"
                                  class="xq-auto-link"
                                  @click.stop="
                                    openRegenerateCopy('feature', idx)
                                  "
                                >
                                  AI 改写
                                </button>
                              </div>
                            </div>
                          </div>
                          <div class="xq-wb-copy wide">
                            <div class="xq-wb-copy-h">
                              <em>长描述</em>
                              <span>{{ textStats(form.description) }}</span>
                              <button
                                type="button"
                                class="xq-auto-link"
                                @click.stop="openRegenerateCopy('description')"
                              >
                                AI 改写
                              </button>
                            </div>
                            <Input.TextArea
                              v-model:value="form.description"
                              :rows="6"
                              placeholder="英文 Product Description，完整句子"
                              allow-clear
                            />
                          </div>
                        </div>
                        <div v-if="zone.fields.length" class="xq-zone-list">
                          <EditFieldRow
                            v-for="f in zone.fields"
                            v-show="zoneFieldVisible(zone.key, f)"
                            :key="`${zone.key}-${f.code}`"
                            v-model="fieldValues[f.code]"
                            :code="f.code"
                            :label="f.label || f.code"
                            :required="!!f.required"
                            :fixed="!!f.fixed"
                            :group-label="f.groupLabel || ''"
                            :remark="f.remark || ''"
                            :show-zh="showZh"
                            :placeholder="f.defaultValue || f.code"
                            :type="f.type"
                            :values-list="f.valuesList"
                            :options="f.options"
                          />
                        </div>
                        <div
                          v-else-if="!zone.hasCopyForm"
                          class="xq-tpl-empty thin"
                        >
                          本分区暂无字段
                        </div>
                      </template>
                    </section>
                  </div>
                </Spin>
              </div>

              <div v-if="!showCopyInTemplate" class="xq-edit-block">
                <label class="xq-field-label">标题</label>
                <Input
                  v-model:value="form.contentTitle"
                  placeholder="优化后的产品标题"
                  allow-clear
                />
              </div>

              <div v-if="!showCopyInTemplate" class="xq-edit-block">
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

              <div v-if="!showCopyInTemplate" class="xq-edit-block">
                <label class="xq-field-label">长描述</label>
                <Input.TextArea
                  v-model:value="form.description"
                  :rows="8"
                  placeholder="英文 Product Description，完整句子"
                  allow-clear
                />
              </div>

              <div class="xq-edit-block">
                <label class="xq-field-label">
                  突出风格
                  <span class="xq-muted">（可选标签，勾选后给生图用，不要写成句子）</span>
                </label>
                <div class="xq-tag-row">
                  <Tag
                    v-for="tag in form.highlightTags"
                    :key="tag"
                    class="xq-style-tag"
                    :color="
                      form.selectedHighlight.includes(tag) ? 'blue' : 'default'
                    "
                    closable
                    @close="removeHighlightTag(tag)"
                    @click="
                      toggleHighlight(
                        tag,
                        !form.selectedHighlight.includes(tag),
                      )
                    "
                  >
                    {{ tag }}
                  </Tag>
                  <span v-if="!form.highlightTags.length" class="xq-muted">
                    暂无标签，可手加或重新生成文案
                  </span>
                </div>
                <div class="xq-tag-add">
                  <Input
                    v-model:value="tagDraft"
                    placeholder="添加风格标签，如 釉面陶瓷"
                    allow-clear
                    class="xq-tag-input"
                    @press-enter="addHighlightTag"
                  />
                  <Button @click="addHighlightTag">添加</Button>
                </div>
              </div>
            </div>
          </section>

          <Empty v-else class="xq-detail-empty" description="请选择左侧任务" />
        </div>
        <Empty
          v-else
          description="暂无数据：请先从选品库下发到工作台；若已下发请到「任务列表」确认"
        />
      </Spin>

      <!-- 原内容：半屏详情抽屉（选品库同款布局） -->
      <XqSourceProductDrawer
        v-model:open="sourcePanelOpen"
        :task="activeTask"
        :family="sourceFamily"
        @select-member="onSelectSourceMember"
      />
    </div>

    <Modal
      v-model:open="assignOpen"
      title="分配美工"
      :confirm-loading="assigning"
      ok-text="确认分配"
      destroy-on-close
      @ok="confirmAssign"
    >
      <p class="xq-assign-tip">
        仅分配左侧勾选的 {{ assignTargetIds.length }} 个
        SKU（不含未勾选变体）；分配后进入图片池待执行。
      </p>
      <div class="xq-assign-form">
        <label>美工人员（有图片权限的用户 / 自己）</label>
        <div class="xq-assign-user-row">
          <Select
            v-model:value="imageUserId"
            show-search
            option-filter-prop="label"
            placeholder="选择美工（可搜姓名）"
            style="flex: 1"
            :options="
              users.map((u) => ({
                label: `${u.nickname || u.username || '用户'} (#${u.id})`,
                value: u.id,
              }))
            "
          />
          <Button :disabled="!myUserId" @click="imageUserId = myUserId">
            分配给我
          </Button>
        </div>
      </div>
    </Modal>

    <Modal
      v-model:open="promptOpen"
      :title="`文案提示词 · ${sourceSku}`"
      :width="720"
      destroy-on-close
      :confirm-loading="promptSaving"
      ok-text="保存提示词"
      cancel-text="关闭"
      @ok="saveCopyPrompts"
    >
      <p class="xq-regen-tip">
        导入或填写后，点「AI
        改写」会自动带上对应项提示词；也可在此直接编辑后保存。
      </p>
      <label class="xq-regen-label">标题提示词</label>
      <Input.TextArea
        v-model:value="copyPrompts.title"
        :rows="2"
        allow-clear
        placeholder="例如：更突出材质与场景，控制在 150 字符内"
        class="xq-prompt-field"
      />
      <label class="xq-regen-label">卖点提示词</label>
      <div class="xq-points-stack">
        <Input
          v-for="(_, idx) in copyPrompts.features"
          :key="`cp-f-${idx}`"
          v-model:value="copyPrompts.features[idx]"
          :placeholder="`卖点 ${idx + 1} 提示词`"
          allow-clear
        />
      </div>
      <label class="xq-regen-label">长描述提示词</label>
      <Input.TextArea
        v-model:value="copyPrompts.description"
        :rows="4"
        allow-clear
        placeholder="例如：补充尺寸与适用场景，语气更专业，保持英文完整句子"
      />
    </Modal>

    <Modal
      v-model:open="batchPromptOpen"
      title="批量导入文案提示词"
      :footer="null"
      destroy-on-close
      :width="560"
    >
      <p class="xq-regen-tip">
        支持 Excel / JSON / txt。按 SKU
        写入当前列表任务的标题、卖点、长描述提示词；导入后可在「提示词」弹窗查看。
      </p>
      <div class="xq-batch-prompt-actions">
        <Button @click="exportCopyPromptTemplate(sourceSku)">
          下载 Excel 模板
        </Button>
        <Upload
          :show-upload-list="false"
          accept=".xlsx,.xls,.json,.txt"
          :disabled="batchPromptBusy"
          :before-upload="(file) => onBatchCopyPromptFile(file as File)"
        >
          <Button type="primary" :loading="batchPromptBusy">
            选择文件导入
          </Button>
        </Upload>
      </div>
      <pre class="xq-batch-prompt-sample">
sku, title, feature1…feature5, description
或 JSON：[{ "sku":"DYHY25318", "title":"…", "features":["…"], "description":"…" }]
或文本：【SKU】xxx / 【标题提示词】 / 【卖点1提示词】 / 【长描述提示词】</pre>
    </Modal>

    <Modal
      v-model:open="regenerateOpen"
      :title="`AI 改写 · ${reviseTargetLabel}`"
      :confirm-loading="regenerating"
      ok-text="开始改写"
      cancel-text="取消"
      @ok="confirmRegenerateCopy"
    >
      <p class="xq-regen-tip">
        本次只改写<strong>{{ reviseTargetLabel }}</strong>，会参考该项现有内容与你的提示词做二次修改；其它字段保持不变。
      </p>
      <label class="xq-regen-label">修改提示词（可选）</label>
      <Input.TextArea
        v-model:value="revisionPrompt"
        :rows="5"
        allow-clear
        :placeholder="
          reviseTarget === 'title'
            ? '例如：更突出复古风格与抽屉收纳，控制在 150 字符内'
            : reviseTarget === 'description'
              ? '例如：补充尺寸与适用场景，语气更专业，保持英文完整句子'
              : reviseTarget === 'feature'
                ? `例如：第 ${reviseFeatureIndex + 1} 条卖点强调易组装与承重`
                : '例如：标题更突出复古；卖点强调收纳；长描述补充场景'
        "
      />
    </Modal>

    <Modal
      v-model:open="reviewOpen"
      :title="`审图对比 · ${reviewSlot?.label || ''}`"
      :width="960"
      destroy-on-close
      :footer="null"
    >
      <Alert
        type="info"
        show-icon
        class="xq-review-tip"
        message="对照 Giga 原图与当前这张成品图。驳回原因只绑在这一张上，该图会红框显示原因。"
      />
      <div class="xq-review-grid">
        <div class="xq-review-col">
          <div class="xq-review-cap">Giga 原图参考</div>
          <div v-if="sourceImages.length" class="xq-review-thumbs">
            <div
              v-for="(url, si) in sourceImages"
              :key="`rv-src-${si}`"
              class="xq-review-thumb"
            >
              <Image :src="url" :preview="true" />
            </div>
          </div>
          <Empty v-else description="暂无原图" :image-size="48" />
        </div>
        <div class="xq-review-col is-ai">
          <div class="xq-review-cap">当前成品图</div>
          <div
            class="xq-review-main"
            :class="{ 'is-rejected': !!reviewSlot?.rejectReason }"
          >
            <Image
              v-if="reviewSlot?.url"
              :src="reviewSlot.url"
              :preview="true"
            />
            <span v-else>无图</span>
          </div>
          <p v-if="reviewSlot?.rejectReason" class="xq-review-reject-text">
            已驳回：{{ reviewSlot.rejectReason }}
          </p>
          <div class="xq-review-slot-nav">
            <Button
              size="small"
              :disabled="reviewIndex <= 0"
              @click="reviewIndex -= 1"
            >
              上一张
            </Button>
            <span class="xq-muted">
              {{ reviewIndex + 1 }} / {{ headerImageSlots.length }}
            </span>
            <Button
              size="small"
              :disabled="reviewIndex >= headerImageSlots.length - 1"
              @click="reviewIndex += 1"
            >
              下一张
            </Button>
          </div>
        </div>
      </div>
      <div class="xq-review-reason">
        <label>驳回原因 <span class="req">*</span></label>
        <Textarea
          v-model:value="reviewRejectReason"
          :rows="4"
          placeholder="例如：主图背景杂乱、产品比例失真、细节图未体现材质…"
        />
      </div>
      <div class="xq-review-footer">
        <Button @click="reviewOpen = false">关闭</Button>
        <Button
          type="primary"
          danger
          :loading="reviewBusy"
          :disabled="!reviewSlot?.url"
          @click="submitImageReject"
        >
          驳回图片
        </Button>
      </div>
    </Modal>

    <Modal
      v-model:open="pullTestOpen"
      title="rpa-copy-pull 探测"
      :width="560"
      destroy-on-close
      :footer="null"
    >
      <p class="xq-pull-test-tip">
        jobs 是可领取的 queued。deskSample 是你工作台上进行中任务的真实
        rpaCopyStatus / assigneeUserId，用来核对列表「排队中」和库是否一致。
      </p>
      <div class="xq-pull-test-actions">
        <Button
          size="small"
          :loading="pullTestBusy"
          @click="testCopyPull(true)"
        >
          再探测
        </Button>
      </div>
      <pre class="xq-pull-test-json">{{ pullTestJson }}</pre>
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

.xq-search {
  width: 280px;
}

.xq-split {
  display: grid;
  grid-template-columns: 228px minmax(0, 1fr);
  gap: 12px;
  align-items: stretch;
  min-height: 560px;
}

.xq-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: calc(100vh - 200px);
  padding: 10px;
  overflow: auto;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 12px;
}

.xq-list-rpa-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  margin-bottom: 2px;
  background: linear-gradient(180deg, #f0f7ff 0%, #f8fbff 100%);
  border: 1px solid #d6e8ff;
  border-radius: 10px;
}

.xq-list-rpa-meta {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  justify-content: space-between;
  font-size: 12px;
  line-height: 1.4;
  color: #64748b;
}

.xq-list-rpa-meta b {
  display: block;
  margin-bottom: 2px;
  color: #0f172a;
}

.xq-list-rpa-hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: #64748b;
}

.xq-pull-test-tip {
  margin: 0 0 8px;
  font-size: 13px;
  color: #64748b;
}

.xq-pull-test-actions {
  margin-bottom: 8px;
}

.xq-pull-test-json {
  max-height: 360px;
  padding: 10px 12px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.45;
  color: #0f172a;
  word-break: break-all;
  white-space: pre-wrap;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.xq-list-item {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
  padding: 8px;
  text-align: left;
  cursor: pointer;
  background: #fafafa;
  border: 1px solid transparent;
  border-radius: 10px;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.xq-list-item.main {
  background: #f8fafc;
}

.xq-list-item.variant {
  margin-left: 12px;
  background: #fff;
  border-left: 2px solid #e2e8f0;
}

.xq-list-item:hover {
  background: #f3f4f6;
}

.xq-list-variant {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  line-height: 1.3;
  color: #64748b;
  white-space: nowrap;
}

.xq-list-item.active {
  background: #eef5ff;
  border-color: #91caff;
  box-shadow: inset 3px 0 0 #1677ff;
}

.xq-list-check {
  flex: 0 0 auto;
  cursor: pointer;
}

.xq-list-thumb {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  overflow: hidden;
  background: #f3f4f6;
  border-radius: 6px;
}

.xq-list-thumb :deep(.ant-image),
.xq-list-thumb :deep(img) {
  width: 40px !important;
  height: 40px !important;
  object-fit: cover;
}

.xq-list-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.xq-list-sku {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
}

.xq-list-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.xq-mini-tag.ant-tag,
.xq-list-flags :deep(.ant-tag) {
  padding: 0 5px;
  margin: 0;
  font-size: 11px;
  line-height: 18px;
}

.xq-list-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.xq-list-item.nested {
  margin-left: 18px;
  background: #fff;
  border: 1px dashed #e5e7eb;
}

.xq-list-children {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 240px;
  overflow: auto;
}

.xq-list-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
  font-size: 11px;
  color: #9ca3af;
}

.xq-expand {
  padding: 0;
  font-size: 12px;
  color: #1677ff;
  cursor: pointer;
  background: none;
  border: 0;
}

.xq-tpl-card {
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #eee;
  border-radius: 8px;
}

.xq-tpl-card b {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
}

.xq-copy-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.xq-tpl-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.xq-tpl-empty {
  padding: 12px;
  font-size: 13px;
  color: #9ca3af;
  background: #fff;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
}

.xq-tpl-empty.thin {
  padding: 8px;
  margin: 0 0 4px;
}

.xq-zone-board {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.xq-zone-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 12px;
  background: #fafbfc;
  border: 1px solid #e8eaed;
  border-top: 3px solid var(--zone-color, #94a3b8);
  border-radius: 10px;
}

.xq-zone-col.collapsed {
  padding-bottom: 6px;
}

.xq-zone-h {
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.xq-zone-h .caret {
  flex: 0 0 auto;
  width: 12px;
  font-size: 12px;
  color: var(--zone-color, #6b7280);
}

.xq-zone-h b {
  flex: 1;
  font-size: 14px;
  color: #111827;
}

.xq-zone-h span {
  font-size: 12px;
  color: var(--zone-color, #6b7280);
}

.xq-zone-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
  justify-content: space-between;
  margin: 2px 0 8px;
}

.xq-zone-hint {
  flex: 1;
  min-width: 120px;
  margin: 0;
  font-size: 11px;
  color: #9ca3af;
}

.xq-zone-tools {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  margin: 0;
}

.xq-zone-search {
  width: 180px;
}

.xq-zone-tools :deep(.ant-input-affix-wrapper.xq-zone-search) {
  flex: 0 0 180px;
  width: 180px;
}

.xq-zh-switch {
  display: inline-flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: #4b5563;
  white-space: nowrap;
}

.xq-zone-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.xq-regen-tip {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.6;
  color: #4b5563;
}

.xq-regen-label {
  display: block;
  margin: 12px 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.xq-regen-label:first-of-type {
  margin-top: 0;
}

.xq-prompt-field {
  margin-bottom: 4px;
}

.xq-batch-prompt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.xq-batch-prompt-sample {
  padding: 10px 12px;
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #64748b;
  word-break: break-all;
  white-space: pre-wrap;
  background: #f8fafc;
  border: 1px solid #eef0f3;
  border-radius: 8px;
}

.xq-zone-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: visible;
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 8px;
}

@media (max-width: 960px) {
  .xq-zone-list {
    grid-template-columns: 1fr;
  }
}

.xq-wb {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.xq-wb-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
}

.xq-wb-head b {
  font-size: 13px;
  color: #111827;
}

.xq-wb-sec {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.xq-wb-sec-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.xq-wb-sec-title span {
  font-size: 12px;
  font-weight: 400;
  color: #9ca3af;
}

.xq-wb-sec-title b {
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  color: #16a34a;
}

.xq-wb-sec-title.more {
  width: 100%;
  padding: 0;
  cursor: pointer;
  background: none;
  border: 0;
}

.xq-wb-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.xq-wb-grid.scroll {
  max-height: 240px;
  overflow: auto;
}

.xq-wb-card,
.xq-wb-copy {
  padding: 8px 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.xq-wb-card.req,
.xq-wb-copy.wide {
  border-color: #e5e7eb;
}

.xq-wb-card.req {
  border-color: #fca5a5;
}

.xq-wb-copy.wide {
  grid-column: 1 / -1;
}

.xq-wb-card-h,
.xq-wb-copy-h {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
  font-size: 12px;
}

.xq-wb-card-h em,
.xq-wb-copy-h em {
  font-style: normal;
  font-weight: 600;
  color: #111827;
}

.xq-wb-copy-h span {
  color: #9ca3af;
}

.xq-wb .tag {
  font-size: 11px;
  color: #6b7280;
}

.xq-wb .tag.red {
  color: #dc2626;
}

.xq-wb .tag.gold {
  color: #d97706;
}

.xq-wb-copy-h i,
.xq-auto-link {
  padding: 0;
  margin-left: auto;
  font-size: 12px;
  font-style: normal;
  color: #16a34a;
  cursor: pointer;
  background: none;
  border: 0;
}

.xq-auto-link:hover {
  color: #059669;
  text-decoration: underline;
}

.xq-point-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.xq-point-row :deep(.ant-input-affix-wrapper),
.xq-point-row :deep(.ant-input) {
  flex: 1;
  min-width: 0;
}

.xq-point-row .xq-auto-link {
  flex-shrink: 0;
  margin-left: 0;
}

.xq-wb-copy :deep(.ant-input),
.xq-wb-copy :deep(textarea) {
  padding: 6px 8px;
  color: #111827;
  background: #fff;
  border-color: #e5e7eb;
  box-shadow: none;
}

.xq-wb-imgs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.xq-wb-img {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 72px;
  font-size: 11px;
  color: #6b7280;
  text-align: center;
}

.xq-wb-img-fill {
  position: relative;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.xq-wb-img.has-url:hover .xq-wb-img-fill {
  border-color: #93c5fd;
  box-shadow: 0 2px 8px rgb(37 99 235 / 12%);
}

.xq-wb-img.is-rejected .xq-wb-img-fill {
  border-color: #ef4444;
  box-shadow: 0 0 0 1px rgb(239 68 68 / 35%);
}

.xq-wb-img-reject {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  padding: 3px 4px 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10px;
  line-height: 1.25;
  color: #fff;
  white-space: nowrap;
  background: linear-gradient(180deg, transparent, rgb(185 28 28 / 92%) 40%);
}

.xq-wb-img-label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  line-height: 1.25;
  color: #64748b;
  white-space: nowrap;
}

.xq-wb-img-del {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: #fff;
  cursor: pointer;
  background: rgb(15 23 42 / 55%);
  border: 0;
  border-radius: 6px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.xq-wb-img-del :deep(svg) {
  width: 12px;
  height: 12px;
}

.xq-wb-img-fill:hover .xq-wb-img-del {
  opacity: 1;
}

.xq-reject-alert {
  margin-bottom: 4px;
}

.xq-head-imgs-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 12px;
}

.xq-head-imgs-title {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.xq-head-imgs-title-left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.xq-head-imgs-title b {
  font-size: 13px;
  color: #0f172a;
}

.xq-head-imgs-count {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 650;
  color: #1d4ed8;
  background: #dbeafe;
  border-radius: 999px;
}

.xq-review-banner {
  margin: 0 0 10px;
}

.xq-head-imgs-actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.xq-review-entry {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-weight: 600;
}

.xq-review-tip {
  margin-bottom: 12px;
}

.xq-review-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

.xq-review-col {
  min-width: 0;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.xq-review-col.is-ai {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.xq-review-cap {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 650;
  color: #334155;
}

.xq-review-thumbs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  max-height: 320px;
  overflow: auto;
}

.xq-review-thumb {
  aspect-ratio: 1;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.xq-review-thumb :deep(.ant-image),
.xq-review-thumb :deep(img),
.xq-review-main :deep(.ant-image),
.xq-review-main :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-review-main {
  aspect-ratio: 1;
  overflow: hidden;
  background: #fff;
  border: 1px solid #86efac;
  border-radius: 10px;
}

.xq-review-main.is-rejected {
  border-color: #ef4444;
  box-shadow: 0 0 0 1px rgb(239 68 68 / 25%);
}

.xq-review-reject-text {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: #b91c1c;
}

.xq-review-main span {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
}

.xq-review-slot-nav {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.xq-review-reason label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.xq-review-reason .req {
  color: #ef4444;
}

.xq-review-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 14px;
}

.xq-wb-img-upload {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  color: #94a3b8;
  cursor: pointer;
  background: #fff;
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background-color 0.15s ease;
}

.xq-wb-img-upload:hover {
  color: #2563eb;
  background: #eff6ff;
  border-color: #93c5fd;
}

.xq-wb-img-upload span {
  font-size: 20px;
  line-height: 1;
  color: inherit;
}

.xq-wb-img :deep(.ant-image),
.xq-wb-img :deep(img) {
  display: block;
  width: 72px;
  height: 72px;
  object-fit: cover;
}

@media (max-width: 1100px) {
  .xq-wb-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.xq-tpl-json {
  max-height: 160px;
  margin: 0;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.45;
  color: #374151;
  white-space: pre-wrap;
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
  max-height: calc(100vh - 200px);
  padding: 16px;
  overflow: auto;
  background: #fff;
  border: 1px solid #e8eaed;
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
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 12px;
  margin-bottom: 4px;
  border-bottom: 1px solid #f0f2f5;
}

.xq-head-imgs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.xq-head-imgs .xq-wb-img-fill :deep(.ant-image),
.xq-head-imgs .xq-wb-img-fill :deep(img) {
  width: 72px !important;
  height: 72px !important;
  object-fit: cover;
}

.xq-head-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.xq-head-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  align-items: center;
  justify-content: space-between;
}

.xq-head-fields {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 6px 8px;
  align-items: center;
  min-width: 0;
}

.xq-head-actions {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
}

.xq-chip {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  height: 30px;
  padding: 0 8px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 8px;
}

.xq-chip b {
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.xq-chip-ctl {
  width: 120px;
}

.xq-chip-ctl-wide {
  width: 148px;
}

.xq-chip-ctl-sm {
  width: 96px;
}

.xq-chip :deep(.ant-select-selector),
.xq-chip :deep(.ant-select-selection-item),
.xq-chip :deep(.ant-select-selection-placeholder) {
  font-size: 12px !important;
}

.xq-head-rules {
  justify-content: flex-start;
  padding-top: 2px;
  border-top: 1px dashed #eef2f7;
}

.xq-rule-card {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  height: 32px;
  padding: 0 10px;
  background: #fff;
  border: 1px solid #e8edf3;
  border-radius: 8px;
}

.xq-rule-select {
  width: 156px;
}

.xq-rule-select :deep(.ant-select-selector) {
  font-size: 12px !important;
}

.xq-rule-ratio {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 600;
  color: #0f766e;
  white-space: nowrap;
}

.xq-rule-preview {
  display: inline-block;
  max-width: 100px;
  padding: 1px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 20px;
  color: #334155;
  white-space: nowrap;
  background: #f1f5f9;
  border-radius: 4px;
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
  align-items: center;
  font-size: 13px;
}

.xq-listing-pickers {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.xq-listing-field {
  display: flex;
  flex: 1;
  gap: 6px;
  align-items: center;
  min-width: 160px;
}

.xq-listing-flag {
  flex: 0 0 auto;
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.xq-plat-name {
  flex: 0 0 auto;
  max-width: 120px;
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

.xq-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-height: 32px;
}

.xq-style-tag {
  cursor: pointer;
}

.xq-tag-add {
  display: flex;
  gap: 8px;
  max-width: 360px;
}

.xq-tag-input {
  flex: 1;
}

.xq-assign-tip {
  margin: 0 0 10px;
  font-size: 13px;
  color: #6b7280;
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

.xq-assign-user-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.xq-assign-user-row :deep(.ant-select) {
  flex: 1;
}
</style>
