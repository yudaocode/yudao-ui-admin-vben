/** 平台图片生成槽位规则（存 imageRule.configJson） */

export type ImageSlotType =
  | 'detail'
  | 'dimension'
  | 'main'
  | 'other'
  | 'package'
  | 'scene';

export interface ImageSlot {
  imageType: ImageSlotType;
  label?: string;
}

export const IMAGE_SLOT_TYPES: Array<{ label: string; value: ImageSlotType }> =
  [
    { value: 'main', label: '主图' },
    { value: 'scene', label: '场景图' },
    { value: 'detail', label: '细节图' },
    { value: 'dimension', label: '尺寸图' },
    { value: 'package', label: '包装图' },
    { value: 'other', label: '其它' },
  ];

/** 默认出图序列：主图 / 场景×2 / 细节×2 / 尺寸 / 细节 */
export const DEFAULT_IMAGE_SLOTS: ImageSlot[] = [
  { imageType: 'main' },
  { imageType: 'scene' },
  { imageType: 'scene' },
  { imageType: 'detail' },
  { imageType: 'detail' },
  { imageType: 'dimension' },
  { imageType: 'detail' },
];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  IMAGE_SLOT_TYPES.map((t) => [t.value, t.label]),
);

export function imageSlotTypeLabel(t?: string) {
  return TYPE_LABEL[String(t || '').toLowerCase()] || t || '图';
}

export function parseImageSlotConfig(configJson?: string): ImageSlot[] {
  if (!configJson || configJson === '{}') return [];
  try {
    const cfg = JSON.parse(configJson);
    const raw = Array.isArray(cfg?.slots) ? cfg.slots : [];
    const out: ImageSlot[] = [];
    for (const item of raw) {
      const t = String(item?.imageType || item?.type || '')
        .toLowerCase()
        .trim() as ImageSlotType;
      if (!TYPE_LABEL[t]) continue;
      out.push({
        imageType: t,
        label: String(item?.label || TYPE_LABEL[t]),
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function buildImageSlotConfigJson(slots: ImageSlot[]) {
  return JSON.stringify({
    slots: (slots || []).map((s, i) => ({
      index: i,
      imageType: s.imageType,
      label: s.label || imageSlotTypeLabel(s.imageType),
    })),
  });
}

/** 写入 promptText 的摘要，兼容旧字段必填 */
export function summarizeImageSlots(slots: ImageSlot[]) {
  const counts = new Map<string, number>();
  for (const s of slots || []) {
    const key = s.imageType;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const parts: string[] = [];
  for (const t of IMAGE_SLOT_TYPES) {
    const n = counts.get(t.value) || 0;
    if (n > 0) parts.push(`${t.label}×${n}`);
  }
  return parts.length > 0 ? `出图规则：${parts.join(' · ')}` : '出图规则未配置';
}

export interface AlignedPromptRow<T = Record<string, any>> {
  slotIndex: number;
  imageType: string;
  label: string;
  prompt?: T;
  missing: boolean;
}

/** 按规则槽位对齐 AI 提示词：优先同下标，其次同类型未占用项 */
export function alignPromptsToSlots<
  T extends { imageType?: string; index?: number },
>(prompts: T[] | undefined, slots: ImageSlot[]): AlignedPromptRow<T>[] {
  const list = Array.isArray(prompts) ? [...prompts] : [];
  const used = new Set<number>();
  const takeByType = (type: string) => {
    const i = list.findIndex(
      (p, idx) =>
        !used.has(idx) && String(p?.imageType || '').toLowerCase() === type,
    );
    if (i === -1) return undefined;
    used.add(i);
    return list[i];
  };
  const takeByIndex = (i: number) => {
    if (i < 0 || i >= list.length || used.has(i)) return undefined;
    used.add(i);
    return list[i];
  };

  return (slots || []).map((slot, i) => {
    const byIdx = takeByIndex(i);
    const prompt =
      byIdx && String(byIdx.imageType || '').toLowerCase() === slot.imageType
        ? byIdx
        : takeByType(slot.imageType) || byIdx;
    return {
      slotIndex: i,
      imageType: slot.imageType,
      label: slot.label || imageSlotTypeLabel(slot.imageType),
      prompt,
      missing: !prompt,
    };
  });
}
