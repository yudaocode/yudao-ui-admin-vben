<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';
import type { XqListingApi } from '#/api/xq/listing';
import type { XqWorkOrderApi } from '#/api/xq/work-order';
import type { ImageSlot } from '#/views/xq/product/image-slot-rule';

import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon, ZoomInOutlined } from '@vben/icons';
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
  notification,
  Pagination,
  Radio,
  Select,
  Spin,
  Tag,
  Textarea,
  TreeSelect,
  Upload,
} from 'ant-design-vue';

import { uploadFile } from '#/api/infra/file';
import { getSimpleUserList } from '#/api/system/user';
import {
  getXqImageRule,
  getXqListingCategories,
  getXqListingPlatforms,
} from '#/api/xq/listing';
import {
  enqueueXqWorkOrderImageRpa,
  generateXqWorkOrderImage,
  getXqWorkOrderPage,
  getXqWorkOrderReviseImageTask,
  submitXqWorkOrderReviseImage,
  updateXqWorkOrder,
  updateXqWorkOrderImageStatus,
} from '#/api/xq/work-order';
import { useDeskPlatformId } from '#/views/xq/desk/use-desk-scope';
import {
  alignPromptsToSlots,
  DEFAULT_IMAGE_SLOTS,
  imageSlotTypeLabel,
  parseImageSlotConfig,
  summarizeImageSlots,
} from '#/views/xq/product/image-slot-rule';
import {
  exportImagePromptsWorkbook,
  matchSkuFromFileName,
  parseImagePromptTextsFromFile,
} from '#/views/xq/product/prompt-file';
import XqSourceProductDrawer from '#/views/xq/product/xq-source-product-drawer.vue';

defineOptions({ name: 'XqImagePool' });

type ImageStatus =
  | 'done'
  | 'generated'
  | 'pending'
  | 'rejected'
  | 'revised'
  | 'running'
  | 'todo';

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

const STATUS_OPTS: Array<{ color: string; label: string; value: ImageStatus }> =
  [
    { value: 'pending', label: '待执行', color: 'processing' },
    { value: 'todo', label: '未完成', color: 'default' },
    { value: 'running', label: '执行中', color: 'processing' },
    { value: 'generated', label: '审核中', color: 'cyan' },
    { value: 'rejected', label: '已驳回', color: 'error' },
    { value: 'revised', label: '已修改', color: 'warning' },
    { value: 'done', label: '待上架', color: 'success' },
  ];

const userStore = useUserStore();
const lockedPlatformId = useDeskPlatformId();
const myUserId = computed(() => {
  const info = userStore.userInfo as null | Record<string, any>;
  return Number(info?.userId || info?.id || 0) || undefined;
});

