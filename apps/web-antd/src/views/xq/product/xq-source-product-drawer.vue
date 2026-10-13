<script lang="ts" setup>
import type { XqProductApi } from '#/api/xq/product';
import type { XqWorkOrderApi } from '#/api/xq/work-order';

import { computed, nextTick, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Alert, Drawer, Empty, Image, Spin, Tag } from 'ant-design-vue';

import { getXqProduct } from '#/api/xq/product';

defineOptions({ name: 'XqSourceProductDrawer' });

const props = defineProps<{
  family?: XqWorkOrderApi.WorkOrder[];
  open: boolean;
  task?: null | XqWorkOrderApi.WorkOrder;
}>();

const emit = defineEmits<{
  selectMember: [XqWorkOrderApi.WorkOrder];
  'update:open': [boolean];
}>();

const loading = ref(false);
const product = ref<null | XqProductApi.Product>(null);
const galleryIndex = ref(0);
const galleryStripRef = ref<HTMLElement | null>(null);
const sourceHtmlOpen = ref(false);

const titleSku = computed(
  () =>
    String(props.task?.externalSku || props.task?.productSku || '').trim() ||
    '原内容',
);

const familyMembers = computed(() => {
  const list = props.family || [];
  if (list.length > 0) return list;
  return props.task ? [props.task] : [];
});

function collectWorkImages(row?: null | XqWorkOrderApi.WorkOrder) {
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

const gallery = computed(() => {
  const p = product.value;
  if (p) {
    const urls = [...(p.imageUrls || [])];
    if (p.imageUrl && !urls.includes(p.imageUrl)) urls.unshift(p.imageUrl);
    if (urls.length > 0) return urls;
  }
  return collectWorkImages(props.task);
});

const mainImage = computed(
  () => gallery.value[galleryIndex.value] || gallery.value[0] || '',
);

function selectGallery(idx: number) {
  const total = gallery.value.length;
  if (total <= 0) return;
  galleryIndex.value = ((idx % total) + total) % total;
}

function shiftGallery(delta: number) {
  selectGallery(galleryIndex.value + delta);
}

async function scrollGalleryThumbIntoView() {
  await nextTick();
  const strip = galleryStripRef.value;
  if (!strip) return;
  const active = strip.querySelector(
    '.xq-shop-thumb.active',
  ) as HTMLElement | null;
  active?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center',
  });
}

watch(galleryIndex, () => {
  void scrollGalleryThumbIntoView();
});

const displayTitle = computed(
  () =>
    String(product.value?.name || props.task?.title || '').trim() ||
    titleSku.value,
);

function formatMoney(value?: null | number) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }
  const n = Number(value);
  if (n <= 0) return null;
  return n.toFixed(2);
}

const priceText = computed(() => {
  const p = product.value;
  const fromProduct =
    formatMoney(p?.discountedPrice) || formatMoney(p?.price) || null;
  if (fromProduct) return fromProduct;
  return formatMoney(props.task?.price);
});

const listPriceText = computed(() => {
  const p = product.value;
  if (!p) return null;
  const list = formatMoney(p.price);
  const sale = formatMoney(p.discountedPrice);
  return list && sale && list !== sale ? list : null;
});

const itemCodeText = computed(
  () =>
    String(
      product.value?.itemCode ||
        props.task?.itemCode ||
        props.task?.externalSku ||
        '',
    ).trim() || '—',
);

const qtyText = computed(() => {
  const q = product.value?.qtyAvailable ?? props.task?.qtyAvailable;
  return q === null || q === undefined ? '—' : String(q);
});

const platformTags = computed(() => {
  const tags: string[] = [];
  const name = String(props.task?.listingPlatformName || '').trim();
  if (name) tags.push(name);
  for (const p of product.value?.pickedPlatforms || []) {
    const n = String(p.name || p.id || '').trim();
    if (n && !tags.includes(n)) tags.push(n);
  }
  return tags;
});

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

