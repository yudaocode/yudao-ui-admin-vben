<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';
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
  Pagination,
  Select,
  Spin,
  Tag,
  Upload,
} from 'ant-design-vue';

import { uploadFile } from '#/api/infra/file';
import { getSimpleUserList } from '#/api/system/user';
import {
  generateXqWorkOrderImage,
  getXqWorkOrderPage,
  updateXqWorkOrder,
  updateXqWorkOrderImageStatus,
} from '#/api/xq/work-order';
import { useDeskPlatformId } from '#/views/xq/desk/use-desk-scope';

defineOptions({ name: 'XqImagePool' });

type ImageStatus =
  | 'done'
  | 'generated'
  | 'pending'
  | 'rejected'
  | 'revised'
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
    { value: 'generated', label: '已出图', color: 'cyan' },
    { value: 'todo', label: '未完成', color: 'default' },
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
  const prompts = parsePrompts(row);
  const n = Math.max(src.length, prompts.length, 1);
  const pairs = [];
  for (let i = 0; i < n; i++) {
    const p = prompts[i];
    pairs.push({
      index: i,
      original: src[p?.bindIndexes?.[0] ?? i] || src[i] || src[0] || '',
      ai: aiUrlOf(p || {}) || (i === 0 ? row?.generatedImageUrl || '' : ''),
      label: imageTypeLabel(p?.imageType, i),
      prompt: p,
    });
  }
  return pairs;
});

function imageTypeLabel(type?: string, i = 0) {
  const t = String(type || '').toLowerCase();
  if (t.includes('main') || i === 0) return '主图';
  if (t.includes('size') || t.includes('dim')) return '尺寸图';
  if (t.includes('detail')) return '细节图';
  if (t.includes('scene')) return '场景图';
  return `附图 ${i}`;
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

function hydratePrompts(row: XqWorkOrderApi.WorkOrder) {
  const src = sourceImagesOf(row);
  const parsed = parsePrompts(row);
  if (parsed.length > 0) {
    promptDraft.value = parsed.map((p, i) => {
      let bindIndexes = p.bindIndexes;
      if (!bindIndexes?.length) {
        if (src[i]) bindIndexes = [i];
        else if (src[0]) bindIndexes = [0];
        else bindIndexes = [];
      }
      return {
        ...p,
        index: p.index ?? i,
        bindIndexes,
      };
    });
    return;
  }
  promptDraft.value = src.map((url, i) => ({
    index: i,
    imageType: i === 0 ? 'main' : 'detail',
    imageUrl: url,
    promptText: '',
    bindIndexes: [i],
  }));
}

function selectTask(row: XqWorkOrderApi.WorkOrder) {
  activeId.value = row.id;
  hydratePrompts(row);
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

function addPrompt() {
  promptDraft.value.push({
    index: promptDraft.value.length,
    imageType: 'detail',
    promptText: '',
    bindIndexes: sourceImages.value[0] ? [0] : [],
    imageUrl: sourceImages.value[0],
  });
}

function removePrompt(i: number) {
  promptDraft.value.splice(i, 1);
}

function boundLabel(p: ImagePromptItem) {
  const idx = p.bindIndexes || [];
  if (idx.length === 0) return '未绑定';
  return idx.map((n) => `Giga 原图 ${n + 1}`).join('、');
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
    }
    if (!activeId.value && tasks.value[0]?.id) {
      selectTask(tasks.value[0]!);
    } else if (activeId.value) {
      const row = findTask(activeId.value);
      if (row) hydratePrompts(row);
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
    });
    if (row.imageStatus === 'todo' || !row.imageStatus) {
      await updateXqWorkOrderImageStatus({
        id: row.id,
        imageStatus: 'pending',
      });
    }
    message.success('提示词已保存');
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
          <h2>{{ lockedPlatformId ? '图片' : '我的图片' }}</h2>
          <p>
            {{
              lockedPlatformId
                ? '本平台图片任务：待执行看提示词，出图后原图对照。'
                : '待执行看提示词；AI 出图后原图对照。分配人与美工都能看。'
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
        <div v-if="tasks.length" class="xq-split">
          <aside class="xq-list">
            <div v-for="row in tasks" :key="row.id" class="xq-list-group">
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

            <!-- 待执行：图片提示词 -->
            <div v-if="showPrompts" class="xq-prompt-work">
              <div class="xq-edit-block">
                <label class="xq-field-label">
                  Giga 原图
                  <span class="xq-muted">先点右侧提示词，再点原图绑定</span>
                </label>
                <div v-if="sourceImages.length" class="xq-src-row">
                  <button
                    v-for="(url, i) in sourceImages"
                    :key="`src-${i}`"
                    class="xq-src-thumb"
                    type="button"
                    @click="
                      promptDraft.length &&
                      bindOriginal(Math.max(0, promptDraft.length - 1), i)
                    "
                  >
                    <Image :src="url" :preview="false" />
                    <span>{{ i === 0 ? '主图' : i + 1 }}</span>
                  </button>
                </div>
                <Empty v-else description="没有原图" />
              </div>

              <div class="xq-edit-block">
                <div class="xq-prompt-toolbar">
                  <label class="xq-field-label">
                    图片提示词
                    <span class="xq-muted">{{ promptDraft.length }} 条</span>
                  </label>
                  <Button size="small" @click="addPrompt">新增一条</Button>
                </div>
                <div v-if="promptDraft.length" class="xq-prompt-list">
                  <div
                    v-for="(p, i) in promptDraft"
                    :key="`p-${i}`"
                    class="xq-prompt-card"
                  >
                    <div class="xq-prompt-thumb">
                      <Image
                        v-if="
                          sourceImages[p.bindIndexes?.[0] ?? i] || p.imageUrl
                        "
                        :src="
                          sourceImages[p.bindIndexes?.[0] ?? i] || p.imageUrl
                        "
                        :preview="true"
                      />
                      <span v-else class="xq-muted">未绑原图</span>
                    </div>
                    <div class="xq-prompt-body">
                      <div class="xq-prompt-head">
                        <Tag>{{ imageTypeLabel(p.imageType, i) }}</Tag>
                        <span class="xq-muted">绑定 {{ boundLabel(p) }}</span>
                        <Button
                          size="small"
                          type="link"
                          danger
                          @click="removePrompt(i)"
                        >
                          删除
                        </Button>
                      </div>
                      <div class="xq-bind-row">
                        <Button
                          v-for="(_, si) in sourceImages"
                          :key="`b-${i}-${si}`"
                          size="small"
                          :type="
                            (p.bindIndexes || []).includes(si)
                              ? 'primary'
                              : 'default'
                          "
                          @click="bindOriginal(i, si)"
                        >
                          原图 {{ si + 1 }}
                        </Button>
                      </div>
                      <Input.TextArea
                        v-model:value="p.promptText"
                        :rows="4"
                        placeholder="图片提示词"
                      />
                    </div>
                  </div>
                </div>
                <Empty
                  v-else
                  description="暂无提示词，可新增或先在文案侧生成"
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
                    <div class="xq-compare-img">
                      <Image
                        v-if="pair.original"
                        :src="pair.original"
                        :preview="true"
                      />
                      <span v-else>无原图</span>
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

.xq-prompt-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.xq-bind-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
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