const loading = ref(false);
const saving = ref(false);
const running = ref(false);
const batchRunning = ref(false);
const batchPromptOpen = ref(false);
const batchPromptBusy = ref(false);
/** 表格导入：one=一文件写全部勾选；sku=按文件名匹配 SKU */
const batchSheetMode = ref<'one' | 'sku'>('one');
const keyword = ref('');
const statusFilter = ref<'' | ImageStatus>('');
const filterImageUserId = ref<number | undefined>();
/** 美工「编辑图片」页可选平台；平台工作台内由 lockedPlatformId 锁定 */
const filterPlatformId = ref<string | undefined>();
/** 平台上架类目 */
const filterListingCategoryId = ref<string | undefined>();
const platforms = ref<XqListingApi.Platform[]>([]);
const listingCategoryTree = ref<XqListingApi.CategoryNode[]>([]);
const users = ref<SystemUserApi.User[]>([]);
const tasks = ref<XqWorkOrderApi.WorkOrder[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const selectedMap = ref<Record<number, XqWorkOrderApi.WorkOrder>>({});
const activeId = ref<number | undefined>();
const uploading = ref<null | number>(null);

/** 单图 AI 改图弹窗 */
const reviseOpen = ref(false);
const reviseBusy = ref(false);
const reviseIndex = ref(0);
const revisePrompt = ref('');
const reviseIncludeCurrentAi = ref(true);
const reviseBoundUrls = ref<string[]>([]);
const reviseHistory = ref<Array<{ at: number; id: string; prompt: string }>>(
  [],
);
const reviseHistoryId = ref<string | undefined>();
const reviseConfirmOpen = ref(false);
const revisePreviewUrl = ref('');
const reviseCurrentAiUrl = ref('');
const reviseUsedRefs = ref<string[]>([]);

/** 平台工作台 = 只筛本平台类目；美工编辑页 = 自选平台 + 平台类目 */
const isPlatformDesk = computed(() => Boolean(lockedPlatformId.value));
const effectivePlatformId = computed(
  () => lockedPlatformId.value || filterPlatformId.value || undefined,
);

const statusTabs = computed(() => [
  { value: '' as const, label: '全部' },
  ...STATUS_OPTS.map((s) => ({ value: s.value, label: s.label })),
]);
const queryParams = reactive({ keyword: '' as string | undefined });

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

const listingCategoryTreeData = computed(() =>
  mapListingCategoryTree(listingCategoryTree.value),
);
const platformOptions = computed(() =>
  platforms.value.map((p) => ({
    label: p.name || p.id,
    value: p.id,
  })),
);
const promptDraft = ref<ImagePromptItem[]>([]);
/** 右侧当前选中的提示词（左侧点原图绑定到这条） */
const activePromptIndex = ref(0);
const sourcePreviewVisible = ref(false);
const sourcePreviewUrl = ref('');
/** 突出风格标签（与文案池同源：copyResultJson.highlightStyle） */
const highlightTags = ref<string[]>([]);
const selectedHighlight = ref<string[]>([]);
const tagDraft = ref('');
/** 当前任务平台/类目出图槽位 */
const imageSlots = ref<ImageSlot[]>([...DEFAULT_IMAGE_SLOTS]);
const slotSummary = computed(() => summarizeImageSlots(imageSlots.value));

const userNameMap = computed(() => {
  const map = new Map<number, string>();
  for (const u of users.value) {
    if (u.id) map.set(u.id, u.nickname || u.username);
  }
  return map;
});

const userOptions = computed(() =>
  users.value.map((u) => ({
    label: `${u.nickname || u.username} (#${u.id})`,
    value: u.id,
  })),
);

/** 跑图列表：扁平全量 SKU（家族内全部拉齐，UI 不区分主/变体） */
const displayTasks = computed(() => tasks.value.filter((m) => Boolean(m?.id)));

const activeTask = computed(() => findTask(activeId.value));
const isArtist = computed(() => {
  const uid = myUserId.value;
  const row = activeTask.value;
  if (!uid || !row) return false;
  if (row.imageUserId === uid) return true;
  // 家族拉齐的变体可能尚未单独写 imageUserId
  return !row.imageUserId;
});
const isAssigner = computed(() => {
  const row = activeTask.value;
  const uid = myUserId.value;
  if (!row || !uid) return false;
  return row.copyUserId === uid || row.assigneeUserId === uid;
});
const canEdit = computed(() => isArtist.value || isAssigner.value);

const currentStatus = computed<ImageStatus>(() => {
  const s = (activeTask.value?.imageStatus || 'pending') as ImageStatus;
  return STATUS_OPTS.some((x) => x.value === s) ? s : 'pending';
});

/** 写提示词：仅待执行/未完成；已修改=出图后修图，走对比区 */
const showPrompts = computed(
  () => currentStatus.value === 'pending' || currentStatus.value === 'todo',
);
const showCompare = computed(() => !showPrompts.value);

function parsePrompts(
  row?: null | XqWorkOrderApi.WorkOrder,
): ImagePromptItem[] {
  if (!row?.imagePromptJson) return [];
  try {
    const arr = JSON.parse(row.imagePromptJson);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function sourceImagesOf(row?: null | XqWorkOrderApi.WorkOrder) {
  if (!row) return [] as string[];
  const urls: string[] = [];
  const push = (u?: string) => {
    const s = String(u || '').trim();
    if (s && !urls.includes(s)) urls.push(s);
  };
  push(row.coverUrl);
  if (row.sourceImageUrls) {
    try {
      const arr = JSON.parse(row.sourceImageUrls);
      if (Array.isArray(arr)) arr.forEach((u) => push(String(u)));
    } catch {
      // ignore
    }
  }
  return urls;
}

const sourceImages = computed(() => sourceImagesOf(activeTask.value));
const sourcePanelOpen = ref(false);
const sourceSku = computed(
  () => String(activeTask.value?.externalSku || '').trim() || '原内容',
);
const sourceFamily = computed(() => {
  const row = activeTask.value;
  if (!row) return [] as XqWorkOrderApi.WorkOrder[];
  const parentId = row.parentWorkOrderId || row.id;
  const siblings = tasks.value.filter(
    (t) => t.id === parentId || t.parentWorkOrderId === parentId,
  );
  return siblings.length > 0 ? siblings : [row];
});

function toggleSourcePanel(force?: boolean) {
  sourcePanelOpen.value = force === undefined ? !sourcePanelOpen.value : force;
}

function onSelectSourceMember(row: XqWorkOrderApi.WorkOrder) {
  if (!row?.id) return;
  void selectTask(row);
}

const sourceImageOptions = computed(() =>
  sourceImages.value.map((url, si) => ({
    value: si,
    label: si === 0 ? '主图' : `原图 ${si + 1}`,
    url,
  })),
);

function aiUrlOf(p: ImagePromptItem) {
  return String(p.resultUrl || p.generatedImageUrl || '').trim();
}

const comparePairs = computed(() => {
  const row = activeTask.value;
  const src = sourceImages.value;
  const prompts = shapePromptsToSlots(parsePrompts(row), imageSlots.value, src);
  return prompts.map((p, i) => {
    const binds = (p.bindIndexes || []).filter(
      (n) => Number.isFinite(n) && n >= 0 && n < src.length,
    );
    const originals =
      binds.length > 0
        ? binds.map((n) => src[n]!).filter(Boolean)
        : [src[i] || src[0] || ''].filter(Boolean);
    return {
      index: i,
      original: originals[0] || '',
      originals,
      ai: aiUrlOf(p) || (i === 0 ? row?.generatedImageUrl || '' : ''),
      label: imageSlotTypeLabel(p.imageType) || `槽位 ${i + 1}`,
      rejectReason: String(p.rejectReason || '').trim(),
      prompt: p,
    };
  });
});

function imageTypeLabel(type?: string, _i = 0) {
  return imageSlotTypeLabel(type);
}

function shapePromptsToSlots(
  prompts: ImagePromptItem[],
  slots: ImageSlot[],
  src: string[],
): ImagePromptItem[] {
  const list = Array.isArray(prompts) ? prompts : [];
  if (slots.length === 0) {
    return list.map((p, i) => ({
      ...p,
      index: p.index ?? i,
      imageType: p.imageType || (i === 0 ? 'main' : 'detail'),
      rejectReason: p.rejectReason,
    }));
  }
  const aligned = alignPromptsToSlots(list, slots);
  return aligned.map((row, i) => {
    const p = row.prompt;
    let bindIndexes = p?.bindIndexes;
    if (!bindIndexes?.length) {
      if (src[i]) bindIndexes = [i];
      else if (src[0]) bindIndexes = [0];
      else bindIndexes = [];
    }
    return {
      index: i,
      imageType: row.imageType,
      imageUrl: p?.imageUrl || src[bindIndexes[0] ?? i] || src[i],
      resultUrl: p?.resultUrl,
      generatedImageUrl: p?.generatedImageUrl,
      marker: p?.marker,
      promptText: p?.promptText || '',
      bindIndexes,
      rejectReason: p?.rejectReason,
    };
  });
}

async function loadImageSlots(row?: null | XqWorkOrderApi.WorkOrder) {
  const platformId = String(
    row?.listingPlatformId || lockedPlatformId.value || '',
  );
  const categoryId = String(row?.listingCategoryId || '');
  if (!platformId) {
    imageSlots.value = [...DEFAULT_IMAGE_SLOTS];
    return;
  }
  try {
    const rule = await getXqImageRule(platformId, categoryId);
    const slots = parseImageSlotConfig(rule?.configJson);
    imageSlots.value = slots.length > 0 ? slots : [...DEFAULT_IMAGE_SLOTS];
  } catch {
    imageSlots.value = [...DEFAULT_IMAGE_SLOTS];
  }
}

function findTask(id?: number): null | XqWorkOrderApi.WorkOrder {
  if (!id) return null;
  return tasks.value.find((t) => t.id === id) || null;
}

function coverOf(row: XqWorkOrderApi.WorkOrder) {
  const p = parsePrompts(row).find((x) => aiUrlOf(x));
  return aiUrlOf(p || {}) || row.generatedImageUrl || row.coverUrl || undefined;
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
    (row.id === null || row.id === undefined ? '—' : String(row.id))
  );
}

function statusMeta(row: XqWorkOrderApi.WorkOrder) {
  return (
    STATUS_OPTS.find((s) => s.value === (row.imageStatus || 'pending')) ||
    STATUS_OPTS[0]!
  );
}

function artistName(row: XqWorkOrderApi.WorkOrder) {
  if (!row.imageUserId) return '未分配';
  return userNameMap.value.get(row.imageUserId) || `#${row.imageUserId}`;
}

function isChecked(row: XqWorkOrderApi.WorkOrder) {
  return Boolean(row.id && selectedMap.value[row.id]);
}

function toggleCheck(row: XqWorkOrderApi.WorkOrder, checked?: boolean) {
  if (!row.id) return;
  const on = checked === undefined ? !selectedMap.value[row.id] : checked;
  selectedMap.value = on
    ? { ...selectedMap.value, [row.id]: row }
    : Object.fromEntries(
        Object.entries(selectedMap.value).filter(([k]) => Number(k) !== row.id),
      );
}

function clearSelection() {
  selectedMap.value = {};
}

const selectedRows = computed(() => Object.values(selectedMap.value));
const selectedCount = computed(() => selectedRows.value.length);

function canEditRow(row: XqWorkOrderApi.WorkOrder) {
  const uid = myUserId.value;
  if (!uid || !row.id) return false;
  if (row.imageUserId === uid) return true;
  if (row.copyUserId === uid || row.assigneeUserId === uid) return true;
  // 图片池按家族拉全量后，未单独写美工的变体也可编辑
  return !row.imageUserId;
}

function rowPromptStatusOk(row: XqWorkOrderApi.WorkOrder) {
  const st = (row.imageStatus || 'pending') as ImageStatus;
  // 已修改属于出图后，不进批量写提示词
  return st === 'pending' || st === 'todo';
}

function hasPromptText(row: XqWorkOrderApi.WorkOrder) {
  if (row.id && row.id === activeId.value) {
    return promptDraft.value.some((p) => String(p.promptText || '').trim());
  }
  return parsePrompts(row).some((p) => String(p.promptText || '').trim());
}

function canBatchRunImage(row: XqWorkOrderApi.WorkOrder) {
  return canEditRow(row) && rowPromptStatusOk(row) && hasPromptText(row);
}

const batchExecutableRows = computed(() =>
  selectedRows.value.filter((r) => canBatchRunImage(r)),
);

const batchPromptRows = computed(() =>
  selectedRows.value.filter((r) => canEditRow(r) && rowPromptStatusOk(r)),
);

function canResetRowToPending(row: XqWorkOrderApi.WorkOrder) {
  if (!canEditRow(row) || !row.id) return false;
  const s = (row.imageStatus || 'pending') as ImageStatus;
  return (
    s === 'running' ||
    s === 'generated' ||
    s === 'rejected' ||
    s === 'revised' ||
    s === 'done'
  );
}

const batchResetRows = computed(() =>
  selectedRows.value.filter((r) => canResetRowToPending(r)),
);

const pageAllSelected = computed(() => {
  const rows = displayTasks.value.filter((r) => r.id);
  return rows.length > 0 && rows.every((r) => r.id && selectedMap.value[r.id!]);
});

function toggleSelectPage(checked: boolean) {
  if (!checked) {
    const ids = new Set(
      displayTasks.value.map((r) => r.id).filter((id): id is number => !!id),
    );
    selectedMap.value = Object.fromEntries(
      Object.entries(selectedMap.value).filter(([k]) => !ids.has(Number(k))),
    );
    return;
  }
  const next = { ...selectedMap.value };
  for (const row of displayTasks.value) {
    if (row.id) next[row.id] = row;
  }
  selectedMap.value = next;
}

function setStatusFilter(value: '' | ImageStatus) {
  statusFilter.value = value;
  handleSearch();
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

function hydrateHighlight(row: null | XqWorkOrderApi.WorkOrder) {
  if (!row?.copyResultJson) {
    highlightTags.value = [];
    selectedHighlight.value = [];
    tagDraft.value = '';
    return;
  }
  try {
    const obj = JSON.parse(row.copyResultJson);
    const tags = parseHighlightTags(obj.highlightStyle);
    highlightTags.value = tags;
    selectedHighlight.value = [...tags];
  } catch {
    highlightTags.value = [];
    selectedHighlight.value = [];
  }
  tagDraft.value = '';
}

function hydratePrompts(row: XqWorkOrderApi.WorkOrder) {
  const src = sourceImagesOf(row);
  // 严格按平台规则槽位；禁止「每张原图一条」灌爆细节槽
  const raw = parsePrompts(row);
  promptDraft.value = shapePromptsToSlots(raw, imageSlots.value, src);
  activePromptIndex.value = 0;
}

function toggleHighlight(tag: string, checked: boolean) {
  if (checked) {
    if (!selectedHighlight.value.includes(tag)) {
      selectedHighlight.value.push(tag);
    }
    return;
  }
  selectedHighlight.value = selectedHighlight.value.filter((t) => t !== tag);
}

function addHighlightTag() {
  const tag = tagDraft.value.trim().replaceAll(/[。.!！?？]/g, '');
  if (!tag) return;
  if (tag.length > 12) {
    message.warning('标签不超过 12 个字');
    return;
  }
  if (!highlightTags.value.includes(tag)) {
    highlightTags.value.push(tag);
  }
  if (!selectedHighlight.value.includes(tag)) {
    selectedHighlight.value.push(tag);
  }
  tagDraft.value = '';
}

function removeHighlightTag(tag: string) {
  highlightTags.value = highlightTags.value.filter((t) => t !== tag);
  selectedHighlight.value = selectedHighlight.value.filter((t) => t !== tag);
}

async function saveHighlight() {
  const row = activeTask.value;
  if (!row?.id) return;
  saving.value = true;
  try {
    await updateXqWorkOrder({
      id: row.id,
      contentHighlight: JSON.stringify(selectedHighlight.value),
    });
    message.success('突出风格已保存');
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function selectTask(row: XqWorkOrderApi.WorkOrder) {
  activeId.value = row.id;
  await loadImageSlots(row);
  hydratePrompts(row);
  hydrateHighlight(row);
}

function setActivePrompt(index: number) {
  if (index < 0 || index >= promptDraft.value.length) return;
  activePromptIndex.value = index;
}

function isSourceBoundToActive(srcIndex: number) {
  const p = promptDraft.value[activePromptIndex.value];
  if (!p) return false;
  return (p.bindIndexes || []).includes(srcIndex);
}

function toggleBindSourceToActive(srcIndex: number) {
  if (promptDraft.value.length === 0) {
    message.warning('请先新增一条图片提示词');
    return;
  }
  let idx = activePromptIndex.value;
  if (idx < 0 || idx >= promptDraft.value.length) {
    idx = 0;
    activePromptIndex.value = 0;
  }
  bindOriginal(idx, srcIndex);
}

function bindOriginal(promptIndex: number, srcIndex: number) {
  const p = promptDraft.value[promptIndex];
  if (!p) return;
  const cur = new Set(p.bindIndexes || []);
  if (cur.has(srcIndex)) cur.delete(srcIndex);
  else cur.add(srcIndex);
  p.bindIndexes = [...cur].toSorted((a, b) => a - b);
  const first = p.bindIndexes[0];
  p.imageUrl =
    first === undefined ? p.imageUrl : sourceImages.value[first] || p.imageUrl;
}

function setPromptBindingIndexes(promptIndex: number, vals: number[]) {
  const p = promptDraft.value[promptIndex];
  if (!p) return;
  const next = [...new Set(vals.map(Number).filter((n) => Number.isFinite(n)))]
    .filter((n) => n >= 0 && n < sourceImages.value.length)
    .toSorted((a, b) => a - b);
  p.bindIndexes = next;
  p.imageUrl =
    next[0] === undefined
      ? p.imageUrl
      : sourceImages.value[next[0]] || p.imageUrl;
}

function boundLabel(p: ImagePromptItem) {
  const idx = p.bindIndexes || [];
  if (idx.length === 0) return '未绑定';
  return idx.map((n) => (n === 0 ? '主图' : `原图 ${n + 1}`)).join('、');
}

function addImagePrompt() {
  const i = promptDraft.value.length;
  const slot = imageSlots.value[i];
  promptDraft.value.push({
    index: i,
    imageType: slot?.imageType || (i === 0 ? 'main' : 'detail'),
    promptText: '',
    bindIndexes: sourceImages.value[0] ? [0] : [],
    imageUrl: sourceImages.value[0],
  });
  activePromptIndex.value = promptDraft.value.length - 1;
}

function removeImagePrompt(index: number) {
  if (index < 0 || index >= promptDraft.value.length) return;
  promptDraft.value.splice(index, 1);
  promptDraft.value.forEach((p, i) => {
    p.index = i;
  });
  if (promptDraft.value.length === 0) {
    activePromptIndex.value = 0;
    return;
  }
  if (activePromptIndex.value >= promptDraft.value.length) {
    activePromptIndex.value = promptDraft.value.length - 1;
  } else if (activePromptIndex.value > index) {
    activePromptIndex.value -= 1;
  }
}

function bindAllImagePromptsToMain() {
  if (promptDraft.value.length === 0) {
    message.warning('请先新增一条图片提示词');
    return;
  }
  if (sourceImages.value.length === 0) {
    message.warning('暂无原图可绑定');
    return;
  }
  for (const p of promptDraft.value) {
    p.bindIndexes = [0];
    p.imageUrl = sourceImages.value[0];
  }
  message.success(`已全部绑定主图（${promptDraft.value.length} 条）`);
}

function bindImagePromptsBySequence() {
  if (promptDraft.value.length === 0) {
    message.warning('请先新增一条图片提示词');
    return;
  }
  const src = sourceImages.value;
  if (src.length === 0) {
    message.warning('暂无原图，请等待原图加载完成后再按序号绑定');
    return;
  }
  promptDraft.value.forEach((p, index) => {
    const si = Math.min(index, src.length - 1);
    p.bindIndexes = [si];
    p.imageUrl = src[si];
  });
  message.success(`已按序号绑定 ${promptDraft.value.length} 条提示词`);
}

function shortSourceLabel(si: number) {
  return si === 0 ? '主图' : String(si + 1);
}

function openSourcePreview(url: string) {
  sourcePreviewUrl.value = url;
  sourcePreviewVisible.value = true;
}

function onSourcePreviewVisibleChange(vis: boolean) {
  sourcePreviewVisible.value = vis;
}

function isDimensionPrompt(p?: ImagePromptItem) {
  const t = String(p?.imageType || '').toLowerCase();
  if (t.includes('dimension') || t.includes('size')) return true;
  return /尺寸/.test(String(p?.promptText || ''));
}

function isDetailPrompt(p?: ImagePromptItem) {
  const t = String(p?.imageType || '').toLowerCase();
  if (t.includes('detail')) return true;
  return /细节/.test(String(p?.promptText || ''));
}

async function exportImagePromptsText() {
  try {
    const lines = promptDraft.value
      .map((p) => String(p.promptText || '').trim())
      .filter(Boolean);
    const sku = String(activeTask.value?.externalSku || 'SKU').trim() || 'SKU';
    const count = await exportImagePromptsWorkbook(lines, sku);
    message.success(`已导出 ${count} 条图片提示词`);
  } catch (error: any) {
    message.warning(error?.message || '导出失败');
  }
}

async function onImportPromptFile(file: File) {
  try {
    const texts = await parseImagePromptTextsFromFile(file);
    const src = sourceImages.value;
    const next: ImagePromptItem[] = texts.map((promptText, i) => {
      const slot = imageSlots.value[i];
      const si = src.length > 0 ? Math.min(i, src.length - 1) : -1;
      return {
        index: i,
        imageType: slot?.imageType || (i === 0 ? 'main' : 'detail'),
        promptText,
        bindIndexes: si >= 0 ? [si] : [],
        imageUrl: si >= 0 ? src[si] : undefined,
      };
    });
    // 不足槽位数时补齐空槽，避免丢平台规则
    while (next.length < imageSlots.value.length) {
      const i = next.length;
      const slot = imageSlots.value[i]!;
      const si = src.length > 0 ? Math.min(i, src.length - 1) : -1;
      next.push({
        index: i,
        imageType: slot.imageType,
        promptText: '',
        bindIndexes: si >= 0 ? [si] : [],
        imageUrl: si >= 0 ? src[si] : undefined,
      });
    }
    promptDraft.value = next;
    activePromptIndex.value = 0;
    message.success(`已导入 ${texts.length} 条提示词（已按序号绑原图）`);
  } catch (error: any) {
    message.error(error?.message || '导入失败');
  }
  return false;
}

async function loadUsers() {
  users.value = (await getSimpleUserList()) || [];
}

async function loadPlatforms() {
  try {
    platforms.value = (await getXqListingPlatforms()) || [];
  } catch {
    platforms.value = [];
  }
}

async function loadListingCategories(platformId?: string) {
  const pid = platformId || effectivePlatformId.value;
  if (!pid) {
    listingCategoryTree.value = [];
    filterListingCategoryId.value = undefined;
    return;
  }
  try {
    listingCategoryTree.value = (await getXqListingCategories(pid)) || [];
  } catch {
    listingCategoryTree.value = [];
  }
}

async function onFilterPlatformChange(platformId?: string) {
  filterPlatformId.value = platformId || undefined;
  filterListingCategoryId.value = undefined;
  await loadListingCategories(filterPlatformId.value);
  handleSearch();
}

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
      mineImageUserId: myUserId.value,
      imageUserId: filterImageUserId.value,
      imageStatus: statusFilter.value || undefined,
      listingPlatformId: effectivePlatformId.value || undefined,
      listingCategoryId: filterListingCategoryId.value || undefined,
    });
    tasks.value = res?.list || [];
    total.value = Number(res?.total || 0);
    if (activeId.value && !findTask(activeId.value)) {
      activeId.value = undefined;
      promptDraft.value = [];
      hydrateHighlight(null);
    }
    if (!activeId.value && displayTasks.value[0]?.id) {
      await selectTask(displayTasks.value[0]!);
    } else if (activeId.value) {
      const row = findTask(activeId.value);
      if (row) {
        await loadImageSlots(row);
        hydratePrompts(row);
        hydrateHighlight(row);
      } else if (displayTasks.value[0]?.id) {
        await selectTask(displayTasks.value[0]!);
      }
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

async function savePrompts() {
  const row = activeTask.value;
  if (!row?.id) return;
  saving.value = true;
  try {
    await updateXqWorkOrder({
      id: row.id,
      imagePromptJson: JSON.stringify(promptDraft.value),
      contentHighlight: JSON.stringify(selectedHighlight.value),
    });
    if (row.imageStatus === 'todo' || !row.imageStatus) {
      await updateXqWorkOrderImageStatus({
        id: row.id,
        imageStatus: 'pending',
      });
    }
    message.success('提示词与突出风格已保存');
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function runGenerate() {
  const row = activeTask.value;
  if (!row?.id) return;
  if (!promptDraft.value.some((p) => String(p.promptText || '').trim())) {
    message.warning('请先填写图片提示词');
    return;
  }
  running.value = true;
  try {
    await savePrompts();
    await generateXqWorkOrderImage(row.id);
    message.success('已入队生图，将使用运营个人 RPA 执行记录跑 AI');
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '入队失败');
  } finally {
    running.value = false;
  }
}

async function batchRunGenerate() {
  const rows = [...batchExecutableRows.value];
  if (rows.length === 0) {
    message.warning('请勾选待执行且已填提示词的任务');
    return;
  }
  batchRunning.value = true;
  try {
    const active = activeTask.value;
    const ids = rows.map((r) => r.id!).filter(Boolean);
    if (active?.id && ids.includes(active.id)) {
      await updateXqWorkOrder({
        id: active.id,
        imagePromptJson: JSON.stringify(promptDraft.value),
        contentHighlight: JSON.stringify(selectedHighlight.value),
      });
    }
    const n = await enqueueXqWorkOrderImageRpa(ids);
    message.success(`已入队 ${n} 条生图，将使用运营个人 RPA 执行记录跑 AI`);
    clearSelection();
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '批量入队失败');
  } finally {
    batchRunning.value = false;
  }
}

function openBatchPrompt() {
  if (batchPromptRows.value.length === 0) {
    message.warning('请先勾选待执行/未完成的任务');
    return;
  }
  batchSheetMode.value = 'one';
  batchPromptOpen.value = true;
}

/** 把当前编辑中的提示词同步到勾选任务 */
async function syncPromptsToSelected() {
  const rows = [...batchPromptRows.value];
  if (rows.length === 0) {
    message.warning('请勾选可写入提示词的任务');
    return;
  }
  if (!promptDraft.value.some((p) => String(p.promptText || '').trim())) {
    message.warning('当前任务没有可同步的提示词，请先填写');
    return;
  }
  batchPromptBusy.value = true;
  let ok = 0;
  let fail = 0;
  try {
    const highlightJson = JSON.stringify(selectedHighlight.value);
    for (const row of rows) {
      if (!row.id) continue;
      try {
        const src = sourceImagesOf(row);
        // 按目标任务槽位对齐当前草稿
        let slots = imageSlots.value;
        try {
          const platformId = String(
            row.listingPlatformId || lockedPlatformId.value || '',
          );
          const categoryId = String(row.listingCategoryId || '');
          if (platformId) {
            const rule = await getXqImageRule(platformId, categoryId);
            const parsed = parseImageSlotConfig(rule?.configJson);
            if (parsed.length > 0) slots = parsed;
          }
        } catch {
          // keep current slots
        }
        const shaped = shapePromptsToSlots(promptDraft.value, slots, src);
        await updateXqWorkOrder({
          id: row.id,
          imagePromptJson: JSON.stringify(shaped),
          contentHighlight: highlightJson,
        });
        if (row.imageStatus === 'todo' || !row.imageStatus) {
          await updateXqWorkOrderImageStatus({
            id: row.id,
            imageStatus: 'pending',
          });
        }
        ok += 1;
      } catch {
        fail += 1;
      }
    }
    if (fail === 0) message.success(`已同步提示词到 ${ok} 个任务`);
    else message.warning(`同步完成：成功 ${ok}，失败 ${fail}`);
    batchPromptOpen.value = false;
    await loadTasks();
    if (activeTask.value) hydratePrompts(activeTask.value);
  } finally {
    batchPromptBusy.value = false;
  }
}

function textsToPromptItems(texts: string[]): ImagePromptItem[] {
  return texts.map((promptText, i) => ({
    index: i,
    imageType: i === 0 ? 'main' : 'detail',
    promptText,
  }));
}

async function writePromptsToRow(
  row: XqWorkOrderApi.WorkOrder,
  prompts: ImagePromptItem[],
) {
  if (!row.id || prompts.length === 0) return false;
  const src = sourceImagesOf(row);
  let slots = [...DEFAULT_IMAGE_SLOTS];
  try {
    const platformId = String(
      row.listingPlatformId || lockedPlatformId.value || '',
    );
    const categoryId = String(row.listingCategoryId || '');
    if (platformId) {
      const rule = await getXqImageRule(platformId, categoryId);
      const parsed = parseImageSlotConfig(rule?.configJson);
      if (parsed.length > 0) slots = parsed;
    }
  } catch {
    // keep default
  }
  const shaped = shapePromptsToSlots(prompts, slots, src);
  await updateXqWorkOrder({
    id: row.id,
    imagePromptJson: JSON.stringify(shaped),
  });
  if (row.imageStatus === 'todo' || !row.imageStatus) {
    await updateXqWorkOrderImageStatus({
      id: row.id,
      imageStatus: 'pending',
    });
  }
  return true;
}

/**
 * 批量上传提示词 JSON：
 * [{ "sku": "XX", "prompts": [{ "imageType": "main", "promptText": "..." }] }]
 */
async function onBatchPromptJsonFile(file: File) {
  batchPromptBusy.value = true;
  try {
    const text = await file.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      message.error('请上传合法 JSON 文件');
      return false;
    }
    const bySku = new Map<string, ImagePromptItem[]>();
    const ingest = (sku: string, prompts: unknown) => {
      const key = String(sku || '').trim();
      if (!key) return;
      if (typeof prompts === 'string') {
        try {
          const arr = JSON.parse(prompts);
          if (Array.isArray(arr)) bySku.set(key, arr as ImagePromptItem[]);
        } catch {
          // ignore
        }
        return;
      }
      if (Array.isArray(prompts)) {
        bySku.set(key, prompts as ImagePromptItem[]);
        return;
      }
      if (prompts && typeof prompts === 'object') {
        const obj = prompts as Record<string, unknown>;
        if (Array.isArray(obj.prompts)) {
          bySku.set(key, obj.prompts as ImagePromptItem[]);
        } else if (typeof obj.imagePromptJson === 'string') {
          ingest(key, obj.imagePromptJson);
        }
      }
    };
    if (Array.isArray(data)) {
      for (const item of data) {
        if (!item || typeof item !== 'object') continue;
        const row = item as Record<string, unknown>;
        ingest(String(row.sku || row.externalSku || ''), row.prompts ?? row);
      }
    } else if (data && typeof data === 'object') {
      for (const [sku, val] of Object.entries(
        data as Record<string, unknown>,
      )) {
        ingest(sku, val);
      }
    }
    if (bySku.size === 0) {
      message.error('JSON 中未解析到有效 SKU 提示词');
      return false;
    }
    const targets =
      batchPromptRows.value.length > 0
        ? batchPromptRows.value
        : displayTasks.value.filter(
            (r) => canEditRow(r) && rowPromptStatusOk(r),
          );
    let ok = 0;
    let miss = 0;
    let fail = 0;
    for (const row of targets) {
      const sku = String(row.externalSku || '').trim();
      const prompts = sku ? bySku.get(sku) : undefined;
      if (!prompts?.length || !row.id) {
        miss += 1;
        continue;
      }
      try {
        if (await writePromptsToRow(row, prompts)) ok += 1;
        else miss += 1;
      } catch {
        fail += 1;
      }
    }
    message.success(
      `批量上传提示词：写入 ${ok}，无匹配 ${miss}${fail ? `，失败 ${fail}` : ''}`,
    );
    batchPromptOpen.value = false;
    await loadTasks();
    if (activeTask.value) hydratePrompts(activeTask.value);
  } catch (error: any) {
    message.error(error?.message || '上传失败');
  } finally {
    batchPromptBusy.value = false;
  }
  return false;
}

/** 批量导入 Excel / Word / txt（一文件全选 或 按文件名匹配 SKU） */
async function onBatchPromptSheetFiles(file: File, fileList?: File[]) {
  const files =
    fileList && fileList.length > 0 ? fileList : [file].filter(Boolean);
  if (files.length === 0) return false;

  const targets =
    batchPromptRows.value.length > 0
      ? batchPromptRows.value
      : displayTasks.value.filter((r) => canEditRow(r) && rowPromptStatusOk(r));
  if (targets.length === 0) {
    message.warning('请先勾选可写任务');
    return false;
  }

  batchPromptBusy.value = true;
  try {
    let ok = 0;
    let miss = 0;
    let fail = 0;

    if (batchSheetMode.value === 'one') {
      const first = files[0]!;
      const texts = await parseImagePromptTextsFromFile(first);
      const prompts = textsToPromptItems(texts);
      for (const row of targets) {
        try {
          if (await writePromptsToRow(row, prompts)) ok += 1;
          else miss += 1;
        } catch {
          fail += 1;
        }
      }
      message.success(
        `表格导入（一文件→全部勾选）：写入 ${ok}${fail ? `，失败 ${fail}` : ''}`,
      );
    } else {
      const skuList = targets
        .map((r) => String(r.externalSku || '').trim())
        .filter(Boolean);
      const bySku = new Map<string, ImagePromptItem[]>();
      for (const f of files) {
        try {
          const sku = matchSkuFromFileName(f.name, skuList);
          if (!sku) {
            miss += 1;
            continue;
          }
          const texts = await parseImagePromptTextsFromFile(f);
          bySku.set(sku, textsToPromptItems(texts));
        } catch {
          fail += 1;
        }
      }
      for (const row of targets) {
        const sku = String(row.externalSku || '').trim();
        const prompts = sku ? bySku.get(sku) : undefined;
        if (!prompts?.length) {
          miss += 1;
          continue;
        }
        try {
          if (await writePromptsToRow(row, prompts)) ok += 1;
          else miss += 1;
        } catch {
          fail += 1;
        }
      }
      message.success(
        `表格导入（按文件名匹配 SKU）：写入 ${ok}，无匹配 ${miss}${fail ? `，失败 ${fail}` : ''}`,
      );
    }

    batchPromptOpen.value = false;
    await loadTasks();
    if (activeTask.value) hydratePrompts(activeTask.value);
  } catch (error: any) {
    message.error(error?.message || '表格导入失败');
  } finally {
    batchPromptBusy.value = false;
  }
  return false;
}

/** Upload 多选时短延迟合并为一次导入 */
const batchSheetBuffer: File[] = [];
let batchSheetTimer: null | ReturnType<typeof setTimeout> = null;

function onBatchSheetBeforeUpload(file: File) {
  batchSheetBuffer.push(file);
  if (batchSheetTimer) clearTimeout(batchSheetTimer);
  batchSheetTimer = setTimeout(() => {
    const files = batchSheetBuffer.splice(0);
    batchSheetTimer = null;
    if (files.length === 0) return;
    void onBatchPromptSheetFiles(files[0]!, files);
  }, 80);
  return false;
}

async function patchPromptAi(
  index: number,
  url: string,
  extras: Partial<ImagePromptItem> = {},
  workOrderId?: number,
) {
  const row = findTask(workOrderId) || activeTask.value;
  if (!row?.id) return;
  const prompts = parsePrompts(row);
  while (prompts.length <= index) {
    prompts.push({ index: prompts.length, imageType: 'detail' });
  }
  prompts[index] = {
    ...prompts[index]!,
    ...extras,
    resultUrl: url,
    marker: 'ai',
    rejectReason: extras.rejectReason ?? undefined,
  };
  await updateXqWorkOrder({
    id: row.id,
    generatedImageUrl: prompts.find((p) => aiUrlOf(p))?.resultUrl || url,
    imagePromptJson: JSON.stringify(prompts),
  });
}

async function onUploadAi(index: number, file: File) {
  uploading.value = index;
  try {
    const res: any = await uploadFile({ file, directory: 'xq/ai-image' });
    const url = String(res?.url || res?.data || res || '').trim();
    if (!url) {
      message.error('上传未返回地址');
      return false;
    }
    await patchPromptAi(index, url);
    message.success('已替换 AI 图');
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '上传失败');
  } finally {
    uploading.value = null;
  }
  return false;
}

function confirmReplaceWithOriginal(index: number) {
  const pair = comparePairs.value[index];
  if (!pair?.original) {
    message.warning('没有可替换的原图');
    return;
  }
  Modal.confirm({
    title: '确认原图替换',
    content:
      '将用左侧原图覆盖当前 AI 生成结果。此操作会改变对比区展示，是否继续？',
    okText: '确认替换',
    cancelText: '取消',
    okType: 'danger',
    async onOk() {
      await patchPromptAi(index, pair.original);
      message.success('已用原图替换 AI 图');
      await loadTasks();
    },
  });
}

function reviseHistoryKey(sku?: string) {
  return `xq-image-revise-history:${sku || 'unknown'}`;
}

function loadReviseHistory(sku?: string) {
  try {
    const raw = localStorage.getItem(reviseHistoryKey(sku));
    const arr = raw ? JSON.parse(raw) : [];
    reviseHistory.value = Array.isArray(arr) ? arr.slice(0, 20) : [];
  } catch {
    reviseHistory.value = [];
  }
}

function pushReviseHistory(sku: string | undefined, prompt: string) {
  const text = String(prompt || '').trim();
  if (!text) return;
  const next = [
    { id: `${Date.now()}`, prompt: text, at: Date.now() },
    ...reviseHistory.value.filter((h) => h.prompt !== text),
  ].slice(0, 20);
  reviseHistory.value = next;
  try {
    localStorage.setItem(reviseHistoryKey(sku), JSON.stringify(next));
  } catch {
    // ignore
  }
}

const reviseCurrentAi = computed(() => {
  const pair = comparePairs.value[reviseIndex.value];
  return pair?.ai || '';
});

const reviseGigaImages = computed(() => {
  const src = sourceImages.value;
  return src.map((url, i) => ({
    url,
    label: i === 0 ? 'Giga 主图' : `Giga 原图 ${i + 1}`,
    kind: 'giga' as const,
  }));
});

const reviseOtherAiImages = computed(() => {
  const current = reviseCurrentAi.value;
  return comparePairs.value
    .map((p, i) => ({
      url: p.ai,
      label: `AI-${p.label || i + 1}`,
      kind: 'ai' as const,
      index: i,
    }))
    .filter((x) => x.url && x.url !== current);
});

const reviseAiOnlyMode = computed(
  () =>
    reviseIncludeCurrentAi.value &&
    !!reviseCurrentAi.value &&
    reviseBoundUrls.value.length === 0,
);

function toggleReviseBound(url: string) {
  const list = [...reviseBoundUrls.value];
  const i = list.indexOf(url);
  if (i === -1) list.push(url);
  else list.splice(i, 1);
  reviseBoundUrls.value = list;
}

function useCurrentAiOnly() {
  if (!reviseCurrentAi.value) {
    message.warning('当前没有 AI 图可作底稿');
    return;
  }
  reviseIncludeCurrentAi.value = true;
  reviseBoundUrls.value = [];
}

function fillReviseFromOriginal() {
  const pair = comparePairs.value[reviseIndex.value];
  const text = String(pair?.prompt?.promptText || '').trim();
  if (!text) {
    message.warning('暂无原提示词');
    return;
  }
  revisePrompt.value = text;
}

function fillReviseFromHistory() {
  const hit = reviseHistory.value.find((h) => h.id === reviseHistoryId.value);
  if (!hit?.prompt) {
    message.warning('请先选择历史调整说明');
    return;
  }
  revisePrompt.value = hit.prompt;
}

function openReviseDialog(index: number) {
  const pair = comparePairs.value[index];
  if (!pair) return;
  reviseIndex.value = index;
  revisePrompt.value = '';
  reviseHistoryId.value = undefined;
  reviseIncludeCurrentAi.value = !!pair.ai;
  // 默认勾选该槽已绑定的 Giga 原图
  reviseBoundUrls.value = [...(pair.originals || [])].filter(Boolean);
  if (reviseBoundUrls.value.length === 0 && pair.original) {
    reviseBoundUrls.value = [pair.original];
  }
  loadReviseHistory(activeTask.value?.productSku);
  revisePreviewUrl.value = '';
  reviseCurrentAiUrl.value = pair.ai || '';
  reviseUsedRefs.value = [];
  reviseConfirmOpen.value = false;
  reviseOpen.value = true;
}

interface ReviseJob {
  currentAiUrl: string;
  message: string;
  previewUrl: string;
  promptIndex: number;
  revisePrompt: string;
  sku: string;
  slotLabel: string;
  status: 'cancelled' | 'fail' | 'pending' | 'running' | 'success';
  taskId: string;
  usedReferenceUrls: string[];
  workOrderId: number;
}

const reviseJobs = ref<ReviseJob[]>([]);
const reviseProgressOpen = ref(false);
let revisePollTimer: null | ReturnType<typeof setInterval> = null;
const applyJob = ref<null | ReviseJob>(null);

const revisePendingCount = computed(
  () =>
    reviseJobs.value.filter(
      (j) => j.status === 'pending' || j.status === 'running',
    ).length,
);

function startRevisePoll() {
  if (revisePollTimer) return;
  revisePollTimer = setInterval(() => {
    void tickRevisePoll();
  }, 2500);
}

function stopRevisePollIfIdle() {
  if (revisePendingCount.value > 0) return;
  if (revisePollTimer) {
    clearInterval(revisePollTimer);
    revisePollTimer = null;
  }
}

async function tickRevisePoll() {
  const pending = reviseJobs.value.filter(
    (j) => j.status === 'pending' || j.status === 'running',
  );
  if (pending.length === 0) {
    stopRevisePollIfIdle();
    return;
  }
  for (const job of pending) {
    try {
      const res = await getXqWorkOrderReviseImageTask(job.taskId);
      const st = String(res?.status || '').toLowerCase();
      job.message = res?.message || job.message;
      if (st === 'success') {
        const url = String(res?.result?.previewUrl || '').trim();
        job.previewUrl = url;
        job.currentAiUrl = String(
          res?.result?.currentAiUrl || job.currentAiUrl,
        );
        job.usedReferenceUrls = Array.isArray(res?.result?.usedReferenceUrls)
          ? res.result.usedReferenceUrls.filter(Boolean)
          : [];
        job.status = url ? 'success' : 'fail';
        job.message = url ? '改图完成，请确认是否替换' : '改图未返回预览地址';
        if (url) {
          notification.success({
            message: '改图完成',
            description: `${job.sku} · ${job.slotLabel} 已生成预览，请确认是否替换。`,
            duration: 6,
          });
          openReviseConfirmFromJob(job);
        } else {
          notification.error({
            message: '改图失败',
            description: job.message,
          });
        }
      } else if (st === 'fail') {
        job.status = 'fail';
        job.message = res?.message || '改图失败';
        notification.error({
          message: '改图失败',
          description: `${job.sku} · ${job.slotLabel}：${job.message}`,
          duration: 8,
        });
      } else if (st === 'running' || st === 'pending') {
        job.status = st;
      }
    } catch (error: any) {
      job.status = 'fail';
      job.message = error?.message || '查询改图进度失败';
      notification.error({
        message: '改图失败',
        description: job.message,
      });
    }
  }
  stopRevisePollIfIdle();
}

function openReviseConfirmFromJob(job: ReviseJob) {
  applyJob.value = job;
  reviseIndex.value = job.promptIndex;
  revisePrompt.value = job.revisePrompt;
  revisePreviewUrl.value = job.previewUrl;
  reviseCurrentAiUrl.value = job.currentAiUrl;
  reviseUsedRefs.value = job.usedReferenceUrls;
  reviseConfirmOpen.value = true;
  reviseProgressOpen.value = false;
}

function dismissReviseJob(taskId: string) {
  const job = reviseJobs.value.find((j) => j.taskId === taskId);
  if (job && (job.status === 'pending' || job.status === 'running')) {
    job.status = 'cancelled';
    job.message = '已停止跟踪（后台可能仍在出图）';
  }
  reviseJobs.value = reviseJobs.value.filter((j) => j.taskId !== taskId);
  stopRevisePollIfIdle();
  if (reviseJobs.value.length === 0) reviseProgressOpen.value = false;
}

async function submitRevisePreview() {
  const row = activeTask.value;
  if (!row?.id) return;
  const text = revisePrompt.value.trim();
  if (!text) {
    message.warning('请填写调整说明');
    return;
  }
  if (!reviseAiOnlyMode.value && reviseBoundUrls.value.length === 0) {
    message.warning(
      '请选择至少一张绑定参考图，或勾选「附带当前 AI 底稿」后点「仅用当前 AI」',
    );
    return;
  }
  if (reviseAiOnlyMode.value && !reviseCurrentAi.value) {
    message.warning('当前没有 AI 图，无法仅用 AI 底稿');
    return;
  }
  const pair = comparePairs.value[reviseIndex.value];
  reviseBusy.value = true;
  try {
    const submitted = await submitXqWorkOrderReviseImage({
      id: row.id,
      promptIndex: reviseIndex.value,
      revisePrompt: text,
      referenceUrls: reviseBoundUrls.value,
      includeCurrentAi: reviseIncludeCurrentAi.value,
      lockProduct: true,
    });
    const taskId = String(submitted?.taskId || '').trim();
    if (!taskId) {
      message.error('未返回改图任务 ID');
      return;
    }
    const job: ReviseJob = {
      taskId,
      status: 'pending',
      message: submitted?.message || '已提交，等待上游改图…',
      workOrderId: row.id,
      promptIndex: reviseIndex.value,
      sku: String(row.externalSku || row.productSku || row.id),
      slotLabel: pair?.label || `槽位 ${reviseIndex.value + 1}`,
      revisePrompt: text,
      previewUrl: '',
      currentAiUrl: reviseCurrentAi.value,
      usedReferenceUrls: [...reviseBoundUrls.value],
    };
    reviseJobs.value = [job, ...reviseJobs.value];
    reviseOpen.value = false;
    reviseProgressOpen.value = true;
    startRevisePoll();
    message.success('已提交后台改图，完成后会通知你');
  } catch (error: any) {
    message.error(error?.message || '提交改图失败');
  } finally {
    reviseBusy.value = false;
  }
}

async function applyRevisePreview() {
  const url = revisePreviewUrl.value.trim();
  if (!url) {
    message.warning('没有可应用的预览图');
    return;
  }
  const job = applyJob.value;
  const workOrderId = job?.workOrderId || activeTask.value?.id;
  const promptIndex = job?.promptIndex ?? reviseIndex.value;
  const promptText = job?.revisePrompt || revisePrompt.value;
  reviseBusy.value = true;
  try {
    await patchPromptAi(promptIndex, url, {}, workOrderId);
    pushReviseHistory(activeTask.value?.productSku, promptText);
    if (workOrderId) {
      try {
        await updateXqWorkOrderImageStatus({
          id: workOrderId,
          imageStatus: 'revised',
        });
      } catch {
        // 写回图优先，状态失败不阻断
      }
    }
    message.success('已用 AI 改图结果替换当前图位');
    reviseConfirmOpen.value = false;
    reviseOpen.value = false;
    if (job?.taskId) dismissReviseJob(job.taskId);
    applyJob.value = null;
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '写回失败');
  } finally {
    reviseBusy.value = false;
  }
}

const rejectOpen = ref(false);
const rejectReason = ref('');
const rejectBusy = ref(false);
const rejectIndex = ref<number | undefined>();
const rejectSlotHint = ref('');

function openRejectDialog(index?: number, slotLabel?: string) {
  rejectIndex.value = index;
  rejectSlotHint.value = slotLabel || '';
  const pair = index === undefined ? undefined : comparePairs.value[index];
  rejectReason.value = pair?.rejectReason || '';
  rejectOpen.value = true;
}

async function confirmReject() {
  const row = activeTask.value;
  if (!row?.id) {
    throw new Error('无任务');
  }
  const reason = rejectReason.value.trim();
  if (!reason) {
    message.warning('请填写驳回原因');
    throw new Error('请填写驳回原因');
  }
  rejectBusy.value = true;
  saving.value = true;
  try {
    await updateXqWorkOrderImageStatus({
      id: row.id,
      imageStatus: 'rejected',
      rejectReason: reason,
      rejectIndex: rejectIndex.value,
    });
    message.success(
      rejectIndex.value === undefined ? '已驳回全部已出图' : '已驳回该图',
    );
    rejectOpen.value = false;
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '驳回失败');
    throw error;
  } finally {
    rejectBusy.value = false;
    saving.value = false;
  }
}

