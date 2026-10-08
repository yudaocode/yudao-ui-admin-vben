<script lang="ts" setup>
import type { XqListingApi } from '#/api/xq/listing';
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

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
  Switch,
  Tag,
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
} from '#/api/xq/listing';
import {
  batchAssignXqWorkOrderImage,
  batchCloseXqWorkOrder,
  closeXqWorkOrder,
  enqueueXqWorkOrderCopyRpa,
  getXqAssignableImageUsers,
  getXqWorkOrder,
  getXqWorkOrderPage,
  regenerateXqWorkOrderCopy,
  updateXqWorkOrder,
} from '#/api/xq/work-order';
import { useDeskPlatformId } from '#/views/xq/desk/use-desk-scope';
import {
  dedupeListingFieldsByCode,
  isListingImageField,
  resolveListingFieldZone,
} from '#/views/xq/product/listing-field-zone';
import { translateFieldLabel } from '#/views/xq/product/template-config/field-label-zh';

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
/** 左侧勾选：独立跑文案 RPA 的变体 id（主体始终包含） */
const rpaSelectedMap = reactive<Record<number, boolean>>({});
const enqueueingRpa = ref(false);
const refreshing = ref(false);

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
  const parentOffer = Boolean(
    row.mainColor ||
    row.variantLabel ||
    (row.price !== null && row.price !== undefined) ||
    (row.qtyAvailable !== null && row.qtyAvailable !== undefined),
  );
  const childOffer = kids.some((k) =>
    Boolean(
      k.mainColor ||
      k.variantLabel ||
      (k.price !== null && k.price !== undefined) ||
      (k.qtyAvailable !== null && k.qtyAvailable !== undefined),
    ),
  );
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

