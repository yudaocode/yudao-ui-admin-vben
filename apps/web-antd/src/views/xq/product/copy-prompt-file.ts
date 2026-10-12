/** 文案提示词：标题 / 卖点 / 长描述 — Excel / JSON / 文本解析与导出 */

export type CopyPromptPack = {
  description: string;
  features: string[];
  title: string;
};

export type CopyPromptImportRow = CopyPromptPack & {
  sku: string;
};

const FEATURE_COUNT = 5;

function emptyPack(): CopyPromptPack {
  return {
    title: '',
    features: Array.from({ length: FEATURE_COUNT }, () => ''),
    description: '',
  };
}

function normalizeFeatures(raw: unknown): string[] {
  const out = Array.from({ length: FEATURE_COUNT }, () => '');
  if (Array.isArray(raw)) {
    raw.slice(0, FEATURE_COUNT).forEach((v, i) => {
      out[i] = String(v ?? '').trim();
    });
    return out;
  }
  if (raw && typeof raw === 'object') {
    for (let i = 0; i < FEATURE_COUNT; i += 1) {
      const o = raw as Record<string, unknown>;
      out[i] = String(
        o[`feature${i + 1}`] ?? o[`卖点${i + 1}`] ?? o[String(i + 1)] ?? '',
      ).trim();
    }
  }
  return out;
}

export function normalizeCopyPromptPack(raw?: null | unknown): CopyPromptPack {
  const pack = emptyPack();
  if (!raw || typeof raw !== 'object') return pack;
  const o = raw as Record<string, unknown>;
  pack.title = String(o.title ?? o.标题 ?? o.titlePrompt ?? '').trim();
  pack.description = String(
    o.description ?? o.长描述 ?? o.desc ?? o.descriptionPrompt ?? '',
  ).trim();
  pack.features = normalizeFeatures(
    o.features ?? o.卖点 ?? o.featurePrompts ?? o,
  );
  // 若 features 全空，再试 feature1..5
  if (!pack.features.some(Boolean)) {
    pack.features = normalizeFeatures(o);
  }
  return pack;
}

function pushRow(
  map: Map<string, CopyPromptPack>,
  sku: string,
  pack: CopyPromptPack,
) {
  const key = String(sku || '').trim();
  if (!key) return;
  const cur = map.get(key) || emptyPack();
  if (pack.title) cur.title = pack.title;
  if (pack.description) cur.description = pack.description;
  pack.features.forEach((f, i) => {
    if (f) cur.features[i] = f;
  });
  map.set(key, cur);
}

function parseCopyPromptsFromJson(text: string): CopyPromptImportRow[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('JSON 格式无效');
  }
  const map = new Map<string, CopyPromptPack>();

  if (Array.isArray(data)) {
    for (const row of data) {
      if (!row || typeof row !== 'object') continue;
      const o = row as Record<string, unknown>;
      const sku = String(o.sku ?? o.externalSku ?? o.SKU ?? '').trim();
      pushRow(map, sku, normalizeCopyPromptPack(o));
    }
  } else if (data && typeof data === 'object') {
    for (const [sku, val] of Object.entries(data as Record<string, unknown>)) {
      pushRow(map, sku, normalizeCopyPromptPack(val));
    }
  }
  const rows = [...map.entries()].map(([sku, pack]) => ({ sku, ...pack }));
  if (rows.length === 0) throw new Error('JSON 中未解析到文案提示词');
  return rows;
}

async function parseCopyPromptsFromExcel(
  file: File,
): Promise<CopyPromptImportRow[]> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]!];
  if (!sheet) throw new Error('Excel 无工作表');
  const aoa = XLSX.utils.sheet_to_json<(number | string | undefined)[]>(sheet, {
    header: 1,
    defval: '',
  }) as unknown as string[][];
  if (aoa.length === 0) throw new Error('Excel 为空');

  const header = (aoa[0] || []).map((c) =>
    String(c || '')
      .trim()
      .toLowerCase(),
  );
  const hasHeader = header.some((h) =>
    /sku|标题|title|卖点|feature|描述|description/.test(h),
  );
  const rows = hasHeader ? aoa.slice(1) : aoa;
  const col = (names: string[]) =>
    header.findIndex((h) => names.some((n) => h.includes(n)));

  const iSku = hasHeader ? Math.max(0, col(['sku', '货号'])) : 0;
  const iTitle = hasHeader ? col(['title', '标题']) : 1;
  const iDesc = hasHeader ? col(['description', '长描述', '描述', 'desc']) : 7;
  const iFeat = Array.from({ length: FEATURE_COUNT }, (_, i) =>
    hasHeader
      ? col([`feature${i + 1}`, `卖点${i + 1}`, `卖点 ${i + 1}`])
      : i + 2,
  );

  const map = new Map<string, CopyPromptPack>();
  for (const line of rows) {
    if (!line?.length) continue;
    const sku = String(line[iSku] ?? '').trim();
    if (!sku) continue;
    const pack = emptyPack();
    if (iTitle >= 0) pack.title = String(line[iTitle] ?? '').trim();
    if (iDesc >= 0) pack.description = String(line[iDesc] ?? '').trim();
    iFeat.forEach((idx, fi) => {
      if (idx >= 0) pack.features[fi] = String(line[idx] ?? '').trim();
    });
    pushRow(map, sku, pack);
  }
  const out = [...map.entries()].map(([sku, pack]) => ({ sku, ...pack }));
  if (out.length === 0)
    throw new Error('Excel 中未解析到文案提示词（需含 SKU 列）');
  return out;
}