/** 美工确认本张已改：清该槽驳回；若本套无其它驳回则任务恢复为「已修改」 */
function confirmSlotRevised(index: number, slotLabel?: string) {
  const row = activeTask.value;
  if (!row?.id) return;
  const label = slotLabel || `槽位 ${index + 1}`;
  Modal.confirm({
    title: '确认已修改',
    content: `确认「${label}」已按驳回意见改好？将清除该图驳回标记；若本套图已无其它驳回，任务将恢复为「已修改」。`,
    okText: '确认已修改',
    cancelText: '取消',
    async onOk() {
      saving.value = true;
      try {
        await updateXqWorkOrderImageStatus({
          id: row.id!,
          imageStatus: 'revised',
          rejectIndex: index,
        });
        message.success('已清除该图驳回');
        await loadTasks();
      } catch (error: any) {
        message.error(error?.message || '更新失败');
        throw error;
      } finally {
        saving.value = false;
      }
    },
  });
}

async function setStatus(status: ImageStatus) {
  if (status === 'rejected') {
    openRejectDialog();
    return;
  }
  const row = activeTask.value;
  if (!row?.id) return;
  saving.value = true;
  try {
    await updateXqWorkOrderImageStatus({ id: row.id, imageStatus: status });
    message.success(
      STATUS_OPTS.find((s) => s.value === status)?.label || '已更新',
    );
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '更新状态失败');
  } finally {
    saving.value = false;
  }
}