const templateFields = computed(() => {
  const pool = fieldPool.value?.fields;
  const raw =
    pool && pool.length > 0 ? pool : categoryTemplate.value?.fields || [];
  return dedupeListingFieldsByCode(raw);
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

function isOriginalProductUrl(url?: string) {
  const u = String(url || '').trim();
  if (!u) return true;
  if (sourceImages.value.includes(u)) return true;
  const row = activeTask.value || familyParent.value;
  return Boolean(row?.coverUrl && row.coverUrl === u);
}

const aiImages = computed(() => {
  const urls: string[] = [];
  const row = activeTask.value;
  const push = (url?: string) => {
    const u = String(url || '').trim();
    if (!u || isOriginalProductUrl(u) || urls.includes(u)) return;
    urls.push(u);
  };
  push(row?.generatedImageUrl);
  for (const p of imagePrompts.value) {
    push(p.resultUrl);
    push(p.generatedImageUrl);
    if (p.marker === 'ai' || p.imageType === 'generated') {
      push(p.imageUrl);
    }
  }
  try {
    const obj = row?.copyResultJson ? JSON.parse(row.copyResultJson) : {};
    const extra = obj.generatedImages || obj.aiImages;
    if (Array.isArray(extra)) extra.forEach((x: any) => push(String(x)));
  } catch {
    // ignore
  }
  return urls;
});

const uploadedAiImages = ref<string[]>([]);
const imageUploading = ref<null | number>(null);

const wbImageFieldLabels = computed(() => {
  const fromTpl = (tplGroups.value.image || [])
    .map((f) => f.label || f.code)
    .filter(Boolean);
  if (!hasCopyContent.value && fromTpl.length > 0) {
    return fromTpl.slice(0, 12);
  }
  if (fromTpl.length > 0) {
    return fromTpl.slice(0, 5);
  }
  return ['主图', '附图 1', '附图 2', '附图 3', '附图 4'];
});

const wbImageSlots = computed(() => {
  const labels = wbImageFieldLabels.value;
  return labels.map((label, i) => ({
    label: i === 0 && label === labels[0] ? label : label,
    url: uploadedAiImages.value[i] || aiImages.value[i] || '',
  }));
});

const wbImageFilled = computed(
  () => wbImageSlots.value.filter((s) => s.url).length,
);

async function persistAiImages(urls: string[]) {
  const row = activeTask.value;
  if (!row?.id) return;
  const prompts = imagePrompts.value.map((p, i) => ({
    ...p,
    resultUrl: urls[i] || (p as ImagePromptItem).resultUrl || '',
  }));
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
  for (const f of templateFields.value) {
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

const headerFacts = computed(() => {
  const out: Array<{ key: string; label: string; value: string }> = [];
  const seen = new Set<string>();
  for (const f of templateFields.value) {
    const hay = fieldHay(f);
    let key = '';
    if (/\bbrand\b|品牌/.test(hay)) key = 'brand';
    else if (/\bupc\b|\bgtin\b/.test(hay)) key = 'upc';
    else if (
      /(seller sku|shop sku|vendor style|item code|platform sku|\bsku\b)/.test(
        hay,
      ) &&
      !/parent sku/.test(hay)
    ) {
      key = 'sku';
    }
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      key,
      label: f.label || key,
      value: tplAttrValue(classifyTplField(f)),
    });
  }
  return out;
});

const headerImageSlots = computed(() => {
  const slots = wbImageSlots.value;
  const n = Math.max(slots.length, 8);
  return Array.from({ length: n }, (_, i) => {
    return (
      slots[i] || {
        label: i === 0 ? '主图' : `附图 ${i}`,
        url: '',
      }
    );
  });
});

const showCopyInTemplate = computed(
  () => hasCategoryTemplate.value || Boolean(listingCategoryId.value),
);

const zoneCollapsed = reactive<Record<string, boolean>>({ other: true });
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

const editZones = computed((): EditZone[] => {
  const g = tplGroups.value;
  const zones: EditZone[] = [
    {
      key: 'copy',
      label: '产品文案',
      hint: '标题 · 卖点 · 长描述',
      color: '#2563eb',
      hasCopyForm: true,
      fields: g.copyExtra,
    },
    {
      key: 'product',
      label: '产品基本信息',
      hint: 'SKU · UPC · 颜色 · 库存',
      color: '#059669',
      fields: g.product,
    },
    {
      key: 'attr',
      label: '产品规格',
      hint: '尺寸 · 重量 · 品牌 · 材质',
      color: '#d97706',
      fields: g.attr,
    },
    {
      key: 'other',
      label: '其他属性',
      hint: '其余上架字段',
      color: '#94a3b8',
      fields: g.unset,
    },
  ];
  for (const z of g.custom) {
    zones.push({
      key: z.id,
      label: z.name,
      hint: '自定义分区',
      color: '#7c3aed',
      fields: z.fields,
    });
  }
  return zones;
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
  const map: Record<string, string> = {
    erp_sku: row.productSku || row.externalSku || '',
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
  if (/brand|品牌/.test(hay)) {
    return parseSavedListingValues(row).brand || '';
  }
  if (/upc|gtin/.test(hay)) return row.upc || '';
  if (/seller sku|shop sku|vendor style|item code|platform sku/.test(hay)) {
    return row.externalSku || '';
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
  const p = familyProgress(root);
  if (p.running > 0) return `${p.done}/${p.total} · ${p.running} 进行中`;
  if (p.done > 0) return `${p.done}/${p.total} 已完成`;
  return `${p.total} 个变体`;
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
      `已入队 ${n} 条文案 RPA（扁平拉取）；未勾选变体将在主体完成后沿用主体文案`,
    );
    await loadTasks({ soft: true });
  } catch (error: any) {
    message.error(error?.message || '入队失败');
  } finally {
    enqueueingRpa.value = false;
  }
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
    return { highlightTags: [] as string[], description: '' };
  }
  try {
    const obj = JSON.parse(row.copyResultJson);
    return {
      highlightTags: parseHighlightTags(obj.highlightStyle),
      description: String(obj.description || '').trim(),
    };
  } catch {
    return { highlightTags: [] as string[], description: '' };
  }
}

function fillForm(row: null | XqWorkOrderApi.WorkOrder) {
  if (!row) {
    form.contentTitle = '';
    form.sellingPoints = Array.from({ length: FEATURE_COUNT }, () => '');
    form.description = '';
    form.styleDescription = '';
    form.highlightTags = [];
    form.selectedHighlight = [];
    listingCategoryId.value = undefined;
    listingShopId.value = undefined;
    listingCountryCode.value = undefined;
    return;
  }
  form.contentTitle = row.contentTitle || row.title || '';
  form.sellingPoints = parseSellingPoints(row.contentSellingPoints);
  const parsed = parseCopyJson(row);
  form.description = parsed.description;
  form.styleDescription = row.variantLabel || row.mainColor || '';
  form.highlightTags = parsed.highlightTags;
  form.selectedHighlight = [...parsed.highlightTags];
  const root = comboRootOf(row);
  listingCategoryId.value =
    asId(row.listingCategoryId) || asId(root?.listingCategoryId);
  listingShopId.value = asId(row.listingShopId) || asId(root?.listingShopId);
  listingCountryCode.value =
    asId(row.listingCountryCode) || asId(root?.listingCountryCode);
  ensureDefaultCountry();
  fillTplFieldValues();
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
  const categoryId = listingCategoryId.value;
  fieldPool.value = null;
  categoryTemplate.value = null;
  templateLoaded.value = false;
  if (!platformId) return;
  templateLoading.value = true;
  try {
    const pool = await getXqFieldPool({
      platformId,
      shopId,
      country,
    });
    fieldPool.value = pool || null;
    if ((pool?.fields?.length || 0) === 0 && categoryId) {
      categoryTemplate.value = await getXqCategoryFieldTemplate(categoryId);
    }
    templateLoaded.value = true;
    fillTplFieldValues();
  } catch {
    fieldPool.value = null;
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
        await persistListingMeta();
      }
    } catch {
      listingShops.value = [];
    }
  },
  { immediate: true },
);

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
  await persistListingMeta();
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
  revisionPrompt.value = '';
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
            </div>
            <div v-for="row in tasks" :key="row.id" class="xq-list-group">
              <div
                v-for="member in comboMembers(row)"
                :key="member.id"
                class="xq-list-item"
                :class="{
                  active: isLeftActive(member),
                  main: isFamilyMain(member, row),
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
                  <div class="xq-list-sku" :title="member.externalSku">
                    {{ member.externalSku || '—' }}
                  </div>
                  <div class="xq-list-flags">
                    <Tag
                      v-if="isFamilyMain(member, row)"
                      color="blue"
                      class="xq-mini-tag"
                    >
                      主体
                    </Tag>
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
            <div class="xq-detail-head">
              <div class="xq-head-imgs">
                <div
                  v-for="(slot, i) in headerImageSlots"
                  :key="`head-img-${i}`"
                  class="xq-wb-img"
                >
                  <div v-if="slot.url" class="xq-wb-img-fill">
                    <Image
                      :src="slot.url"
                      :preview="true"
                      :width="80"
                      :height="80"
                    />
                    <button
                      type="button"
                      class="xq-wb-img-del"
                      @click="clearAiImage(i)"
                    >
                      移除
                    </button>
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
                      <em>{{ slot.label }}</em>
                    </div>
                  </Upload>
                </div>
              </div>
              <p class="xq-head-hint">图片 ≤ 5MB，支持 png / jpg / jpeg</p>
              <div class="xq-head-meta">
                <div class="xq-head-fields">
                  <div class="xq-listing-field">
                    <span class="xq-listing-flag">平台</span>
                    <b class="xq-plat-name">{{
                      listingPlatformName || '当前平台'
                    }}</b>
                  </div>
                  <div class="xq-listing-field">
                    <span class="xq-listing-flag">店铺</span>
                    <Select
                      :value="listingShopId"
                      allow-clear
                      show-search
                      option-filter-prop="label"
                      placeholder="选择店铺"
                      style="min-width: 132px"
                      :options="shopOptions"
                      :disabled="!listingPlatformId"
                      @change="(v: any) => onListingShopChange(v)"
                    />
                  </div>
                  <div class="xq-listing-field">
                    <span class="xq-listing-flag">分类</span>
                    <TreeSelect
                      :value="listingCategoryId"
                      allow-clear
                      show-search
                      tree-default-expand-all
                      tree-node-filter-prop="title"
                      :tree-data="categoryTreeData"
                      :disabled="!listingPlatformId"
                      placeholder="选择分类"
                      style="min-width: 160px"
                      :dropdown-style="{ maxHeight: '360px', overflow: 'auto' }"
                      @change="(v: any) => onListingCategoryChange(v)"
                    />
                  </div>
                  <div class="xq-listing-field">
                    <span class="xq-listing-flag">国家</span>
                    <Select
                      :value="listingCountryCode"
                      allow-clear
                      show-search
                      option-filter-prop="label"
                      placeholder="选择国家"
                      style="min-width: 120px"
                      :options="countryOptions"
                      @change="(v: any) => onListingCountryChange(v)"
                    />
                  </div>
                  <div
                    v-for="fact in headerFacts"
                    :key="fact.key"
                    class="xq-listing-field xq-listing-fact"
                  >
                    <span class="xq-listing-flag">{{ fact.label }}</span>
                    <b>{{ fact.value || '—' }}</b>
                  </div>
                </div>
                <div class="xq-head-actions">
                  <Tag
                    v-if="activeTask?.imageUserId"
                    color="purple"
                    :title="`用户 #${activeTask.imageUserId}`"
                  >
                    {{ imageUserLabel(activeTask.imageUserId) }}
                  </Tag>
                  <Button
                    :disabled="!canAssignCurrent()"
                    @click="openAssignCurrent"
                  >
                    {{
                      activeTask?.imageUserId && !isImageStarted(activeTask)
                        ? '改派美工'
                        : '分配美工'
                    }}
                  </Button>
                  <Button type="primary" :loading="saving" @click="saveCurrent">
                    保存
                  </Button>
                </div>
              </div>
            </div>

            <div v-if="showCopyEditor" class="xq-copy-section">
              <!-- <label class="xq-field-label">文案内容</label> -->

              <div class="xq-edit-block">
                <!-- <label class="xq-field-label">类目模板</label> -->
                <Spin :spinning="templateLoading">
                  <div v-if="!listingPlatformId" class="xq-tpl-empty">
                    请从平台工作台进入后再加载模板字段
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
                        <div
                          v-if="zone.fields.length"
                          class="xq-zone-list"
                          :class="{ tall: zone.key === 'other' }"
                        >
                          <EditFieldRow
                            v-for="f in zone.fields"
                            v-show="zoneFieldVisible(zone.key, f)"
                            :key="`${zone.key}-${f.code}`"
                            v-model="fieldValues[f.code]"
                            :code="f.code"
                            :label="f.label || f.code"
                            :required="!!f.required"
                            :show-zh="showZh"
                            :placeholder="f.defaultValue || f.code"
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

