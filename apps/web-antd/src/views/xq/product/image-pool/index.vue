<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';
import type { XqWorkOrderApi } from '#/api/xq/work-order';
import type { ImageSlot } from '#/views/xq/product/image-slot-rule';

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
  Pagination,
  Select,
  Spin,
  Tag,
  Upload,
} from 'ant-design-vue';

import { uploadFile } from '#/api/infra/file';
import { getSimpleUserList } from '#/api/system/user';
import { getXqImageRule } from '#/api/xq/listing';
import {
  generateXqWorkOrderImage,
  getXqWorkOrderPage,
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
}

const STATUS_OPTS: Array<{ color: string; label: string; value: ImageStatus }> =
  [
    { value: 'pending', label: '待执行', color: 'processing' },
    { value: 'todo', label: '未完成', color: 'default' },
    { value: 'running', label: '执行中', color: 'processing' },
    { value: 'generated', label: '已出图', color: 'cyan' },
    { value: 'rejected', label: '已驳回', color: 'error' },
    { value: 'revised', label: '已修改', color: 'warning' },
    { value: 'done', label: '已完成', color: 'success' },
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
const keyword = ref('');
const statusFilter = ref<'' | ImageStatus>('');
const filterImageUserId = ref<number | undefined>();
const users = ref<SystemUserApi.User[]>([]);
const tasks = ref<XqWorkOrderApi.WorkOrder[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const selectedMap = ref<Record<number, XqWorkOrderApi.WorkOrder>>({});
const activeId = ref<number | undefined>();
const uploading = ref<null | number>(null);
const queryParams = reactive({ keyword: '' as string | undefined });
const promptDraft = ref<ImagePromptItem[]>([]);
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

/** 左侧扁平：主体 + 已分美工的变体都单独成行 */
const displayTasks = computed(() => {
  const uid = myUserId.value;
  const out: XqWorkOrderApi.WorkOrder[] = [];
  const seen = new Set<number>();
  const push = (m?: null | XqWorkOrderApi.WorkOrder) => {
    if (!m?.id || seen.has(m.id)) return;
    // 图片池：只展示已分给当前美工（或筛选美工）的 SKU；无 imageUserId 的不进列表
    const filterUid = filterImageUserId.value || uid;
    if (filterUid && m.imageUserId && m.imageUserId !== filterUid) return;
    if (!m.imageUserId) return;
    seen.add(m.id);
    out.push(m);
  };
  for (const row of tasks.value) {
    const kids = row.variants || [];
    if (kids.length === 0) {
      push(row);
      continue;
    }
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
    const sellableParent = !(childOffer && !parentOffer);
    if (sellableParent) push(row);
    for (const k of kids) push(k);
  }
  return out;
});

const activeTask = computed(() => findTask(activeId.value));
const isArtist = computed(
  () =>
    Boolean(myUserId.value) && activeTask.value?.imageUserId === myUserId.value,
);
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
  for (const t of tasks.value) {
    if (t.id === id) return t;
    const child = t.variants?.find((v) => v.id === id);
    if (child) return child;
  }
  return null;
}

function coverOf(row: XqWorkOrderApi.WorkOrder) {
  const p = parsePrompts(row).find((x) => aiUrlOf(x));
  return aiUrlOf(p || {}) || row.generatedImageUrl || row.coverUrl || undefined;
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
  const parsed = parsePrompts(row);
  const raw =
    parsed.length > 0
      ? parsed
      : src.map((url, i) => ({
          index: i,
          imageType: i === 0 ? 'main' : 'detail',
          imageUrl: url,
          promptText: '',
          bindIndexes: [i],
        }));
  promptDraft.value = shapePromptsToSlots(raw, imageSlots.value, src);
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

function bindOriginal(promptIndex: number, srcIndex: number) {
  const p = promptDraft.value[promptIndex];
  if (!p) return;
  const cur = new Set(p.bindIndexes || []);
  if (cur.has(srcIndex)) cur.delete(srcIndex);
  else cur.add(srcIndex);
  p.bindIndexes = [...cur];
  p.imageUrl = sourceImages.value[srcIndex] || p.imageUrl;
}

function boundLabel(p: ImagePromptItem) {
  const idx = p.bindIndexes || [];
  if (idx.length === 0) return '未绑定';
  return idx.map((n) => `Giga 原图 ${n + 1}`).join('、');
}

/** 提示词左侧：展示全部已绑原图缩略图，不只一张 */
function boundThumbUrls(p: ImagePromptItem, fallbackIndex = 0) {
  const src = sourceImages.value;
  const idx = (p.bindIndexes || []).filter(
    (n) => Number.isFinite(n) && n >= 0 && n < src.length,
  );
  if (idx.length > 0) {
    return idx.map((n) => src[n]!).filter(Boolean);
  }
  const one = src[fallbackIndex] || p.imageUrl;
  return one ? [String(one)] : [];
}

async function loadUsers() {
  users.value = (await getSimpleUserList()) || [];
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
      listingPlatformId: lockedPlatformId.value || undefined,
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
    message.success('已出图（AI 执行完成）');
    await loadTasks();
  } catch (error: any) {
    message.error(error?.message || '出图失败');
  } finally {
    running.value = false;
  }
}

async function patchPromptAi(
  index: number,
  url: string,
  extras: Partial<ImagePromptItem> = {},
) {
  const row = activeTask.value;
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

async function replaceWithOriginal(index: number) {
  const pair = comparePairs.value[index];
  if (!pair?.original) {
    message.warning('没有可替换的原图');
    return;
  }
  await patchPromptAi(index, pair.original);
  message.success('已用原图替换 AI 图');
  await loadTasks();
}

async function setStatus(status: ImageStatus) {
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

onMounted(async () => {
  await loadUsers();
  await loadTasks();
});

watch(lockedPlatformId, () => {
  handleSearch();
});
</script>

<template>
  <Page auto-content-height>
    <div class="xq-copy-pool">
      <div class="xq-toolbar">
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
          placeholder="按美工人员筛选"
          style="width: 220px"
          :options="userOptions"
          @change="handleSearch"
        />
        <div class="xq-status-tabs">
          <Button
            size="small"
            :type="statusFilter === '' ? 'primary' : 'default'"
            @click="
              statusFilter = '';
              handleSearch();
            "
          >
            全部
          </Button>
          <Button
            v-for="s in STATUS_OPTS"
            :key="s.value"
            size="small"
            :type="statusFilter === s.value ? 'primary' : 'default'"
            @click="
              statusFilter = s.value;
              handleSearch();
            "
          >
            {{ s.label }}
          </Button>
        </div>
      </div>

      <Spin :spinning="loading">
        <div v-if="displayTasks.length" class="xq-split">
          <aside class="xq-list">
            <div
              v-for="row in displayTasks"
              :key="row.id"
              class="xq-list-group"
            >
              <div
                class="xq-list-item"
                :class="{
                  active: activeId === row.id,
                  checked: isChecked(row),
                }"
                role="button"
                tabindex="0"
                @click="selectTask(row)"
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
                    <span class="xq-list-sku">{{
                      row.externalSku || '—'
                    }}</span>
                    <Tag :color="statusMeta(row).color">
                      {{ statusMeta(row).label }}
                    </Tag>
                  </div>
                  <div class="xq-list-title" :title="row.title">
                    {{ row.title || row.contentTitle || '未命名' }}
                  </div>
                  <div class="xq-list-meta">
                    {{ artistName(row) }} · {{ row.no }}
                  </div>
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
                <Tag
                  class="xq-detail-badge"
                  :color="statusMeta(activeTask).color"
                >
                  {{ statusMeta(activeTask).label }}
                </Tag>
              </div>
              <div>
                <div class="xq-info-row">
                  <span class="xq-label">Item Code</span>
                  <b>{{ activeTask.externalSku || '—' }}</b>
                </div>
                <div class="xq-info-row">
                  <span class="xq-label">标题</span>
                  <span class="xq-info-text">{{
                    activeTask.contentTitle || activeTask.title || '—'
                  }}</span>
                </div>
                <div class="xq-info-row">
                  <span class="xq-label">美工</span>
                  <span class="xq-info-text">{{ artistName(activeTask) }}</span>
                </div>
                <div class="xq-detail-actions">
                  <Button
                    v-if="canEdit && showPrompts"
                    type="primary"
                    :loading="running"
                    @click="runGenerate"
                  >
                    执行出图
                  </Button>
                  <Button
                    v-if="canEdit && showPrompts"
                    :loading="saving"
                    @click="savePrompts"
                  >
                    保存提示词
                  </Button>
                  <Button
                    v-if="isAssigner && showCompare"
                    danger
                    :loading="saving"
                    @click="setStatus('rejected')"
                  >
                    驳回 / 不合格
                  </Button>
                  <Button
                    v-if="canEdit && currentStatus === 'rejected'"
                    :loading="saving"
                    @click="setStatus('revised')"
                  >
                    标记已修改
                  </Button>
                  <Button
                    v-if="canEdit && showCompare"
                    type="primary"
                    :loading="saving"
                    @click="setStatus('done')"
                  >
                    完成
                  </Button>
                </div>
              </div>
            </div>

            <div class="xq-edit-block xq-highlight-block">
              <label class="xq-field-label">
                突出风格
                <span class="xq-muted">（可选标签，勾选后给生图用，不要写成句子）</span>
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

            <!-- 待执行：图片提示词 -->
            <div v-if="showPrompts" class="xq-prompt-work">
              <div class="xq-edit-block">
                <div class="xq-prompt-toolbar">
                  <label class="xq-field-label">
                    图片提示词
                    <span class="xq-muted">
                      按平台规则 {{ promptDraft.length }} 槽 ·
                      {{ slotSummary }}
                    </span>
                  </label>
                </div>
                <div v-if="promptDraft.length" class="xq-prompt-list">
                  <div
                    v-for="(p, i) in promptDraft"
                    :key="`slot-${i}-${p.imageType}`"
                    class="xq-prompt-card"
                  >
                    <div class="xq-prompt-thumb">
                      <div
                        v-if="boundThumbUrls(p, i).length"
                        class="xq-prompt-thumb-grid"
                      >
                        <Image
                          v-for="(url, ui) in boundThumbUrls(p, i)"
                          :key="`pt-${i}-${ui}`"
                          :src="url"
                          :preview="true"
                        />
                      </div>
                      <span v-else class="xq-muted">未绑原图</span>
                    </div>
                    <div class="xq-prompt-body">
                      <div class="xq-prompt-head">
                        <Tag color="blue">
                          {{
                            imageSlots[i]?.label ||
                            imageTypeLabel(p.imageType, i)
                          }}
                        </Tag>
                        <span class="xq-muted">槽位 {{ i + 1 }} · 绑定 {{ boundLabel(p) }}</span>
                      </div>
                      <div v-if="sourceImages.length" class="xq-bind-thumbs">
                        <button
                          v-for="(url, si) in sourceImages"
                          :key="`b-${i}-${si}`"
                          type="button"
                          class="xq-bind-thumb"
                          :class="{
                            active: (p.bindIndexes || []).includes(si),
                          }"
                          @click="bindOriginal(i, si)"
                        >
                          <Image :src="url" :preview="false" />
                          <span>{{ si === 0 ? '主图' : si + 1 }}</span>
                        </button>
                      </div>
                      <p v-else class="xq-muted">没有原图可绑定</p>
                      <Input.TextArea
                        v-model:value="p.promptText"
                        :rows="4"
                        :placeholder="`${imageSlots[i]?.label || imageTypeLabel(p.imageType, i)}提示词`"
                      />
                    </div>
                  </div>
                </div>
                <Empty
                  v-else
                  description="暂无出图规则或提示词，请先在「图片管理」配置平台规则"
                />
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
                  <b>{{ pair.label }}</b>
                  <span class="xq-muted">p{{ String(pair.index + 1).padStart(2, '0') }}</span>
                </div>
                <div class="xq-compare-pair">
                  <div class="xq-compare-col">
                    <div class="xq-compare-cap">Giga 原图（本地同步）</div>
                    <div
                      v-if="pair.originals?.length"
                      class="xq-compare-thumbs"
                    >
                      <div
                        v-for="(url, oi) in pair.originals"
                        :key="`co-${pair.index}-${oi}`"
                        class="xq-compare-img"
                      >
                        <Image :src="url" :preview="true" />
                      </div>
                    </div>
                    <div v-else class="xq-compare-img">
                      <span>无原图</span>
                    </div>
                  </div>
                  <div class="xq-compare-col ai">
                    <div class="xq-compare-cap ai-cap">
                      AI 生成
                      <span v-if="pair.ai">已出图</span>
                    </div>
                    <div class="xq-compare-img">
                      <Image v-if="pair.ai" :src="pair.ai" :preview="true" />
                      <span v-else>待出图</span>
                    </div>
                    <div class="xq-compare-acts">
                      <Upload
                        :show-upload-list="false"
                        accept="image/*"
                        :disabled="uploading === pair.index"
                        :before-upload="
                          (file) => onUploadAi(pair.index, file as File)
                        "
                      >
                        <Button
                          size="small"
                          :loading="uploading === pair.index"
                        >
                          单图修改
                        </Button>
                      </Upload>
                      <Button
                        size="small"
                        @click="replaceWithOriginal(pair.index)"
                      >
                        原图替换
                      </Button>
                      <Button
                        v-if="isAssigner"
                        size="small"
                        danger
                        @click="setStatus('rejected')"
                      >
                        标记不合格
                      </Button>
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
    </div>
  </Page>
</template>

<style scoped src="../_pool.css"></style>
<style scoped>
.xq-muted {
  font-size: 12px;
  font-weight: 400;
  color: #9ca3af;
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

.xq-prompt-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.xq-src-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.xq-src-thumb {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 88px;
  padding: 0;
  cursor: pointer;
  background: none;
  border: 0;
}

.xq-src-thumb :deep(.ant-image),
.xq-src-thumb :deep(img) {
  width: 88px;
  height: 88px;
  object-fit: cover;
  border-radius: 8px;
}

.xq-src-thumb span {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
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
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #eee;
  border-radius: 10px;
}

.xq-prompt-thumb {
  min-height: 108px;
  overflow: hidden;
  background: #e5e7eb;
  border-radius: 8px;
}

.xq-prompt-thumb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 4px;
  padding: 4px;
}

.xq-prompt-thumb-grid :deep(.ant-image),
.xq-prompt-thumb-grid :deep(img) {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
}

.xq-prompt-thumb :deep(.ant-image),
.xq-prompt-thumb :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.xq-prompt-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.xq-bind-thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 200px;
  padding: 4px;
  margin-bottom: 8px;
  overflow: auto;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
}