/** 审核确认：图片+文案无误 → done → 待上架 */
function confirmReviewDone() {
  const row = activeTask.value;
  if (!row?.id) return;
  Modal.confirm({
    title: '确认图文无误',
    content:
      '确认当前图片与文案均无误后，任务将进入「待上架」。若图片有问题请先驳回或改图。',
    okText: '确认进入待上架',
    cancelText: '再看看',
    async onOk() {
      saving.value = true;
      try {
        await updateXqWorkOrderImageStatus({
          id: row.id!,
          imageStatus: 'done',
        });
        message.success('已确认，进入待上架');
        await loadTasks();
      } catch (error: any) {
        message.error(error?.message || '确认失败');
        throw error;
      } finally {
        saving.value = false;
      }
    },
  });
}

/** 已出图/执行中等 → 撤回到待执行，可重新跑生图 */
const canResetToPending = computed(() => {
  const s = currentStatus.value;
  return (
    s === 'running' ||
    s === 'generated' ||
    s === 'rejected' ||
    s === 'revised' ||
    s === 'done'
  );
});

function resetToPending() {
  const row = activeTask.value;
  if (!row?.id) return;
  Modal.confirm({
    title: '消除执行状态',
    content:
      '将把当前任务撤回到「待执行」，并清除生图排队状态。已生成的图片提示词/成品地址会保留，可重新执行生图。是否继续？',
    okText: '撤回到待执行',
    cancelText: '取消',
    onOk: async () => {
      saving.value = true;
      try {
        await updateXqWorkOrderImageStatus({
          id: row.id!,
          imageStatus: 'pending',
        });
        message.success('已撤回到待执行');
        await loadTasks();
      } catch (error: any) {
        message.error(error?.message || '撤回失败');
        throw error;
      } finally {
        saving.value = false;
      }
    },
  });
}