function parseCopyPromptsFromText(text: string): CopyPromptImportRow[] {
  const blocks = String(text || '')
    .split(/(?=【\s*SKU\s*】)/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const map = new Map<string, CopyPromptPack>();

  const take = (block: string, markers: string[]) => {
    const src = String(block || '');
    for (const m of markers) {
      const idx = src.indexOf(m);
      if (idx === -1) continue;
      const after = src.slice(idx + m.length).replace(/^[\s:：]+/, '');
      const end = after.search(/【/);
      const body = (end >= 0 ? after.slice(0, end) : after).trim();
      if (body) return body;
    }
    return '';
  };

  for (const block of blocks) {
    const sku =
      take(block, ['【SKU】', '【货号】']) ||
      block.match(/SKU\s*[=:：]\s*(\S+)/i)?.[1] ||
      '';
    if (!sku) continue;
    const pack = emptyPack();
    pack.title = take(block, ['【标题提示词】', '【标题】', '【title】']);
    pack.description = take(block, [
      '【长描述提示词】',
      '【长描述】',
      '【描述提示词】',
      '【description】',
    ]);
    for (let i = 0; i < FEATURE_COUNT; i += 1) {
      pack.features[i] = take(block, [
        `【卖点${i + 1}提示词】`,
        `【卖点 ${i + 1}】`,
        `【卖点${i + 1}】`,
        `【feature${i + 1}】`,
      ]);
    }
    pushRow(map, sku, pack);
  }

  // 无 SKU 分块：整份给「当前任务」由调用方补 sku
  if (map.size === 0) {
    const pack = emptyPack();
    pack.title = take(text, ['【标题提示词】', '【标题】']);
    pack.description = take(text, ['【长描述提示词】', '【长描述】']);
    for (let i = 0; i < FEATURE_COUNT; i += 1) {
      pack.features[i] = take(text, [
        `【卖点${i + 1}提示词】`,
        `【卖点${i + 1}】`,
      ]);
    }
    if (pack.title || pack.description || pack.features.some(Boolean)) {
      return [{ sku: '', ...pack }];
    }
    throw new Error('文本中未解析到文案提示词');
  }
  return [...map.entries()].map(([sku, pack]) => ({ sku, ...pack }));
}

/** 从 Excel / JSON / txt 解析文案提示词（按 SKU） */
export async function parseCopyPromptsFromFile(
  file: File,
): Promise<CopyPromptImportRow[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.json')) {
    return parseCopyPromptsFromJson(await file.text());
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseCopyPromptsFromExcel(file);
  }
  if (name.endsWith('.docx') || name.endsWith('.doc')) {
    throw new Error('文案提示词请用 Excel / JSON / txt（暂不支持 Word）');
  }
  return parseCopyPromptsFromText(await file.text());
}

/** 导出导入模板 */
export async function exportCopyPromptTemplate(sku = '示例SKU') {
  const XLSX = await import('xlsx');
  const header = [
    'sku',
    'title',
    'feature1',
    'feature2',
    'feature3',
    'feature4',
    'feature5',
    'description',
  ];
  const sample = [
    sku,
    '标题更突出材质与场景，控制在 150 字符内',
    '卖点1：强调收纳与承重',
    '卖点2：强调易组装',
    '',
    '',
    '',
    '长描述补充尺寸与适用空间，保持英文完整句子',
  ];
  const ws = XLSX.utils.aoa_to_sheet([header, sample]);
  ws['!cols'] = header.map(() => ({ wch: 28 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '文案提示词');
  XLSX.writeFile(wb, '文案提示词导入模板.xlsx');
}

export function copyPromptCount(pack?: CopyPromptPack | null) {
  if (!pack) return 0;
  return (
    (pack.title ? 1 : 0) +
    (pack.description ? 1 : 0) +
    pack.features.filter((f) => String(f || '').trim()).length
  );
}