const specRows = computed(() => {
  const rows: Array<{ label: string; value: string }> = [];
  const push = (label: string, value?: null | number | string) => {
    const text = formatSpecValue(value);
    if (text) rows.push({ label, value: text });
  };
  const p = product.value;
  const t = props.task;
  push('SKU', p?.sku || t?.externalSku || t?.productSku);
  push('Item Code', p?.itemCode || t?.itemCode);
  push('UPC', p?.upc || t?.upc);
  push('品牌', p?.brandName);
  push('类目', p?.categoryName || t?.categoryName);
  push('颜色', p?.mainColor || t?.mainColor || t?.variantLabel);
  push('材质', p?.mainMaterial);
  push('产地', p?.placeOfOrigin);
  if (p) {
    push(
      '包装尺寸（in）',
      formatDim(p.lengthIn, p.widthIn, p.heightIn, p.lengthUnit || 'in'),
    );
    push('包装尺寸（cm）', formatDim(p.lengthCm, p.widthCm, p.heightCm, 'cm'));
    push('重量', formatWeight(p.weight, p.weightUnit, p.weightKg));
    push(
      '组装尺寸',
      formatDim(
        p.assembledLength,
        p.assembledWidth,
        p.assembledHeight,
        p.assembledLengthUnit || 'in',
      ),
    );
    push(
      '组装重量',
      p.assembledWeight
        ? `${formatSpecValue(p.assembledWeight)} ${p.assembledWeightUnit || ''}`.trim()
        : '',
    );
    for (const [label, value] of parseAttributes(p.attributesJson)) {
      if (rows.some((r) => r.label === label || r.value === value)) continue;
      push(label, value);
    }
    if (
      p.characteristics &&
      p.characteristics !== p.description &&
      !p.characteristics.includes('<')
    ) {
      push('特点', p.characteristics);
    }
  } else if (t) {
    push('包装尺寸（cm）', formatDim(t.lengthCm, t.widthCm, t.heightCm, 'cm'));
    push('库存', t.qtyAvailable);
  }
  return rows;
});

const sourceDescription = computed(() => {
  const own = String(props.task?.sourceDescription || '').trim();
  if (own) return own;
  // 变体自身无原文案时，回退同品其它成员 / 主体
  for (const m of props.family || []) {
    if (m?.id && m.id === props.task?.id) continue;
    const d = String(m?.sourceDescription || '').trim();
    if (d) return d;
  }
  return String(product.value?.description || '').trim();
});

function extractPlainFromHtml(html: string) {
  return String(html)
    .replaceAll(/<script[\s\S]*?<\/script>/gi, '')
    .replaceAll(/<style[\s\S]*?<\/style>/gi, '')
    .replaceAll(/<br\s*\/?>/gi, '\n')
    .replaceAll(/<\/(?:p|div|li|tr|h[1-6])>/gi, '\n')
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll(/&nbsp;/gi, ' ')
    .replaceAll(/&amp;/gi, '&')
    .replaceAll(/&lt;/gi, '<')
    .replaceAll(/&gt;/gi, '>')
    .replaceAll(/&quot;/gi, '"')
    .replaceAll(/&#39;/gi, "'")
    .replaceAll(/[ \t]+\n/g, '\n')
    .replaceAll(/\n{3,}/g, '\n\n')
    .replaceAll(/[ \t]{2,}/g, ' ')
    .trim();
}

const sourceIsHtml = computed(
  () =>
    /<\/?[a-z][\s\S]*>/i.test(sourceDescription.value) &&
    !sourceDescription.value.startsWith('['),
);

const sourcePlainText = computed(() => {
  const raw = sourceDescription.value;
  if (!raw) return '';
  return sourceIsHtml.value ? extractPlainFromHtml(raw) : raw;
});

const sourceImageOnly = computed(
  () =>
    sourceIsHtml.value &&
    !sourcePlainText.value &&
    /<img\b/i.test(sourceDescription.value),
);

const sourcePlainParagraphs = computed(() => {
  const text = sourcePlainText.value.trim();
  if (!text) return [] as Array<{ heading: boolean; text: string }>;
  return text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const short = line.length <= 48;
      const endsSoft = !/[.!?。；;:：]$/.test(line);
      const titleLike =
        /^(Details|Material|Weight Capacity|Ample Storage|Rigorous Retro|Dimensions?|Features?|Description|Specifications?)\b/i.test(
          line,
        ) ||
        (short &&
          endsSoft &&
          /^[A-Z][\w\s,&/'-]+$/.test(line) &&
          !/\b(the|and|with|for|from|this|that)\b/i.test(line));
      return { text: line, heading: Boolean(titleLike) };
    });
});

function chipLabel(row: XqWorkOrderApi.WorkOrder) {
  const color = String(row.mainColor || row.variantLabel || '').trim();
  if (color && color.toLowerCase() !== 'null') return color;
  return String(row.externalSku || row.productSku || row.id || '').trim();
}