function batchResetToPending() {
  const rows = [...batchResetRows.value];
  if (rows.length === 0) {
    message.warning('请勾选执行中/已出图等可撤回的任务');
    return;
  }
  Modal.confirm({
    title: '批量消除执行状态',
    content: `将把已选 ${rows.length} 条任务撤回到「待执行」，并清除生图排队状态。提示词与成品地址会保留，可重新执行生图。是否继续？`,
    okText: '撤回到待执行',
    cancelText: '取消',
    onOk: async () => {
      batchRunning.value = true;
      let ok = 0;
      let fail = 0;
      try {
        for (const row of rows) {
          if (!row.id) continue;
          try {
            await updateXqWorkOrderImageStatus({
              id: row.id,
              imageStatus: 'pending',
            });
            ok += 1;
          } catch {
            fail += 1;
          }
        }
        if (ok) {
          message.success(`已撤回 ${ok} 条${fail ? `，失败 ${fail}` : ''}`);
          clearSelection();
          await loadTasks();
        } else {
          message.error(`撤回失败 ${fail} 条`);
        }
      } finally {
        batchRunning.value = false;
      }
    },
  });
}

onMounted(async () => {
  await Promise.all([loadUsers(), loadPlatforms()]);
  await loadListingCategories();
  await loadTasks();
});

onUnmounted(() => {
  if (revisePollTimer) {
    clearInterval(revisePollTimer);
    revisePollTimer = null;
  }
});

watch(lockedPlatformId, async () => {
  // 进入平台工作台时清空美工页自选平台，改用锁定平台
  if (lockedPlatformId.value) {
    filterPlatformId.value = undefined;
  }
  filterListingCategoryId.value = undefined;
  await loadListingCategories();
  handleSearch();
});
</script>

