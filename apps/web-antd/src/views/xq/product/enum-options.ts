export type EnumOpt = { label: string; value: string };

/** 提交仍用 code；展示拼上名称，如 (100) WHITE */
export function mappedEnumLabel(value: string, label?: string): string {
  const v = String(value || '').trim();
  const l = String(label || v).trim() || v;
  if (!v || v === l) return l;
  if (l.includes(`(${v})`) || l.startsWith(`${v} `) || l.startsWith(`${v})`)) {
    return l;
  }
  return `(${v}) ${l}`;
}

export function normalizeEnumOptions(
  raw: unknown,
  extra?: { type?: string; valuesList?: string },
): EnumOpt[] {
  const fromRaw = parseEnumList(raw);
  if (fromRaw.length > 0) return fromRaw;
  const text = String(extra?.valuesList || '').trim();
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const parsed = parseEnumList(JSON.parse(text));
      if (parsed.length > 0) return parsed;
    } catch {
      /* ignore */
    }
  }
  if (/[,|;，、]/.test(text)) {
    const parsed = parseEnumList(text.split(/[,|;，、]+/));
    if (parsed.length > 0) return parsed;
  }
  const type = String(extra?.type || '').toUpperCase();
  if (type.includes('BOOL')) {
    return [
      { value: 'Yes', label: 'Yes' },
      { value: 'No', label: 'No' },
    ];
  }
  return [];
}

function parseEnumList(raw: unknown): EnumOpt[] {
  if (!Array.isArray(raw)) return [];
  const out: EnumOpt[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (item === null || item === undefined) continue;
    let value = '';
    let label = '';
    if (typeof item === 'string' || typeof item === 'number') {
      value = String(item).trim();
      label = value;
    } else if (typeof item === 'object') {
      const o = item as Record<string, unknown>;
      value = String(o.value ?? o.code ?? o.id ?? o.label ?? '').trim();
      label = String(o.label ?? o.name ?? o.value ?? o.code ?? value).trim();
    }
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ value, label: mappedEnumLabel(value, label || value) });
    if (out.length >= 800) break;
  }
  return out;
}