function chipImage(row: XqWorkOrderApi.WorkOrder) {
  return collectWorkImages(row)[0] || row.coverUrl || '';
}

async function loadProduct() {
  const id = props.task?.productId;
  galleryIndex.value = 0;
  sourceHtmlOpen.value = false;
  if (!id) {
    product.value = null;
    return;
  }
  loading.value = true;
  try {
    product.value = await getXqProduct(String(id));
  } catch {
    product.value = null;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.task?.id, props.task?.productId] as const,
  ([open]) => {
    if (open) void loadProduct();
  },
  { immediate: true },
);

watch(
  () => gallery.value.length,
  (n) => {
    if (galleryIndex.value >= n) galleryIndex.value = 0;
  },
);

function onOpenChange(v: boolean) {
  emit('update:open', v);
}

function selectMember(row: XqWorkOrderApi.WorkOrder) {
  if (!row?.id || row.id === props.task?.id) return;
  emit('selectMember', row);
}
</script>

<template>
  <Drawer
    :open="open"
    placement="right"
    width="50%"
    :title="`原内容 · ${titleSku}`"
    :destroy-on-close="false"
    root-class-name="xq-source-product-drawer"
    @update:open="onOpenChange"
  >
    <Spin :spinning="loading">
      <div v-if="task" class="xq-shop">
        <div class="xq-shop-media">
          <div class="xq-shop-stage">
            <button
              v-if="gallery.length > 1"
              type="button"
              class="xq-shop-nav prev"
              aria-label="上一张"
              @click="shiftGallery(-1)"
            >
              <IconifyIcon icon="lucide:chevron-left" />
            </button>
            <div class="xq-shop-main">
              <Image v-if="mainImage" :src="mainImage" :preview="true" />
              <Empty v-else description="暂无原图" :image-size="48" />
            </div>
            <button
              v-if="gallery.length > 1"
              type="button"
              class="xq-shop-nav next"
              aria-label="下一张"
              @click="shiftGallery(1)"
            >
              <IconifyIcon icon="lucide:chevron-right" />
            </button>
            <div v-if="gallery.length > 1" class="xq-shop-dots">
              <button
                v-for="(_, idx) in gallery"
                :key="`dot-${idx}`"
                type="button"
                class="xq-shop-dot"
                :class="{ active: galleryIndex === idx }"
                @click="selectGallery(idx)"
              ></button>
            </div>
            <div v-if="gallery.length > 1" class="xq-shop-counter">
              {{ galleryIndex + 1 }} / {{ gallery.length }}
            </div>
          </div>
          <div
            v-if="gallery.length"
            ref="galleryStripRef"
            class="xq-shop-strip"
          >
            <button
              v-for="(url, idx) in gallery"
              :key="`g-${idx}`"
              type="button"
              class="xq-shop-thumb"
              :class="{ active: galleryIndex === idx }"
              @click="selectGallery(idx)"
            >
              <img :src="url" alt="" />
            </button>
          </div>
        </div>

        <div class="xq-shop-buy">
          <h3 class="xq-shop-title">{{ displayTitle }}</h3>
          <div class="xq-shop-price">
            <strong v-if="priceText">${{ priceText }}</strong>
            <strong v-else>—</strong>
            <s v-if="listPriceText">${{ listPriceText }}</s>
            <span
              v-if="formatMoney(product?.exclusivePrice)"
              class="xq-exclusive"
            >
              专享 ${{ formatMoney(product?.exclusivePrice) }}
            </span>
          </div>
          <div class="xq-shop-meta">
            <span>Item Code {{ itemCodeText }}</span>
            <span>库存 {{ qtyText }}</span>
          </div>
          <div v-if="platformTags.length" class="xq-picked-row">
            <span class="xq-spec-label">已选平台</span>
            <Tag v-for="p in platformTags" :key="p" color="blue">{{ p }}</Tag>
          </div>
          <div v-if="familyMembers.length > 1" class="xq-shop-spec">
            <div class="xq-spec-label">同品 SKU</div>
            <p class="xq-spec-hint">
              独立货号，各有自己的图/价/库存（非一条详情里的变体字段）
            </p>
            <div class="xq-spec-list">
              <button
                v-for="m in familyMembers"
                :key="m.id || m.externalSku"
                type="button"
                class="xq-spec-item"
                :class="{ active: m.id === task.id }"
                :title="`${m.externalSku || ''} ${m.title || ''}`"
                @click="selectMember(m)"
              >
                <img v-if="chipImage(m)" :src="chipImage(m)" alt="" />
                <span>{{ chipLabel(m) }}</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="specRows.length" class="xq-shop-copy">
          <div class="xq-copy-title">规格参数</div>
          <dl class="xq-spec-table">
            <template v-for="row in specRows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </template>
          </dl>
        </div>

        <div class="xq-shop-copy">
          <div class="xq-copy-title">产品详情</div>
          <template v-if="sourceDescription">
            <Alert
              v-if="sourceImageOnly"
              type="info"
              show-icon
              class="xq-source-tip"
              message="原文案为图文排版，无可复制纯文字（文字多半印在营销图上）。"
            />
            <div v-if="sourcePlainParagraphs.length" class="xq-source-article">
              <p
                v-for="(p, idx) in sourcePlainParagraphs"
                :key="`plain-${idx}`"
                :class="{ 'is-heading': p.heading }"
              >
                {{ p.text }}
              </p>
            </div>
            <button
              v-if="sourceIsHtml"
              type="button"
              class="xq-source-more"
              @click="sourceHtmlOpen = !sourceHtmlOpen"
            >
              {{ sourceHtmlOpen ? '收起原文排版' : '查看原文排版（含图）' }}
            </button>
            <div
              v-if="sourceHtmlOpen && sourceIsHtml"
              class="xq-copy-body"
              v-html="sourceDescription"
            ></div>
          </template>
          <Empty v-else description="暂无原文案" :image-size="40" />
        </div>
      </div>
      <Empty v-else description="请选择任务" />
    </Spin>
  </Drawer>