<template>
  <Page auto-content-height>
    <div class="xq-copy-pool xq-image-pool">
      <div class="xq-toolbar xq-image-toolbar">
        <div class="xq-title-block">
          <h2>{{ lockedPlatformId ? '图片' : '编辑图片' }}</h2>
          <p>
            {{
              lockedPlatformId
                ? '本平台图片任务：待执行看提示词，出图后原图对照。'
                : '已分配给你的图片任务：待执行看提示词并出图，跑完可对照与完结。'
            }}
          </p>
        </div>
        <div class="xq-toolbar-filters">
          <Input.Search
            v-model:value="keyword"
            allow-clear
            class="xq-search"
            placeholder="搜索任务号 / Item Code / 标题"
            enter-button="搜索"
            @search="handleSearch"
          />
          <Select
            v-model:value="filterImageUserId"
            allow-clear
            show-search
            option-filter-prop="label"
            placeholder="美工"
            class="xq-filter-artist"
            :options="userOptions"
            @change="handleSearch"
          />
          <!-- 美工「编辑图片」：可选平台 -->
          <Select
            v-if="!isPlatformDesk"
            v-model:value="filterPlatformId"
            allow-clear
            show-search
            option-filter-prop="label"
            placeholder="平台"
            class="xq-filter-platform"
            :options="platformOptions"
            @change="(v: any) => onFilterPlatformChange(v || undefined)"
          />
          <!-- 平台工作台只展示平台类目；美工页选平台后也可筛类目 -->
          <TreeSelect
            v-model:value="filterListingCategoryId"
            allow-clear
            show-search
            tree-node-filter-prop="title"
            class="xq-filter-plat-cat"
            placeholder="平台类目"
            :disabled="!effectivePlatformId"
            :tree-data="listingCategoryTreeData"
            :dropdown-style="{ maxHeight: '360px', overflow: 'auto' }"
            @change="handleSearch"
          />
        </div>
      </div>

      <div class="xq-status-tabs">
        <button
          v-for="tab in statusTabs"
          :key="tab.value || 'all'"
          type="button"
          class="xq-status-tab"
          :class="{ active: statusFilter === tab.value }"
          @click="setStatusFilter(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="xq-batch-bar">
        <Checkbox
          :checked="pageAllSelected"
          :indeterminate="selectedCount > 0 && !pageAllSelected"
          @change="(e: any) => toggleSelectPage(Boolean(e?.target?.checked))"
        >
          全选
        </Checkbox>
        <span class="xq-batch-count">已选 {{ selectedCount }}</span>
        <Button
          type="primary"
          :loading="batchRunning"
          :disabled="batchExecutableRows.length === 0 || batchRunning"
          @click="batchRunGenerate"
        >
          批量执行生图
          <template v-if="batchExecutableRows.length">
            ({{ batchExecutableRows.length }})
          </template>
        </Button>
        <Button
          :disabled="batchPromptRows.length === 0 || batchRunning"
          @click="openBatchPrompt"
        >
          批量上传提示词
          <template v-if="batchPromptRows.length">
            ({{ batchPromptRows.length }})
          </template>
        </Button>
        <Button
          danger
          ghost
          :loading="batchRunning"
          :disabled="batchResetRows.length === 0 || batchRunning"
          @click="batchResetToPending"
        >
          批量消除
          <template v-if="batchResetRows.length">
            ({{ batchResetRows.length }})
          </template>
        </Button>
        <Button
          v-if="selectedCount > 0"
          type="link"
          :disabled="batchRunning"
          @click="clearSelection"
        >
          清空勾选
        </Button>
      </div>

      <Spin :spinning="loading || batchRunning">
        <div v-if="displayTasks.length" class="xq-split">
          <aside class="xq-list">
            <div
              v-for="row in displayTasks"
              :key="row.id"
              class="xq-list-group"
            >
              <div
                class="xq-list-item xq-list-item-compact"
                :class="{
                  active: activeId === row.id,
                  checked: isChecked(row),
                }"
                role="button"
                tabindex="0"
                @click="selectTask(row)"
              >
                <div class="xq-list-check" @click.stop>
                  <Checkbox
                    :checked="isChecked(row)"
                    @change="(e: any) => toggleCheck(row, !!e?.target?.checked)"
                  />
                </div>
                <div class="xq-list-thumb">
                  <Image :src="coverOf(row)" :preview="false" />
                </div>
                <div class="xq-list-body">
                  <span class="xq-list-sku" :title="skuLabel(row)">{{
                    skuLabel(row)
                  }}</span>
                  <Tag class="xq-list-status" :color="statusMeta(row).color">
                    {{ statusMeta(row).label }}
                  </Tag>
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
            <div class="xq-detail-bar">
              <div class="xq-detail-bar-meta">
                <b>{{ skuLabel(activeTask) }}</b>
                <Tag :color="statusMeta(activeTask).color">
                  {{ statusMeta(activeTask).label }}
                </Tag>
                <span class="xq-muted">{{ artistName(activeTask) }}</span>
              </div>
              <div class="xq-detail-actions">
                <Button
                  :type="sourcePanelOpen ? 'primary' : 'default'"
                  size="small"
                  :title="sourcePanelOpen ? '关闭原内容' : '打开原内容抽屉'"
                  @click="toggleSourcePanel()"
                >
                  {{ sourceSku }}
                </Button>
                <Button
                  v-if="canEdit && showPrompts"
                  type="primary"
                  size="small"
                  :loading="running"
                  @click="runGenerate"
                >
                  执行生图
                </Button>
                <Button
                  v-if="canEdit && showPrompts"
                  size="small"
                  :loading="saving"
                  @click="savePrompts"
                >
                  保存提示词
                </Button>
                <Button
                  v-if="canEdit && canResetToPending"
                  size="small"
                  danger
                  ghost
                  :loading="saving"
                  @click="resetToPending"
                >
                  消除执行状态
                </Button>
                <Button
                  v-if="isAssigner && showCompare"
                  size="small"
                  danger
                  :loading="saving"
                  @click="openRejectDialog()"
                >
                  驳回
                </Button>
                <Button
                  v-if="canEdit && currentStatus === 'rejected'"
                  size="small"
                  :loading="saving"
                  @click="setStatus('revised')"
                >
                  已修改
                </Button>
                <Button
                  v-if="
                    (isAssigner || canEdit) &&
                    showCompare &&
                    (currentStatus === 'generated' ||
                      currentStatus === 'revised')
                  "
                  size="small"
                  type="primary"
                  :loading="saving"
                  @click="confirmReviewDone"
                >
                  确认图文无误
                </Button>
              </div>
            </div>

            <div class="xq-edit-block xq-highlight-block">
              <label class="xq-field-label">
                突出风格
                <span class="xq-muted"
                  >（可选标签，勾选后给生图用，不要写成句子）</span
                >
              </label>
              <div class="xq-tag-row">
                <Tag
                  v-for="tag in highlightTags"
                  :key="tag"
                  class="xq-style-tag"
                  :color="selectedHighlight.includes(tag) ? 'blue' : 'default'"
                  closable
                  @close="removeHighlightTag(tag)"
                  @click="
                    toggleHighlight(tag, !selectedHighlight.includes(tag))
                  "
                >
                  {{ tag }}
                </Tag>
                <span v-if="!highlightTags.length" class="xq-muted">
                  暂无标签，可手加或到文案池重新生成
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
                <Button
                  v-if="canEdit"
                  type="primary"
                  ghost
                  :loading="saving"
                  @click="saveHighlight"
                >
                  保存风格
                </Button>
              </div>
            </div>

            <!-- 待执行：图片提示词（原版：左 Giga 原图 / 右提示词） -->
            <div v-if="showPrompts" class="xq-prompt-work">
              <div class="xq-prompt-image-layout">
                <aside class="xq-prompt-source-panel">
                  <div class="xq-prompt-source-head">
                    <div class="xq-prompt-source-title">Giga 原图</div>
                    <div class="xq-prompt-source-hint">
                      先点右侧提示词，再点左侧图片绑定（可多选）
                    </div>
                    <div v-if="slotSummary" class="xq-prompt-source-rule">
                      出图规则：{{ slotSummary }}
                    </div>
                  </div>
                  <div
                    v-if="sourceImages.length"
                    class="xq-prompt-source-scroll"
                  >
                    <div
                      v-for="(url, si) in sourceImages"
                      :key="`src-${si}`"
                      class="xq-prompt-source-item"
                      :class="{ 'is-selected': isSourceBoundToActive(si) }"
                      :title="shortSourceLabel(si)"
                      @click="toggleBindSourceToActive(si)"
                    >
                      <div class="xq-prompt-source-thumb-wrap">
                        <img :src="url" alt="" class="xq-prompt-source-thumb" />
                        <button
                          type="button"
                          class="xq-prompt-source-zoom"
                          title="放大查看"
                          @click.stop="openSourcePreview(url)"
                        >
                          <ZoomInOutlined />
                        </button>
                      </div>
                      <span class="xq-prompt-source-label">{{
                        shortSourceLabel(si)
                      }}</span>
                    </div>
                  </div>
                  <div v-else class="xq-prompt-empty xq-prompt-source-empty">
                    暂无 Giga 原图，请先同步产品快照后再绑定
                  </div>
                  <Image
                    v-if="sourcePreviewUrl"
                    :src="sourcePreviewUrl"
                    :style="{ display: 'none' }"
                    :preview="{
                      visible: sourcePreviewVisible,
                      src: sourcePreviewUrl,
                      onVisibleChange: onSourcePreviewVisibleChange,
                    }"
                  />
                </aside>

                <div class="xq-prompt-image-main">
                  <Alert
                    type="info"
                    show-icon
                    class="xq-prompt-bind-tip"
                    message="默认绑定 Giga 主图（可多选）。多选时会分文件传给 AI；尺寸图请同时绑产品原图和带标注的尺寸图。"
                  />
                  <div class="xq-prompt-toolbar">
                    <Button size="small" @click="addImagePrompt">
                      新增一条
                    </Button>
                    <span class="xq-prompt-toolbar-hint">
                      {{
                        promptDraft.length
                          ? `当前选中：第 ${activePromptIndex + 1} 条（左侧点选绑定）`
                          : '请先新增提示词，再点击左侧原图绑定'
                      }}
                    </span>
                    <Button
                      size="small"
                      :disabled="!promptDraft.length || !sourceImages.length"
                      @click="bindAllImagePromptsToMain"
                    >
                      全部绑定主图
                    </Button>
                    <Button
                      size="small"
                      :disabled="!promptDraft.length || !sourceImages.length"
                      @click="bindImagePromptsBySequence"
                    >
                      按序号绑定原图
                    </Button>
                    <Upload
                      :show-upload-list="false"
                      accept=".xlsx,.xls,.docx,.txt,.json"
                      :before-upload="
                        (file) => onImportPromptFile(file as File)
                      "
                    >
                      <Button size="small" type="primary">
                        导入 Excel / Word
                      </Button>
                    </Upload>
                    <Button
                      size="small"
                      :disabled="
                        !promptDraft.some((p) =>
                          String(p.promptText || '').trim(),
                        )
                      "
                      @click="exportImagePromptsText"
                    >
                      导出提示词
                    </Button>
                  </div>
                  <div class="xq-prompt-image-list">
                    <div v-if="!promptDraft.length" class="xq-prompt-empty">
                      暂无图片提示词
                    </div>
                    <template v-else>
                      <div
                        v-for="(p, i) in promptDraft"
                        :key="`slot-${i}-${p.imageType}`"
                        class="xq-prompt-item"
                        :class="{ 'is-active': activePromptIndex === i }"
                        @click="setActivePrompt(i)"
                      >
                        <div class="xq-prompt-item-head">
                          <span class="xq-prompt-item-title">
                            第 {{ i + 1 }} 条
                            <Tag
                              v-if="isDimensionPrompt(p)"
                              color="orange"
                              class="xq-prompt-type-tag"
                            >
                              尺寸图
                            </Tag>
                            <Tag
                              v-else-if="isDetailPrompt(p)"
                              color="orange"
                              class="xq-prompt-type-tag"
                            >
                              细节图
                            </Tag>
                            <Tag v-else color="blue" class="xq-prompt-type-tag">
                              {{
                                imageSlots[i]?.label ||
                                imageTypeLabel(p.imageType, i) ||
                                '主图'
                              }}
                            </Tag>
                            <span class="xq-muted"
                              >绑定 {{ boundLabel(p) }}</span
                            >
                          </span>
                          <div class="xq-prompt-item-actions" @click.stop>
                            <span class="xq-prompt-bind-label">绑定原图</span>
                            <Select
                              :value="p.bindIndexes || []"
                              mode="multiple"
                              allow-clear
                              size="small"
                              placeholder="选择 Giga 原图（可多选）"
                              class="xq-prompt-bind-select"
                              :disabled="!sourceImages.length"
                              :options="sourceImageOptions"
                              :max-tag-count="2"
                              @change="
                                (vals) =>
                                  setPromptBindingIndexes(
                                    i,
                                    (vals as number[]) || [],
                                  )
                              "
                            />
                            <Button
                              type="link"
                              danger
                              size="small"
                              @click="removeImagePrompt(i)"
                            >
                              删除
                            </Button>
                          </div>
                        </div>
                        <Input.TextArea
                          v-model:value="p.promptText"
                          :rows="4"
                          placeholder="格式：第一行图片名称（如 尺寸图 / 主图），后续行为提示词内容"
                          @focus="setActivePrompt(i)"
                        />
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- 已出图：原图对照 -->
            <div v-else class="xq-compare-grid">
              <div
                v-for="pair in comparePairs"
                :key="`pair-${pair.index}`"
                class="xq-compare-card"
              >
                <div class="xq-compare-head">
                  <div class="xq-compare-head-left">
                    <span class="xq-compare-type">{{ pair.label }}</span>
                    <span class="xq-compare-slot"
                      >p{{ String(pair.index + 1).padStart(2, '0') }}</span
                    >
                  </div>
                  <span
                    class="xq-compare-state"
                    :class="pair.ai ? 'is-ready' : 'is-wait'"
                  >
                    {{ pair.ai ? '已出图' : '待出图' }}
                  </span>
                </div>
                <div class="xq-compare-pair">
                  <div class="xq-compare-col">
                    <div class="xq-compare-cap">
                      <span class="xq-compare-pill">原图</span>
                      <span class="xq-compare-cap-text">Giga · 本地同步</span>
                    </div>
                    <div
                      v-if="pair.originals?.length"
                      class="xq-compare-thumbs"
                      :class="{
                        'is-multi': (pair.originals?.length || 0) > 1,
                      }"
                    >
                      <div
                        v-for="(url, oi) in pair.originals"
                        :key="`co-${pair.index}-${oi}`"
                        class="xq-compare-img"
                      >
                        <Image :src="url" :preview="true" />
                      </div>
                    </div>
                    <div v-else class="xq-compare-img is-empty">
                      <span>无原图</span>
                    </div>
                  </div>
                  <div class="xq-compare-divider" aria-hidden="true">
                    <span>→</span>
                  </div>
                  <div class="xq-compare-col ai">
                    <div class="xq-compare-cap ai-cap">
                      <span class="xq-compare-pill ai">AI</span>
                      <span class="xq-compare-cap-text">生成结果</span>
                    </div>
                    <div
                      class="xq-compare-img ai-result"
                      :class="{
                        'is-empty': !pair.ai,
                        'is-rejected': !!pair.rejectReason,
                      }"
                    >
                      <Image v-if="pair.ai" :src="pair.ai" :preview="true" />
                      <span v-else>待出图</span>
                      <div
                        v-if="pair.rejectReason"
                        class="xq-compare-reject"
                        :title="pair.rejectReason"
                      >
                        驳回：{{ pair.rejectReason }}
                      </div>
                    </div>
                    <div class="xq-compare-acts">
                      <button
                        type="button"
                        class="xq-act-cta"
                        :disabled="!canEdit || !pair.ai"
                        @click="openReviseDialog(pair.index)"
                      >
                        <IconifyIcon
                          icon="lucide:sparkles"
                          class="xq-act-ico"
                        />
                        <span>单图修改</span>
                      </button>
                      <div class="xq-act-tools">
                        <button
                          type="button"
                          class="xq-act-tool"
                          :disabled="!canEdit || !pair.original"
                          title="用左侧原图覆盖当前 AI 图"
                          @click="confirmReplaceWithOriginal(pair.index)"
                        >
                          <IconifyIcon
                            icon="lucide:replace"
                            class="xq-act-ico"
                          />
                          <span>原图替换</span>
                        </button>
                        <Upload
                          class="xq-act-upload"
                          :show-upload-list="false"
                          accept="image/*"
                          :disabled="!canEdit || uploading === pair.index"
                          :before-upload="
                            (file) => onUploadAi(pair.index, file as File)
                          "
                        >
                          <button
                            type="button"
                            class="xq-act-tool"
                            :disabled="!canEdit || uploading === pair.index"
                            title="本地上传替换 AI 图"
                          >
                            <IconifyIcon
                              v-if="uploading !== pair.index"
                              icon="lucide:upload"
                              class="xq-act-ico"
                            />
                            <span>{{
                              uploading === pair.index ? '上传中…' : '本地上传'
                            }}</span>
                          </button>
                        </Upload>
                        <button
                          v-if="canEdit && pair.rejectReason"
                          type="button"
                          class="xq-act-tool is-ok"
                          title="确认本张已按驳回改好，清除驳回标记"
                          @click="confirmSlotRevised(pair.index, pair.label)"
                        >
                          <IconifyIcon
                            icon="lucide:circle-check"
                            class="xq-act-ico"
                          />
                          <span>已修改</span>
                        </button>
                        <button
                          v-if="isAssigner"
                          type="button"
                          class="xq-act-tool is-danger"
                          title="标记本张不合格"
                          @click="openRejectDialog(pair.index, pair.label)"
                        >
                          <IconifyIcon
                            icon="lucide:circle-x"
                            class="xq-act-ico"
                          />
                          <span>不合格</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Empty v-else class="xq-detail-empty" description="请选择左侧任务" />
        </div>
        <Empty
          v-else
          description="暂无已分配图片任务。请在「我的文案」分配美工，也可分配给自己。"
        />
      </Spin>

      <!-- 原内容：半屏详情抽屉（选品库同款布局） -->
      <XqSourceProductDrawer
        v-model:open="sourcePanelOpen"
        :task="activeTask"
        :family="sourceFamily"
        @select-member="onSelectSourceMember"
      />

      <Modal
        v-model:open="reviseOpen"
        title="单图 AI 修改"
        :width="980"
        destroy-on-close
        :footer="null"
        wrap-class-name="xq-revise-modal"
        :styles="{ body: { padding: '12px 16px 0' } }"
      >
        <div class="xq-revise-body">
          <Alert
            type="info"
            show-icon
            class="xq-revise-tip"
            message="提交后后台改图，可继续处理其它图；完成后通知并弹出预览，确认后才覆盖当前 AI 图位。"
          />

          <div class="xq-revise-scroll">
            <div class="xq-revise-layout">
              <aside class="xq-revise-aside">
                <div class="xq-revise-panel">
                  <div class="xq-revise-section-title">
                    当前 AI 图
                    <span class="xq-revise-badge">回写目标</span>
                  </div>
                  <div v-if="reviseCurrentAi" class="xq-revise-hero">
                    <Image
                      :src="reviseCurrentAi"
                      :preview="{ src: reviseCurrentAi }"
                    />
                  </div>
                  <div v-else class="xq-revise-hero is-empty">暂无 AI 图</div>
                  <div class="xq-revise-current-acts">
                    <Checkbox v-model:checked="reviseIncludeCurrentAi">
                      附带当前 AI 作排版底稿
                    </Checkbox>
                    <Button
                      v-if="reviseIncludeCurrentAi"
                      type="link"
                      size="small"
                      class="xq-revise-link"
                      @click="useCurrentAiOnly"
                    >
                      仅用当前 AI
                    </Button>
                  </div>
                </div>
              </aside>

              <div class="xq-revise-main">
                <div v-if="reviseGigaImages.length" class="xq-revise-panel">
                  <div class="xq-revise-section-title">
                    Giga 原图
                    <span class="xq-revise-sub">点击勾选参考</span>
                  </div>
                  <div class="xq-revise-strip">
                    <button
                      v-for="img in reviseGigaImages"
                      :key="`rg-${img.url}`"
                      type="button"
                      class="xq-revise-item"
                      :class="{
                        'is-selected': reviseBoundUrls.includes(img.url),
                      }"
                      @click="toggleReviseBound(img.url)"
                    >
                      <div class="xq-revise-thumb">
                        <img :src="img.url" alt="" />
                      </div>
                      <span class="xq-revise-label">{{ img.label }}</span>
                    </button>
                  </div>
                </div>

                <div v-if="reviseOtherAiImages.length" class="xq-revise-panel">
                  <div class="xq-revise-section-title">
                    已生成 AI 图
                    <span class="xq-revise-sub">可作参考</span>
                  </div>
                  <div class="xq-revise-strip">
                    <button
                      v-for="img in reviseOtherAiImages"
                      :key="`ra-${img.url}`"
                      type="button"
                      class="xq-revise-item"
                      :class="{
                        'is-selected': reviseBoundUrls.includes(img.url),
                      }"
                      @click="toggleReviseBound(img.url)"
                    >
                      <div class="xq-revise-thumb">
                        <img :src="img.url" alt="" />
                      </div>
                      <span class="xq-revise-label">{{ img.label }}</span>
                      <span class="xq-revise-kind">AI</span>
                    </button>
                  </div>
                </div>

                <div class="xq-revise-panel">
                  <div class="xq-revise-field">
                    <div class="xq-revise-field-label">
                      绑定参考图
                      <span v-if="!reviseAiOnlyMode" class="req">*</span>
                    </div>
                    <div class="xq-revise-bound-tags">
                      <Tag
                        v-for="url in reviseBoundUrls"
                        :key="`bt-${url}`"
                        closable
                        color="blue"
                        @close="toggleReviseBound(url)"
                      >
                        {{
                          reviseGigaImages.find((g) => g.url === url)?.label ||
                          reviseOtherAiImages.find((g) => g.url === url)
                            ?.label ||
                          '参考图'
                        }}
                      </Tag>
                      <span v-if="reviseAiOnlyMode" class="xq-muted">
                        仅用当前 AI 底稿
                      </span>
                      <span
                        v-else-if="!reviseBoundUrls.length"
                        class="xq-muted is-warn"
                      >
                        请点选原图/AI 图，或「仅用当前 AI」
                      </span>
                    </div>
                  </div>

                  <div class="xq-revise-field">
                    <div class="xq-revise-field-label">
                      原提示词
                      <Button
                        v-if="comparePairs[reviseIndex]?.prompt?.promptText"
                        type="link"
                        size="small"
                        class="xq-revise-link"
                        @click="fillReviseFromOriginal"
                      >
                        填入调整说明
                      </Button>
                    </div>
                    <pre
                      v-if="comparePairs[reviseIndex]?.prompt?.promptText"
                      class="xq-revise-prompt-box"
                      >{{ comparePairs[reviseIndex]?.prompt?.promptText }}</pre>
                    <div v-else class="xq-muted">暂无原先提示词</div>
                  </div>

                  <div v-if="reviseHistory.length" class="xq-revise-field">
                    <div class="xq-revise-field-label">历史提交提示</div>
                    <div class="xq-revise-history-row">
                      <Select
                        v-model:value="reviseHistoryId"
                        allow-clear
                        class="xq-revise-history-select"
                        placeholder="选择历史调整说明"
                        :options="
                          reviseHistory.map((h) => ({
                            value: h.id,
                            label: h.prompt.slice(0, 48),
                          }))
                        "
                      />
                      <Button
                        size="small"
                        :disabled="!reviseHistoryId"
                        @click="fillReviseFromHistory"
                      >
                        填入
                      </Button>
                    </div>
                  </div>

                  <div class="xq-revise-field is-last">
                    <div class="xq-revise-field-label">
                      调整说明 <span class="req">*</span>
                    </div>
                    <Textarea
                      v-model:value="revisePrompt"
                      :rows="4"
                      placeholder="例如：背景改为纯白、产品再亮一些、去掉阴影…"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="xq-revise-footer">
            <Button @click="reviseOpen = false">取消</Button>
            <Button
              type="primary"
              :loading="reviseBusy"
              :disabled="!canEdit"
              @click="submitRevisePreview"
            >
              提交后台改图
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        v-model:open="reviseProgressOpen"
        title="改图进度"
        :footer="null"
        :width="560"
      >
        <div v-if="!reviseJobs.length" class="xq-revise-job-empty">
          当前没有改图任务
        </div>
        <div
          v-for="job in reviseJobs"
          :key="job.taskId"
          class="xq-revise-job"
          :class="`is-${job.status}`"
        >
          <div class="xq-revise-job-main">
            <div class="xq-revise-job-title">
              <span v-if="job.status === 'pending' || job.status === 'running'">
                数字员工生成中
              </span>
              <span v-else-if="job.status === 'success'">改图已完成</span>
              <span v-else-if="job.status === 'fail'">改图失败</span>
              <span v-else>已停止跟踪</span>
            </div>
            <div class="xq-revise-job-meta">
              {{ job.sku }} · {{ job.slotLabel }} · {{ job.taskId }}
            </div>
            <div class="xq-revise-job-msg">{{ job.message }}</div>
          </div>
          <div class="xq-revise-job-acts">
            <Button
              v-if="job.status === 'success'"
              type="primary"
              size="small"
              @click="openReviseConfirmFromJob(job)"
            >
              查看预览
            </Button>
            <Button
              v-if="job.status === 'pending' || job.status === 'running'"
              size="small"
              danger
              ghost
              @click="dismissReviseJob(job.taskId)"
            >
              停止跟踪
            </Button>
            <Button v-else size="small" @click="dismissReviseJob(job.taskId)">
              关闭
            </Button>
          </div>
        </div>
      </Modal>

      <button
        v-if="reviseJobs.length && !reviseProgressOpen"
        type="button"
        class="xq-revise-dock"
        @click="reviseProgressOpen = true"
      >
        {{
          revisePendingCount
            ? `改图中 ${revisePendingCount}`
            : `改图结果 ${reviseJobs.length}`
        }}
      </button>

      <Modal
        v-model:open="reviseConfirmOpen"
        title="确认是否替换当前 AI 图"
        :width="920"
        destroy-on-close
        :footer="null"
      >
        <Alert
          type="info"
          show-icon
          class="xq-revise-tip"
          message="生成结果仅预览，确认后才会替换当前 AI 图片位；放弃则保留原图。"
        />
        <div class="xq-revise-confirm-grid">
          <div class="xq-revise-confirm-col">
            <div class="xq-revise-section-title">改前（当前 AI）</div>
            <div class="xq-revise-confirm-img">
              <Image
                v-if="reviseCurrentAiUrl"
                :src="reviseCurrentAiUrl"
                :preview="true"
              />
              <span v-else class="xq-muted">无</span>
            </div>
          </div>
          <div class="xq-revise-confirm-arrow">→</div>
          <div class="xq-revise-confirm-col">
            <div class="xq-revise-section-title">将写入 AI 图位</div>
            <div class="xq-revise-confirm-img is-preview">
              <Image
                v-if="revisePreviewUrl"
                :src="revisePreviewUrl"
                :preview="true"
              />
            </div>
          </div>
        </div>
        <div v-if="reviseUsedRefs.length" class="xq-revise-section">
          <div class="xq-revise-section-title">本次参考图</div>
          <div class="xq-revise-strip">
            <div
              v-for="url in reviseUsedRefs"
              :key="`ur-${url}`"
              class="xq-revise-item"
            >
              <div class="xq-revise-thumb">
                <Image :src="url" :preview="true" />
              </div>
            </div>
          </div>
        </div>
        <div class="xq-revise-field">
          <div class="xq-revise-section-title">调整说明</div>
          <pre class="xq-revise-prompt-box is-adjust">{{ revisePrompt }}</pre>
        </div>
        <div class="xq-revise-footer">
          <Button @click="reviseConfirmOpen = false">放弃预览</Button>
          <Button
            type="primary"
            danger
            :loading="reviseBusy"
            @click="applyRevisePreview"
          >
            确认替换
          </Button>
        </div>
      </Modal>

      <Modal
        v-model:open="rejectOpen"
        title="驳回图片"
        :confirm-loading="rejectBusy"
        destroy-on-close
        ok-text="确认驳回"
        ok-type="danger"
        cancel-text="取消"
        @ok="confirmReject"
      >
        <Alert
          type="warning"
          show-icon
          class="xq-reject-tip"
          :message="
            rejectSlotHint
              ? `将驳回「${rejectSlotHint}」，该图红框会显示原因。`
              : '未指定单图时，原因会写到所有已出图槽位并红框展示。'
          "
        />
        <div class="xq-reject-field">
          <label>驳回原因 <span class="req">*</span></label>
          <Textarea
            v-model:value="rejectReason"
            :rows="4"
            placeholder="例如：主图背景不符合要求、产品变形、尺寸图缺标注…"
          />
        </div>
      </Modal>

      <Modal
        v-model:open="batchPromptOpen"
        title="批量上传提示词"
        :confirm-loading="batchPromptBusy"
        :footer="null"
        destroy-on-close
        width="600px"
      >
        <div class="xq-batch-prompt">
          <p class="xq-batch-prompt-tip">
            已勾选可写任务 {{ batchPromptRows.length }} 个。
          </p>
          <div class="xq-batch-prompt-card">
            <b>方式一：同步当前提示词</b>
            <p class="xq-muted">
              把右侧当前任务的提示词 /
              突出风格，写入所有勾选任务（按各自平台槽位对齐）。
            </p>
            <Button
              type="primary"
              :loading="batchPromptBusy"
              :disabled="
                !promptDraft.some((p) => String(p.promptText || '').trim())
              "
              @click="syncPromptsToSelected"
            >
              同步到勾选任务
            </Button>
          </div>
          <div class="xq-batch-prompt-card">
            <b>方式二：导入 Excel / Word</b>
            <p class="xq-muted">
              Excel：A
              列每行一条提示词（与「导出提示词」一致）。Word：按章节或段落拆分。
            </p>
            <Radio.Group
              v-model:value="batchSheetMode"
              size="small"
              class="xq-batch-sheet-mode"
              :disabled="batchPromptBusy"
            >
              <Radio.Button value="one">一文件 → 全部勾选</Radio.Button>
              <Radio.Button value="sku">多文件按文件名匹配 SKU</Radio.Button>
            </Radio.Group>
            <p class="xq-muted">
              {{
                batchSheetMode === 'one'
                  ? '选择一个 xlsx/docx，写入全部勾选任务，并按序号绑原图。'
                  : '文件名需包含 SKU，如 DCW25003_图片提示词.xlsx'
              }}
            </p>
            <Upload
              :show-upload-list="false"
              accept=".xlsx,.xls,.docx,.txt"
              :multiple="batchSheetMode === 'sku'"
              :disabled="batchPromptBusy"
              :before-upload="(file) => onBatchSheetBeforeUpload(file as File)"
            >
              <Button type="primary" :loading="batchPromptBusy">
                {{
                  batchSheetMode === 'one'
                    ? '选择 Excel / Word'
                    : '选择多个 Excel / Word'
                }}
              </Button>
            </Upload>
          </div>
          <div class="xq-batch-prompt-card">
            <b>方式三：上传 JSON</b>
            <p class="xq-muted">
              格式示例：
              <code
                >[{ "sku": "DCW25003", "prompts": [{ "imageType": "main",
                "promptText": "..." }] }]</code
              >
            </p>
            <Upload
              :show-upload-list="false"
              accept=".json,application/json"
              :disabled="batchPromptBusy"
              :before-upload="(file) => onBatchPromptJsonFile(file as File)"
            >
              <Button :loading="batchPromptBusy">选择 JSON 文件</Button>
            </Upload>
          </div>
        </div>
      </Modal>
    </div>
  </Page>
