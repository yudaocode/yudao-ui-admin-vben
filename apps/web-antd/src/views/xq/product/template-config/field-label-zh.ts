/** 亚马逊常见字段整词对照 */
const PHRASES: Record<string, string> = {
  'assembly instructions description': '组装说明',
  'average battery life unit': '平均电池续航单位',
  'baa/taa regulation compliance': 'BAA/TAA 合规',
  'base diameter unit': '底面直径单位',
  'base diameter': '底面直径',
  'base material': '基础材质',
  'base to top distance unit': '底部到顶部高度单位',
  'brand name': '品牌名称',
  'bullet point': '卖点',
  'cable length decimal value': '线缆长度数值',
  'cable length unit': '线缆长度单位',
  'chain length decimal value': '链条长度数值',
  'chain length unit': '链条长度单位',
  'collapsed length minimum': '折叠最短长度',
  'collapsed length minimum unit': '折叠最短长度单位',
  'compliance protocol': '连接协议',
  'contains battery or cell': '是否含电池',
  'control method': '控制方式',
  'controller type': '控制器类型',
  'embellishment feature': '装饰特征',
  'frame material': '框架材质',
  'furniture log material': '家具原木材质',
  'height base to top': '底部到顶部的高度',
  'height unit': '高度单位',
  'item height floor to top': '地面到顶部高度',
  'item height floor to top unit': '地面到顶部高度单位',
  'item height unit of measure': '商品高度计量单位',
  'item height': '商品高度',
  'item length unit': '商品长度单位',
  'item length': '商品长度',
  'item package height': '包装高度',
  'item package length': '包装长度',
  'item package width': '包装宽度',
  'item package weight': '包装重量',
  'item width unit': '商品宽度单位',
  'item width': '商品宽度',
  'item weight': '商品重量',
};

const TOKENS: Record<string, string> = {
  assembly: '组装',
  average: '平均',
  base: '基础',
  battery: '电池',
  brand: '品牌',
  bullet: '卖点',
  cable: '线缆',
  cell: '电芯',
  chain: '链条',
  collapsed: '折叠',
  compliance: '合规',
  connectivity: '连接',
  contains: '含',
  control: '控制',
  controller: '控制器',
  decimal: '小数',
  description: '描述',
  diameter: '直径',
  distance: '距离',
  embellishment: '装饰',
  feature: '特征',
  floor: '地面',
  frame: '框架',
  furniture: '家具',
  height: '高度',
  instructions: '说明',
  item: '商品',
  length: '长度',
  life: '续航',
  log: '原木',
  material: '材质',
  measure: '计量',
  method: '方式',
  minimum: '最小',
  name: '名称',
  of: '',
  or: '或',
  package: '包装',
  point: '点',
  protocol: '协议',
  regulation: '法规',
  to: '到',
  top: '顶部',
  type: '类型',
  unit: '单位',
  value: '数值',
  weight: '重量',
  width: '宽度',
};

function normalize(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replaceAll('_', ' ')
    .replaceAll('/', ' ')
    .replaceAll('-', ' ')
    .replaceAll(/\s+/g, ' ');
}

export function translateFieldLabel(label: string, code?: string): string {
  const fromLabel = normalize(label);
  if (PHRASES[fromLabel]) return PHRASES[fromLabel];
  const fromCode = normalize(code || '');
  if (fromCode && PHRASES[fromCode]) return PHRASES[fromCode];

  const parts = fromLabel.split(' ').filter(Boolean);
  if (parts.length === 0) return label;
  const hit = parts.some((p) => p in TOKENS);
  if (!hit) return label;
  return parts.map((p) => (p in TOKENS ? TOKENS[p] : p)).join('');
}