</template>

<style scoped>
.xq-shop {
  display: grid;
  grid-template-columns: minmax(240px, 46%) 1fr;
  gap: 16px 20px;
}

.xq-shop-media {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.xq-shop-stage {
  position: relative;
}

.xq-shop-nav {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: #111;
  cursor: pointer;
  background: rgb(255 255 255 / 92%);
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  transform: translateY(-50%);
}

.xq-shop-nav.prev {
  left: 8px;
}

.xq-shop-nav.next {
  right: 8px;
}

.xq-shop-dots {
  position: absolute;
  right: 0;
  bottom: 10px;
  left: 0;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
  padding: 0 40px;
  pointer-events: none;
}

.xq-shop-dot {
  width: 7px;
  height: 7px;
  padding: 0;
  pointer-events: auto;
  cursor: pointer;
  background: rgb(255 255 255 / 75%);
  border: 1px solid rgb(0 0 0 / 12%);
  border-radius: 999px;
}

.xq-shop-dot.active {
  background: #ff6a00;
  border-color: #ff6a00;
}

.xq-shop-counter {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  padding: 2px 7px;
  font-size: 12px;
  color: #fff;
  background: rgb(0 0 0 / 45%);
  border-radius: 999px;
}

.xq-shop-strip {
  display: flex;
  gap: 8px;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
}

.xq-shop-thumb {
  flex: 0 0 56px;
  width: 56px;
  height: 56px;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  border: 2px solid #eee;
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
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: #111;
}

.xq-shop-price {
  display: flex;
  gap: 10px;
  align-items: baseline;
  padding: 10px 12px;
  margin-bottom: 12px;
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

.xq-exclusive {
  margin-left: 4px;
  font-size: 13px;
  font-weight: 500;
  color: #b45309;
}

.xq-shop-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #6b7280;
}

.xq-picked-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
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
  padding-top: 14px;
  border-top: 1px solid #eee;
}

.xq-copy-title {
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 700;
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

.xq-source-tip {
  margin-bottom: 10px;
}

.xq-source-article {
  max-height: min(40vh, 360px);
  padding: 2px 0;
  overflow: auto;
}

.xq-source-article p {
  margin: 0 0 8px;
  font-size: 13px;
  line-height: 1.55;
  color: #334155;
}

.xq-source-article p.is-heading {
  margin-top: 10px;
  font-weight: 700;
  color: #111827;
}

.xq-source-more {
  padding: 0;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.xq-copy-body {
  max-height: 360px;
  margin-top: 8px;
  overflow: auto;
  font-size: 13px;
  line-height: 1.6;
  color: #333;
}

.xq-copy-body :deep(img) {
  max-width: 100%;
  height: auto;
}

@media (max-width: 900px) {
  .xq-shop {
    grid-template-columns: 1fr;
  }
}
</style>