.xq-bind-thumb {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 56px;
  padding: 0;
  cursor: pointer;
  background: none;
  border: 2px solid transparent;
  border-radius: 8px;
}

.xq-bind-thumb.active {
  border-color: #2563eb;
}

.xq-bind-thumb :deep(.ant-image),
.xq-bind-thumb :deep(img) {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 6px;
}

.xq-bind-thumb span {
  font-size: 11px;
  line-height: 1.2;
  color: #6b7280;
  text-align: center;
}

.xq-bind-thumb.active span {
  font-weight: 600;
  color: #2563eb;
}

.xq-compare-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 14px;
}

.xq-compare-card {
  padding: 10px 12px 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.xq-compare-head {
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.xq-compare-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.xq-compare-cap {
  margin-bottom: 6px;
  font-size: 12px;
  color: #6b7280;
}

.xq-compare-cap.ai-cap {
  color: #16a34a;
}

.xq-compare-thumbs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 6px;
}

.xq-compare-img {
  aspect-ratio: 1;
  overflow: hidden;
  background: #f3f4f6;
  border: 1px solid #eee;
  border-radius: 10px;
}

.xq-compare-col.ai .xq-compare-img {
  border-color: #86efac;
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
  color: #9ca3af;
}

.xq-compare-acts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
</style>
