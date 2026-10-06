<script lang="ts" setup>
import type { XqListingApi } from '#/api/xq/listing';
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  Button,
  Empty,
  Image,
  Input,
  message,
  Modal,
  Pagination,
  Select,
  Spin,
  Tag,
  TreeSelect,
  Upload,
} from 'ant-design-vue';

import { uploadFile } from '#/api/infra/file';
import {
  getXqCategoryFieldTemplate,
  getXqListingCategories,
  getXqListingShops,
} from '#/api/xq/listing';
import {
  batchAssignXqWorkOrderImage,
  batchCloseXqWorkOrder,
  closeXqWorkOrder,
  getXqAssignableImageUsers,
  getXqWorkOrder,
  getXqWorkOrderPage,
  updateXqWorkOrder,
} from '#/api/xq/work-order';
import { useDeskPlatformId } from '#/views/xq/desk/use-desk-scope';
import {
  isListingImageField,
  resolveListingFieldZone,
} from '#/views/xq/product/listing-field-zone';

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
const users = ref<Array<{ id: number; nickname?: string; username?: string }>>(
  [],
);

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
const templateLoading = ref(false);
const templateLoaded = ref(false);

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

const hasCategoryTemplate = computed(
  () => (categoryTemplate.value?.fields?.length || 0) > 0,
);

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
  };
  for (const f of categoryTemplate.value?.fields || []) {
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
    groups.unset.push(row);
  }
  return groups;
});

