export type SystemListingFieldZone = 'attr' | 'copy' | 'product';
export type ListingFieldZone = string;

export const LISTING_FIELD_ZONE_OPTIONS: Array<{
  color: string;
  label: string;
  value: SystemListingFieldZone;
}> = [
  { value: 'copy', label: '描述', color: 'blue' },
  { value: 'product', label: '产品', color: 'green' },
  { value: 'attr', label: '属性', color: 'orange' },
];

export function isSystemListingFieldZone(
  zone?: string,
): zone is SystemListingFieldZone {
  return zone === 'copy' || zone === 'product' || zone === 'attr';
}

export function listingFieldZoneLabel(zone?: string) {
  return LISTING_FIELD_ZONE_OPTIONS.find((z) => z.value === zone)?.label || '';
}

function hay(code?: string, label?: string, type?: string, extra?: string) {
  return `${label || ''} ${code || ''} ${type || ''} ${extra || ''}`
    .toLowerCase()
    .replaceAll(/[_-]+/g, ' ');
}

export function isListingImageField(field: {
  code?: string;
  label?: string;
  type?: string;
}) {
  const type = String(field.type || '').toUpperCase();
  const h = hay(field.code, field.label, field.type);
  return (
    type.includes('MEDIA') ||
    type.includes('IMAGE') ||
    /(^|\s)(image|photo|img|主图|附图|zoom|swatch)(\s|$)/.test(h)
  );
}

/** 未人工分区时的建议：描述 / 产品 / 属性 */
export function guessListingFieldZone(field: {
  code?: string;
  label?: string;
  type?: string;
}): '' | SystemListingFieldZone {
  if (isListingImageField(field)) return '';
  const h = hay(field.code, field.label, field.type);
  if (
    /(product title|^title$|\btitle\b|product_title|long description|product description|^description$|商品描述|长描述|style description|selling point|highlight|bullet|卖点|product feature|feature\s*\d)/.test(
      h,
    )
  ) {
    return 'copy';
  }
  if (
    /(seller sku|shop sku|vendor style|item code|platform sku|\bsku\b|\bupc\b|\bgtin\b|variation group|\bgroup\b|parent sku|qty|inventory|stock|库存|display color|color family|\bcolor\b)/.test(
      h,
    )
  ) {
    return 'product';
  }
  if (
    /(pack(?:age|aging)?\s*(length|width|height|weight)|item\s*(length|width|height|weight)|overall\s*(length|width|height)|dimension|包装|长宽高|\blength\b|\bwidth\b|\bheight\b|\bweight\b|\bbrand\b|品牌|material|材质)/.test(
      h,
    ) &&
    !/font size|file size|battery|screen/.test(h)
  ) {
    return 'attr';
  }
  return '';
}

export function resolveListingFieldZone(field: {
  code?: string;
  label?: string;
  type?: string;
  zone?: string;
}): '' | ListingFieldZone {
  const z = String(field.zone || '').trim();
  if (isSystemListingFieldZone(z) || /^u_[a-z0-9_]{1,40}$/.test(z)) return z;
  return guessListingFieldZone(field);
}

export function matchFieldByKeywords(
  field: {
    code?: string;
    groupLabel?: string;
    label?: string;
    type?: string;
    valuesList?: string;
  },
  keywords?: string,
) {
  const tokens = String(keywords || '')
    .split(/[\s,，;；|/]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return false;
  const h = hay(
    field.code,
    field.label,
    field.type,
    `${field.groupLabel || ''} ${field.valuesList || ''}`,
  );
  return tokens.some((t) => h.includes(t));
}