</template>

<style scoped src="../_pool.css"></style>
<style scoped>
.xq-muted {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
}

.xq-muted.is-warn {
  color: #ea580c;
}

.xq-image-pool .xq-split {
  grid-template-columns: minmax(176px, 212px) 1fr;
  gap: 14px;
}

.xq-image-pool .xq-list {
  gap: 6px;
  padding: 8px;
  background: #f8fafc;
  border-color: #e8edf3;
}

.xq-image-pool .xq-list-item-compact {
  grid-template-columns: 18px 48px minmax(0, 1fr);
  gap: 8px;
  padding: 7px 8px;
  background: #fff;
  border: 1px solid transparent;
  border-radius: 10px;
  box-shadow: 0 1px 0 rgb(15 23 42 / 3%);
}

.xq-image-pool .xq-list-item-compact:hover {
  background: #fff;
  border-color: #dbeafe;
}

.xq-image-pool .xq-list-item-compact.active {
  background: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px rgb(59 130 246 / 18%);
}

.xq-image-pool .xq-list-thumb {
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgb(15 23 42 / 6%);
}

.xq-image-pool .xq-list-thumb :deep(.ant-image),
.xq-image-pool .xq-list-thumb :deep(img) {
  width: 48px;
  height: 48px;
}

.xq-image-pool .xq-list-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.xq-image-pool .xq-list-sku {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
  color: #0f172a;
  white-space: nowrap;
}

.xq-image-pool .xq-list-status {
  width: fit-content;
  max-width: 100%;
  padding: 0 6px;
  margin: 0;
  font-size: 11px;
  line-height: 18px;
  border-radius: 999px;
}

.xq-image-pool .xq-list-check {
  display: flex;
  align-items: center;
  justify-content: center;
}

.xq-image-toolbar {
  align-items: flex-end;
}

.xq-toolbar-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.xq-image-pool .xq-search,
.xq-copy-pool .xq-search {
  width: min(240px, 100%);
}

.xq-filter-artist {
  width: 150px;
}

.xq-filter-platform {
  width: 150px;
}

.xq-filter-plat-cat {
  width: 180px;
}

.xq-status-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.xq-status-tab {
  position: relative;
  padding: 7px 12px;
  font-size: 13px;
  line-height: 1.2;
  color: #64748b;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.xq-status-tab:hover {
  color: #1d4ed8;
  background: rgb(255 255 255 / 70%);
}

.xq-status-tab.active {
  font-weight: 600;
  color: #1d4ed8;
  background: #fff;
  box-shadow: 0 1px 2px rgb(15 23 42 / 8%);
}

.xq-batch-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  align-items: center;
  padding: 10px 12px;
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.xq-batch-count {
  min-width: 56px;
  margin-right: 4px;
  font-size: 13px;
  color: #64748b;
}

.xq-list-item.checked {
  background: #eff6ff !important;
  border-color: #93c5fd !important;
}

.xq-batch-prompt {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.xq-batch-prompt-tip {
  margin: 0;
  font-size: 13px;
  color: #475569;
}

.xq-batch-prompt-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e8edf3;
  border-radius: 10px;
}

.xq-batch-prompt-card code {
  display: inline-block;
  max-width: 100%;
  margin-top: 4px;
  font-size: 11px;
  word-break: break-all;
  white-space: pre-wrap;
}

.xq-batch-sheet-mode {
  margin: 2px 0;
}

.xq-image-pool .xq-detail {
  gap: 16px;
  padding: 16px 18px 20px;
  border-color: #e8edf3;
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
}

.xq-detail-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
  align-items: center;
  justify-content: space-between;
  padding: 2px 0 12px;
  border-bottom: 1px solid #eef2f7;
}

.xq-detail-bar-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
  font-size: 13px;
}