const headerFacts = computed(() => {
  const out: Array<{ key: string; label: string; value: string }> = [];
  const seen = new Set<string>();
  for (const f of categoryTemplate.value?.fields || []) {
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

const otherTplOpen = ref(false);

function textStats(text?: string) {
  const s = String(text || '').trim();
  const chars = s.length;
  const words = s ? s.split(/\s+/).filter(Boolean).length : 0;
  return `${chars} 字符 · ${words} 词`;
}

function tplAttrValue(f: TplField) {
  const hay = fieldHay(f);
  const row = activeTask.value;
  if (!row) return '';
  if (/brand|品牌/.test(hay)) {
    try {
      const obj = row.listingValuesJson
        ? JSON.parse(row.listingValuesJson)
        : {};
      return String(obj.brand || obj.Brand || '').trim();
    } catch {
      return '';
    }
  }
  if (/upc|gtin/.test(hay)) return row.upc || '';
  if (
    /seller sku|shop sku|vendor style|item code|platform sku|shop sku/.test(hay)
  ) {
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

watch(activeTask, (row) => {
  if (row) fillForm(row);
});

watch(
  listingPlatformId,
  async (platformId) => {
    listingCategories.value = [];
    listingShops.value = [];
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
        await onListingShopChange(asId(listingShops.value[0]!.id));
      }
    } catch {
      listingShops.value = [];
    }
    if (listingCategoryId.value) {
      await loadCategoryTemplates(platformId, listingCategoryId.value);
    }
  },
  { immediate: true },
);

watch(
  () =>
    [
      activeTask.value?.listingPlatformId ||
        familyParent.value?.listingPlatformId,
      listingCategoryId.value,
    ] as const,
  async ([platformId, categoryId]) => {
    await loadCategoryTemplates(platformId, categoryId);
  },
);

async function loadCategoryTemplates(
  _platformId?: string,
  categoryId?: string,
) {
  categoryTemplate.value = null;
  templateLoaded.value = false;
  otherTplOpen.value = false;
  if (!categoryId) return;
  templateLoading.value = true;
  try {
    categoryTemplate.value = await getXqCategoryFieldTemplate(categoryId);
    templateLoaded.value = true;
  } catch {
    categoryTemplate.value = null;
    templateLoaded.value = true;
  } finally {
    templateLoading.value = false;
  }
}

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

async function loadTasks() {
  loading.value = true;
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
      const hit = members.find((m) => m.id === fid) || members[0];
      if (hit) selectTask(hit);
      else fillForm(null);
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

async function openAssign() {
  if (unassignedSelected.value.length === 0) {
    message.warning('请勾选尚未分配美工、且文案已完成的任务');
    return;
  }
  assignOpen.value = true;
  try {
    users.value = (await getXqAssignableImageUsers()) || [];
    if (myUserId.value && users.value.some((u) => u.id === myUserId.value)) {
      imageUserId.value = myUserId.value;
    } else if (users.value[0]?.id) {
      imageUserId.value = users.value[0].id;
    }
  } catch (error: any) {
    users.value = [];
    message.error(error?.message || '加载美工列表失败');
  }
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
      listingPlatformId: lockedPlatformId.value || undefined,
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
      <div class="xq-toolbar">
        <div class="xq-title-block">
          <h2>编辑产品</h2>
          <p>左侧点选组合内任一 SKU，右侧展示并保存该条信息。</p>
        </div>
        <Input.Search
          v-if="!route.query.id"
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
            <div v-for="row in tasks" :key="row.id" class="xq-list-group">
              <div
                v-for="member in comboMembers(row)"
                :key="member.id"
                class="xq-list-item"
                :class="{ active: isLeftActive(member) }"
                role="button"
                tabindex="0"
                @click="selectTask(member)"
                @keydown.enter="selectTask(member)"
              >
                <div class="xq-list-thumb">
                  <Image
                    :src="coverOf(member)"
                    :preview="false"
                    :width="72"
                    :height="72"
                  />
                </div>
                <div class="xq-list-sku" :title="member.externalSku">
                  {{ member.externalSku || '—' }}
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
                      :width="88"
                      :height="88"
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
              <p class="xq-head-hint">
                请上传大小不超过 5MB 格式为 png/jpg/jpeg 的文件
              </p>
              <div class="xq-head-meta">
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
                    style="min-width: 140px"
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
                    style="min-width: 180px"
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
                    style="min-width: 128px"
                    :options="countryOptions"
                    @change="(v: any) => onListingCountryChange(v)"
                  />
                </div>
                <div
                  v-for="fact in headerFacts"
                  :key="fact.key"
                  class="xq-listing-field"
                >
                  <span class="xq-listing-flag">{{ fact.label }}</span>
                  <b>{{ fact.value || '—' }}</b>
                </div>
                <Button type="primary" :loading="saving" @click="saveCurrent">
                  保存
                </Button>
              </div>
            </div>

            <div v-if="showCopyEditor" class="xq-copy-section">
              <!-- <label class="xq-field-label">文案内容</label> -->

              <div class="xq-edit-block">
                <!-- <label class="xq-field-label">类目模板</label> -->
                <Spin :spinning="templateLoading">
                  <div v-if="!listingCategoryId" class="xq-tpl-empty">
                    请先选择上架类目，再加载该类目字段模板
                  </div>
                  <div v-else-if="listingCategoryId" class="xq-wb">
                    <section class="xq-wb-sec">
                      <div class="xq-wb-copy wide">
                        <div class="xq-wb-copy-h">
                          <em>标题</em>
                          <span>{{ textStats(form.contentTitle) }}</span>
                          <i>自动</i>
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
                              form.sellingPoints.filter((p) => p.trim()).length
                            }}/{{ form.sellingPoints.length }}</span>
                          <i>自动</i>
                        </div>
                        <div class="xq-points-stack">
                          <Input
                            v-for="(_, idx) in form.sellingPoints"
                            :key="`tpl-sp-${idx}`"
                            v-model:value="form.sellingPoints[idx]"
                            :placeholder="`卖点 ${idx + 1}`"
                            allow-clear
                          />
                        </div>
                      </div>
                      <div class="xq-wb-copy wide">
                        <div class="xq-wb-copy-h">
                          <em>长描述</em>
                          <span>{{ textStats(form.description) }}</span>
                          <i>自动</i>
                        </div>
                        <Input.TextArea
                          v-model:value="form.description"
                          :rows="8"
                          placeholder="英文 Product Description，完整句子"
                          allow-clear
                        />
                      </div>
                      <div v-if="tplGroups.copyExtra.length" class="xq-wb-grid">
                        <div
                          v-for="f in tplGroups.copyExtra"
                          :key="`copy-${f.code}`"
                          class="xq-wb-card"
                        >
                          <div class="xq-wb-card-h">
                            <em>{{ f.label }}</em>
                            <span class="tag">{{
                              f.groupLabel || '选填'
                            }}</span>
                          </div>
                          <Input
                            size="small"
                            :value="tplAttrValue(f)"
                            :placeholder="f.code"
                            readonly
                          />
                        </div>
                      </div>
                    </section>

                    <section v-if="tplGroups.product.length" class="xq-wb-sec">
                      <div class="xq-wb-sec-title">
                        产品
                        <span>SKU · UPC · 组</span>
                        <b>{{ tplGroups.product.length }}</b>
                      </div>
                      <div class="xq-wb-grid">
                        <div
                          v-for="f in tplGroups.product"
                          :key="`prod-${f.code}`"
                          class="xq-wb-card"
                          :class="{ req: f.required }"
                        >
                          <div class="xq-wb-card-h">
                            <em>{{ f.label }}</em>
                            <span v-if="f.required" class="tag red">必填</span>
                            <span v-else class="tag">{{
                              f.groupLabel || '选填'
                            }}</span>
                          </div>
                          <Input
                            size="small"
                            :value="tplAttrValue(f)"
                            :placeholder="f.code"
                            readonly
                          />
                        </div>
                      </div>
                    </section>

                    <section v-if="tplGroups.attr.length" class="xq-wb-sec">
                      <div class="xq-wb-sec-title">
                        属性
                        <span>尺寸 · 重量 · 品牌</span>
                        <b>{{ tplGroups.attr.length }}</b>
                      </div>
                      <div class="xq-wb-grid">
                        <div
                          v-for="f in tplGroups.attr"
                          :key="`attr-${f.code}`"
                          class="xq-wb-card"
                          :class="{ req: f.required }"
                        >
                          <div class="xq-wb-card-h">
                            <em>{{ f.label }}</em>
                            <span v-if="f.required" class="tag red">必填</span>
                            <span v-else class="tag">{{
                              f.groupLabel || '选填'
                            }}</span>
                          </div>
                          <Input
                            size="small"
                            :value="tplAttrValue(f)"
                            :placeholder="f.code"
                            readonly
                          />
                        </div>
                      </div>
                    </section>

                    <section v-if="tplGroups.unset.length" class="xq-wb-sec">
                      <button
                        type="button"
                        class="xq-wb-sec-title more"
                        @click="otherTplOpen = !otherTplOpen"
                      >
                        未分区
                        <span>{{ tplGroups.unset.length }} ·
                          请在模板配置中拆分</span>
                        <b>{{ otherTplOpen ? '收起' : '展开' }}</b>
                      </button>
                      <div v-show="otherTplOpen" class="xq-wb-grid scroll">
                        <div
                          v-for="f in tplGroups.unset"
                          :key="`unset-${f.code}`"
                          class="xq-wb-card"
                        >
                          <div class="xq-wb-card-h">
                            <em>{{ f.label }}</em>
                            <span class="tag">{{
                              f.groupLabel || '选填'
                            }}</span>
                          </div>
                          <Input
                            size="small"
                            :value="tplAttrValue(f)"
                            :placeholder="f.code"
                            readonly
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                  <div v-else-if="templateLoaded" class="xq-tpl-empty">
                    该类目暂无字段模板（源库未同步 Mirakl 分类模板）
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
      title="批量分配美工"
      :confirm-loading="assigning"
      ok-text="确认分配"
      @ok="confirmAssign"
    >
      <div class="xq-assign-form">
        <label>美工人员（有「我的图片」权限的用户 / 自己）</label>
        <div class="xq-assign-user-row">
          <Select
            v-model:value="imageUserId"
            show-search
            option-filter-prop="label"
            placeholder="选择美工（可搜姓名）"
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
  grid-template-columns: 112px 1fr;
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
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  padding: 8px 6px;
  text-align: center;
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
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #eef0f3;
  border-radius: 10px;
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

.xq-wb-copy-h i {
  margin-left: auto;
  font-size: 12px;
  font-style: normal;
  color: #16a34a;
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
  width: 88px;
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
  width: 88px;
  height: 88px;
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
  width: 88px;
  height: 88px;
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

.xq-list-thumb {
  flex: 0 0 72px;
  width: 72px;
  height: 72px;
  overflow: hidden;
  background: #f3f4f6;
  border-radius: 8px;
}

.xq-list-thumb :deep(.ant-image) {
  display: block;
  width: 72px !important;
  height: 72px !important;
}

.xq-list-thumb :deep(.ant-image-img),
.xq-list-thumb :deep(img) {
  width: 72px !important;
  max-width: 72px !important;
  height: 72px !important;
  max-height: 72px !important;
  object-fit: cover;
}

.xq-list-sku {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  color: #1f2937;
  white-space: nowrap;
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
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.xq-head-imgs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.xq-head-imgs .xq-wb-img-fill :deep(.ant-image),
.xq-head-imgs .xq-wb-img-fill :deep(img) {
  width: 88px !important;
  height: 88px !important;
  object-fit: cover;
}

.xq-head-hint {
  margin: 0;
  font-size: 12px;
  color: #f43f5e;
}

.xq-head-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: center;
}

.xq-head-meta .xq-listing-field {
  display: flex;
  gap: 6px;
  align-items: center;
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