.xq-list-item:hover {
  background: #f3f4f6;
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
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.xq-zone-list {
  max-height: 360px;
  overflow: auto;
  background: #fff;
  border: 1px solid #eef0f3;
  border-radius: 8px;
}

.xq-zone-list.tall {
  max-height: 420px;
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
  gap: 4px;
  width: 80px;
  font-size: 11px;
  color: #6b7280;
  text-align: center;
}

.xq-wb-img-fill {
  position: relative;
}

.xq-wb-img-del {
  position: absolute;
  right: 4px;
  bottom: 4px;
  z-index: 1;
  padding: 0 4px;
  font-size: 10px;
  color: #fff;
  cursor: pointer;
  background: rgb(0 0 0 / 55%);
  border: 0;
  border-radius: 4px;
}

.xq-wb-img-upload {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  color: #9ca3af;
  cursor: pointer;
  background: #fafafa;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
}

.xq-wb-img-upload span {
  font-size: 22px;
  line-height: 1;
  color: #9ca3af;
}

.xq-wb-img-upload em {
  padding: 0 4px;
  font-size: 10px;
  font-style: normal;
  line-height: 1.2;
}

.xq-wb-img :deep(.ant-image),
.xq-wb-img :deep(img) {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
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
  gap: 8px;
}

.xq-head-imgs .xq-wb-img-fill :deep(.ant-image),
.xq-head-imgs .xq-wb-img-fill :deep(img) {
  width: 80px !important;
  height: 80px !important;
  object-fit: cover;
}

.xq-head-hint {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

.xq-head-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
  align-items: center;
  justify-content: space-between;
}

.xq-head-fields {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
  min-width: 0;
}

.xq-head-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  margin-left: auto;
}

.xq-head-meta .xq-listing-field {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: auto;
  padding: 4px 8px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 8px;
}

.xq-listing-fact b {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  white-space: nowrap;
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