.xq-detail-bar-meta b {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.xq-detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.xq-highlight-block {
  margin: 12px 0 16px;
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
  flex-wrap: wrap;
  gap: 8px;
  max-width: 480px;
}

.xq-tag-input {
  flex: 1;
}

.xq-image-pool .xq-highlight-block {
  gap: 6px;
  padding-bottom: 4px;
}

.xq-image-pool .xq-highlight-block .xq-tag-add {
  max-width: 420px;
}

.xq-prompt-work {
  flex: 1;
  min-height: 0;
}

.xq-prompt-image-layout {
  display: flex;
  gap: 12px;
  align-items: stretch;
  height: min(68vh, 720px);
  min-height: 480px;
}

.xq-prompt-source-panel {
  display: flex;
  flex: 1.05 1 0;
  flex-direction: column;
  min-width: 320px;
  max-width: 48%;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.xq-prompt-source-head {
  flex-shrink: 0;
  padding: 8px 10px 6px;
  border-bottom: 1px solid #f3f4f6;
}

.xq-prompt-source-title {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
}

.xq-prompt-source-hint {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.35;
  color: #6b7280;
}

.xq-prompt-source-rule {
  margin-top: 4px;
  font-size: 11px;
  color: #9ca3af;
}

.xq-prompt-source-scroll {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 6px;
  align-content: start;
  min-height: 0;
  padding: 8px;
  overflow-y: auto;
}

.xq-prompt-source-empty {
  margin: 16px 10px;
  text-align: center;
}

.xq-prompt-source-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  width: 100%;
  min-width: 0;
  cursor: pointer;
  user-select: none;
}

.xq-prompt-source-thumb-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f3f4f6;
  border-radius: 4px;
}

.xq-prompt-source-thumb {
  box-sizing: border-box;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  border: 2px solid transparent;
  border-radius: 4px;
}

.xq-prompt-source-item.is-selected .xq-prompt-source-thumb {
  border-color: #2563eb;
  box-shadow: 0 0 0 1px #93c5fd;
}

.xq-prompt-source-item:hover .xq-prompt-source-thumb {
  border-color: #93c5fd;
}

.xq-prompt-source-zoom {
  position: absolute;
  right: 2px;
  bottom: 2px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: #fff;
  cursor: pointer;
  background: rgb(0 0 0 / 55%);
  border: none;
  border-radius: 3px;
  opacity: 0.9;
}

.xq-prompt-source-zoom:hover {
  background: rgb(0 0 0 / 75%);
}

.xq-prompt-source-label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  line-height: 1.2;
  color: #6b7280;
  text-align: center;
  white-space: nowrap;
}

.xq-prompt-source-item.is-selected .xq-prompt-source-label {
  font-weight: 600;
  color: #2563eb;
}

.xq-prompt-image-main {
  display: flex;
  flex: 0.95 1 0;
  flex-direction: column;
  min-width: 320px;
  overflow: hidden;
  background: #fff;
}

.xq-prompt-bind-tip {
  flex-shrink: 0;
  margin-bottom: 10px;
}

.xq-prompt-toolbar {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.xq-prompt-toolbar-hint {
  font-size: 12px;
  color: #6b7280;
}

.xq-prompt-image-list {
  flex: 1;
  min-height: 0;
  padding-right: 4px;
  overflow-y: auto;
}

.xq-prompt-empty {
  margin-bottom: 12px;
  font-size: 13px;
  color: #9ca3af;
}

.xq-prompt-item {
  padding: 10px;
  margin-bottom: 12px;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 8px;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
}

.xq-prompt-item.is-active {
  background: #eff6ff;
  border-color: #93c5fd;
}

.xq-prompt-item-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
  color: #6b7280;
}

.xq-prompt-item-title {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.xq-prompt-type-tag {
  margin-inline-end: 0;
}

.xq-prompt-item-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.xq-prompt-bind-label {
  white-space: nowrap;
}

.xq-prompt-bind-select {
  min-width: 180px;
  max-width: 240px;
}

.xq-reject-banner {
  margin-bottom: 10px;
}

.xq-reject-tip {
  margin-bottom: 12px;
}

.xq-reject-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.xq-reject-field .req {
  color: #ef4444;
}

.xq-compare-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
  gap: 18px;
}

.xq-compare-card {
  padding: 14px 14px 16px;
  background: linear-gradient(180deg, #fff 0%, #fafbfc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 3%);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.xq-compare-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 6px 18px rgb(15 23 42 / 7%);
}

.xq-compare-head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.xq-compare-head-left {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.xq-compare-type {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.xq-compare-slot {
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.02em;
  background: #f1f5f9;
  border-radius: 999px;
}

.xq-compare-state {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 650;
  border-radius: 999px;
}

.xq-compare-state.is-ready {
  color: #15803d;
  background: #dcfce7;
}

.xq-compare-state.is-wait {
  color: #a16207;
  background: #fef9c3;
}

.xq-compare-pair {
  display: grid;
  grid-template-columns: 1fr 28px 1fr;
  gap: 10px;
  align-items: stretch;
}

.xq-compare-divider {
  display: flex;
  align-items: center;
  align-self: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-top: 36px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
}

.xq-compare-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e8eef5;
  border-radius: 14px;
}

.xq-compare-col.ai {
  background: linear-gradient(180deg, #f3fdf6 0%, #ecfdf3 100%);
  border-color: #a7f3d0;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 70%);
}

.xq-compare-cap {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #64748b;
}

.xq-compare-cap.ai-cap {
  color: #166534;
}

.xq-compare-pill {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 7px;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  background: #e2e8f0;
  border-radius: 999px;
}

.xq-compare-pill.ai {
  color: #fff;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  box-shadow: 0 1px 2px rgb(22 163 74 / 25%);
}

.xq-compare-cap-text {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  white-space: nowrap;
}

.xq-compare-thumbs {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.xq-compare-thumbs.is-multi {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.xq-compare-img {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.xq-compare-img.is-empty {
  background: #f1f5f9;
  border-style: dashed;
}

.xq-compare-img.ai-result {
  border-color: #86efac;
  box-shadow:
    0 0 0 1px rgb(34 197 94 / 10%),
    0 4px 12px rgb(22 163 74 / 8%);
}

.xq-compare-img.ai-result.is-rejected {
  border-color: #ef4444;
  box-shadow: 0 0 0 1px rgb(239 68 68 / 28%);
}

.xq-compare-reject {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  padding: 18px 8px 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 650;
  line-height: 1.35;
  color: #fff;
  white-space: nowrap;
  background: linear-gradient(180deg, transparent, rgb(185 28 28 / 94%) 36%);
}

.xq-compare-img :deep(.ant-image),
.xq-compare-img :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-compare-img span {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 12px;
  color: #94a3b8;
}

.xq-compare-acts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.xq-act-cta {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 34px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 650;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border: none;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(22 163 74 / 28%);
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    filter 0.12s ease;
}

.xq-act-cta:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgb(22 163 74 / 36%);
  filter: brightness(1.04);
  transform: translateY(-1px);
}

.xq-act-cta:active:not(:disabled) {
  transform: translateY(0);
}

.xq-act-cta:disabled {
  cursor: not-allowed;
  box-shadow: none;
  opacity: 0.45;
}

.xq-act-tools {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  gap: 4px;
  padding: 3px;
  background: rgb(255 255 255 / 72%);
  border: 1px solid #d1fae5;
  border-radius: 10px;
}

.xq-act-tool {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 8px;
  transition:
    background-color 0.12s ease,
    color 0.12s ease;
}

.xq-act-tool:hover:not(:disabled) {
  color: #0f172a;
  background: #ecfdf5;
}

.xq-act-tool:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.xq-act-tool.is-ok {
  color: #15803d;
}

.xq-act-tool.is-ok:hover:not(:disabled) {
  color: #166534;
  background: #dcfce7;
}

.xq-act-tool.is-danger {
  color: #dc2626;
}

.xq-act-tool.is-danger:hover:not(:disabled) {
  color: #b91c1c;
  background: #fef2f2;
}

.xq-act-ico {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
}

.xq-act-upload {
  display: block;
  min-width: 0;
}

.xq-act-upload :deep(.ant-upload) {
  display: block;
  width: 100%;
}

.xq-revise-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.xq-revise-tip {
  margin: 0;
  border-radius: 10px;
}

.xq-revise-scroll {
  flex: 1 1 auto;
  min-height: 0;
  max-height: min(62vh, 640px);
  padding-right: 2px;
  overflow: auto;
}

.xq-revise-layout {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

@media (max-width: 860px) {
  .xq-revise-layout {
    grid-template-columns: 1fr;
  }
}

.xq-revise-aside,
.xq-revise-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.xq-revise-panel {
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e8eef5;
  border-radius: 12px;
}

.xq-revise-section-title {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.xq-revise-badge {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #1d4ed8;
  background: #dbeafe;
  border-radius: 999px;
}

.xq-revise-sub {
  font-size: 12px;
  font-weight: 500;
  color: #94a3b8;
}

.xq-revise-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  max-height: 360px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.xq-revise-hero.is-empty {
  display: grid;
  place-items: center;
  height: 180px;
  font-size: 13px;
  color: #94a3b8;
}

.xq-revise-hero :deep(.ant-image) {
  display: block;
  width: 100%;
  max-height: 360px;
}

.xq-revise-hero :deep(.ant-image-img) {
  display: block;
  width: 100%;
  max-height: 360px;
  object-fit: contain;
  background: #fff;
}

.xq-revise-hero :deep(.ant-image-mask) {
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.xq-revise-hero:hover :deep(.ant-image-mask) {
  opacity: 1;
}

.xq-revise-current-acts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  align-items: center;
  margin-top: 10px;
}

.xq-revise-link {
  height: auto !important;
  padding-inline: 0 !important;
}

.xq-revise-strip {
  display: flex;
  gap: 10px;
  padding: 2px 2px 4px;
  overflow-x: auto;
}

.xq-revise-item {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 4px;
  width: 92px;
  padding: 0;
  cursor: pointer;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.xq-revise-item:hover {
  border-color: #93c5fd;
}

.xq-revise-item.is-selected {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgb(37 99 235 / 16%);
}

.xq-revise-thumb {
  aspect-ratio: 1;
  overflow: hidden;
  background: #f1f5f9;
  border-radius: 8px 8px 0 0;
}

.xq-revise-thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-revise-label {
  display: block;
  padding: 0 6px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  line-height: 1.3;
  color: #64748b;
  text-align: center;
  white-space: nowrap;
}

.xq-revise-kind {
  align-self: center;
  padding: 0 6px;
  margin: -2px 0 6px;
  font-size: 10px;
  font-weight: 700;
  color: #166534;
  background: #bbf7d0;
  border-radius: 999px;
}

.xq-revise-field {
  margin-bottom: 12px;
}

.xq-revise-field.is-last {
  margin-bottom: 0;
}

.xq-revise-field-label {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}

.xq-revise-field-label .req {
  color: #ef4444;
}

.xq-revise-bound-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-height: 28px;
}

.xq-revise-history-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.xq-revise-history-select {
  flex: 1 1 220px;
  min-width: 180px;
}

.xq-revise-prompt-box {
  max-height: 120px;
  padding: 10px 12px;
  margin: 0;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
  color: #334155;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.xq-revise-prompt-box.is-adjust {
  background: #fff7ed;
  border-color: #fed7aa;
}

.xq-revise-confirm-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.xq-revise-confirm-arrow {
  font-size: 20px;
  font-weight: 700;
  color: #94a3b8;
}

.xq-revise-confirm-img {
  aspect-ratio: 1;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.xq-revise-confirm-img.is-preview {
  border-color: #86efac;
  box-shadow: 0 0 0 1px rgb(34 197 94 / 12%);
}

.xq-revise-confirm-img :deep(.ant-image),
.xq-revise-confirm-img :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-revise-confirm-img span {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.xq-revise-footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px 0 14px;
  margin: 0 -4px;
  background: linear-gradient(180deg, rgb(255 255 255 / 88%), #fff 40%);
  border-top: 1px solid #eef2f7;
}

:global(.xq-revise-modal .ant-modal-content) {
  overflow: hidden;
  border-radius: 14px;
}

:global(.xq-revise-modal .ant-modal-header) {
  margin-bottom: 0;
  border-bottom: 1px solid #eef2f7;
}

:global(.xq-revise-modal .ant-modal-body) {
  padding-bottom: 0;
}

.xq-revise-job-empty {
  padding: 24px 0;
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
}

.xq-revise-job {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 10px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 10px;
}

.xq-revise-job.is-success {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.xq-revise-job.is-fail {
  background: #fef2f2;
  border-color: #fecaca;
}

.xq-revise-job-title {
  font-size: 14px;
  font-weight: 700;
  color: #9a3412;
}

.xq-revise-job.is-success .xq-revise-job-title {
  color: #166534;
}

.xq-revise-job.is-fail .xq-revise-job-title {
  color: #b91c1c;
}

.xq-revise-job-meta,
.xq-revise-job-msg {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #78716c;
  word-break: break-all;
}

.xq-revise-job-acts {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 6px;
}

.xq-revise-dock {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 40;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 650;
  color: #9a3412;
  cursor: pointer;
  background: #fff;
  border: 1px solid #fed7aa;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgb(15 23 42 / 12%);
}

@media (max-width: 1100px) {
  .xq-compare-grid {
    grid-template-columns: 1fr;
  }

  .xq-compare-pair {
    grid-template-columns: 1fr;
  }

  .xq-compare-divider {
    width: 28px;
    height: 28px;
    margin: 4px auto;
    transform: rotate(90deg);
  }
}
</style>
