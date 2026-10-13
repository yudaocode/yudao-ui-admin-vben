/** 图片提示词 Excel / Word / txt / json 解析与导出（按需动态加载 xlsx / mammoth） */

const STRUCTURED_MARKERS = [
  '【白底图要求】',
  '【场景图要求】',
  '【细节图要求】',
  '【功能图要求】',
  '【尺寸图要求】',
];

function findParaIndex(paras: string[], marker: string, after = 0) {
  const key = String(marker || '').trim();
  if (!key) return -1;
  return paras.findIndex((p, i) => i >= after && p.includes(key));
}

function sliceParagraphs(
  paras: string[],
  startMarker: string,
  endMarker?: string,
) {
  const start = findParaIndex(paras, startMarker);
  if (start < 0) return '';
  const end = endMarker ? findParaIndex(paras, endMarker, start + 1) : -1;
  const sliceEnd = end > start ? end : paras.length;
  return paras.slice(start, sliceEnd).join('\n').trim();
}

function buildPrompt(name: string, sharedHeader: string, body: string) {
  const parts = [String(name || '').trim()];
  const header = String(sharedHeader || '').trim();
  const content = String(body || '').trim();
  if (header) parts.push(header);
  if (content) parts.push(content);
  return parts.join('\n').trim();
}

function parseStructuredImagePrompts(paras: string[]) {
  const firstSectionIdx = findParaIndex(paras, '【白底图要求】');
  const sharedHeader =
    firstSectionIdx > 0
      ? paras.slice(0, firstSectionIdx).join('\n').trim()
      : '';

  const whiteBg = sliceParagraphs(paras, '【白底图要求】', '【场景图要求】');
  const sceneBlock = sliceParagraphs(paras, '【场景图要求】', '【细节图要求】');
  const scene1 = sliceParagraphs(paras, '场景图1', '场景图2') || sceneBlock;
  const scene2 = sliceParagraphs(paras, '场景图2', '场景图3');
  const scene3 = sliceParagraphs(paras, '场景图3', '【细节图要求】');
  const detailBlock = sliceParagraphs(
    paras,
    '【细节图要求】',
    '【功能图要求】',
  );
  const detail1 = sliceParagraphs(paras, '细节图1', '细节图2') || detailBlock;
  const detail2 = sliceParagraphs(paras, '细节图2', '【功能图要求】');
  const feature = sliceParagraphs(paras, '【功能图要求】', '【尺寸图要求】');
  const dimension = sliceParagraphs(
    paras,
    '【尺寸图要求】',
    '【背景使用原则】',
  );

  return [
    { name: '白底主图', body: whiteBg },
    { name: '场景图1', body: scene1 },
    { name: '场景图2', body: scene2 },
    { name: '场景图3', body: scene3 },
    { name: '细节图1', body: detail1 },
    { name: '细节图2', body: detail2 },
    { name: '功能图', body: feature },
    { name: '尺寸图', body: dimension },
  ]
    .map((item) => buildPrompt(item.name, sharedHeader, item.body))
    .filter(Boolean);
}

function parseSimpleImagePrompts(paras: string[]) {
  if (paras.length === 1) {
    return [buildPrompt('AI指令', '', paras[0]!)];
  }
  if (paras.length <= 40) {
    return paras
      .map((p, i) => {
        const text = String(p || '').trim();
        if (!text) return '';
        const lines = text
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        if (lines.length > 1) return text;
        return buildPrompt(`第${i + 1}条`, '', text);
      })
      .filter(Boolean);
  }
  return [buildPrompt('AI指令', '', paras.join('\n'))];
}

function isStructuredImagePromptDoc(paras: string[]) {
  return STRUCTURED_MARKERS.some((marker) =>
    paras.some((p) => p.includes(marker)),
  );
}

function splitPlainTextPrompts(text: string): string[] {
  let texts = text
    .split(/\r?\n\s*\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (texts.length <= 1) {
    texts = text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return texts;
}

async function parseImagePromptsFromExcel(file: File): Promise<string[]> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('图片提示词 Excel 无效');
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error('图片提示词 Excel 无效');
  const rows = XLSX.utils.sheet_to_json<(null | number | string)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });
  const prompts = rows
    .map((row) => String(Array.isArray(row) ? (row[0] ?? '') : '').trim())
    .filter(Boolean);
  if (prompts.length === 0) throw new Error('图片提示词 Excel 中没有有效内容');
  return prompts;
}

async function parseImagePromptsFromDocx(file: File): Promise<string[]> {
  const mammoth = await import('mammoth');
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  const paras = String(result?.value || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (paras.length === 0) throw new Error('Word 文档中没有有效内容');
  const prompts = isStructuredImagePromptDoc(paras)
    ? parseStructuredImagePrompts(paras)
    : parseSimpleImagePrompts(paras);
  if (prompts.length === 0) throw new Error('Word 文档中没有有效图片提示词');
  return prompts;
}

function parseImagePromptsFromJson(text: string): string[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error('JSON 需为提示词数组');
  const texts = data
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        return String(
          (item as { prompt?: string; promptText?: string }).promptText ||
            (item as { prompt?: string }).prompt ||
            '',
        ).trim();
      }
      return '';
    })
    .filter(Boolean);
  if (texts.length === 0) throw new Error('JSON 中未解析到提示词');
  return texts;
}

/** 从 Excel / Word / txt / json 解析图片提示词正文列表 */
export async function parseImagePromptTextsFromFile(
  file: File,
): Promise<string[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.json')) {
    return parseImagePromptsFromJson(await file.text());
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseImagePromptsFromExcel(file);
  }
  if (name.endsWith('.docx')) {
    return parseImagePromptsFromDocx(file);
  }
  if (name.endsWith('.doc')) {
    throw new Error('暂不支持旧版 .doc，请另存为 .docx');
  }
  const texts = splitPlainTextPrompts(await file.text());
  if (texts.length === 0) throw new Error('文件中未解析到提示词');
  return texts;
}

/** 从文件名匹配 SKU（优先更长命中，兼容 `DCW25003_图片提示词.xlsx`） */
export function matchSkuFromFileName(
  fileName: string,
  skus: string[],
): string | undefined {
  const base = String(fileName || '')
    .replace(/\.[^.]+$/i, '')
    .trim();
  if (!base) return undefined;
  const sorted = [
    ...new Set(skus.map((s) => String(s || '').trim()).filter(Boolean)),
  ].toSorted((a, b) => b.length - a.length);
  return sorted.find((sku) => base.includes(sku));
}

/** 导出图片提示词为 xlsx（A 列每行一条，与原版一致） */
export async function exportImagePromptsWorkbook(
  prompts: string[],
  sku = 'SKU',
) {
  const lines = prompts.map((s) => String(s || '').trim()).filter(Boolean);
  if (lines.length === 0) throw new Error('暂无图片提示词可导出');
  const XLSX = await import('xlsx');
  const rows = lines.map((text) => [text]);
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 80 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '图片提示词');
  const safeSku = String(sku || 'SKU').trim() || 'SKU';
  XLSX.writeFile(workbook, `${safeSku}_图片提示词.xlsx`);
  return lines.length;
}
