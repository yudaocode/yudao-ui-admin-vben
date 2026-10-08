/**
 * API 密钥接入预设：官方 / 各中转形态不同，表单按类型显隐字段。
 * 多中转 = 多条密钥；每条选自己的 gatewayType。
 */

export type GatewayType =
  | 'aixoras'
  | 'cun'
  | 'custom'
  | 'hao'
  | 'openai_compatible'
  | 'openai_official'
  | 'toapis';

export interface GatewayPreset {
  value: GatewayType;
  label: string;
  hint: string;
  /** 默认 Base URL（官方可填官方地址；中转填各自网关） */
  defaultUrl: string;
  defaultImageBodyStyle?: string;
  defaultPreferResponsesApi?: number;
  defaultSupportsAsync?: number;
  defaultVisionImageDetail?: string;
  defaultCapabilities: string[];
  /** 表单显示哪些可选块 */
  showRelayImageStyle: boolean;
  showAsync: boolean;
  showResponses: boolean;
  showVisionDetail: boolean;
  showExtraConfig: boolean;
}

export const GATEWAY_PRESETS: GatewayPreset[] = [
  {
    value: 'openai_official',
    label: 'OpenAI 官方',
    hint: '直连官方；一般只需密钥 + 模型名，无中转专有字段',
    defaultUrl: 'https://api.openai.com/v1',
    defaultImageBodyStyle: 'openai',
    defaultPreferResponsesApi: 0,
    defaultSupportsAsync: 0,
    defaultVisionImageDetail: 'auto',
    defaultCapabilities: ['chat', 'vision', 'image_gen'],
    showRelayImageStyle: false,
    showAsync: false,
    showResponses: true,
    showVisionDetail: true,
    showExtraConfig: true,
  },
  {
    value: 'aixoras',
    label: 'Aixoras 中转',
    hint: 'doc.aixoras.com：对话/识图可用 Responses；生图 aspect_ratio；改图 multipart image',
    defaultUrl: 'https://api.aixoras.com/v1',
    defaultImageBodyStyle: 'aixoras',
    defaultPreferResponsesApi: 1,
    defaultSupportsAsync: 1,
    defaultVisionImageDetail: 'low',
    defaultCapabilities: ['chat', 'vision', 'image_gen', 'image_edit'],
    showRelayImageStyle: true,
    showAsync: true,
    showResponses: true,
    showVisionDetail: true,
    showExtraConfig: true,
  },
  {
    value: 'hao',
    label: 'HaoAI 中转',
    hint: '生图常用 openai/gpt-image-2.5-flare + quality',
    defaultUrl: 'https://api.hao.ai/v1',
    defaultImageBodyStyle: 'hao',
    defaultPreferResponsesApi: 0,
    defaultSupportsAsync: 0,
    defaultVisionImageDetail: 'low',
    defaultCapabilities: ['chat', 'vision', 'image_gen', 'image_edit'],
    showRelayImageStyle: true,
    showAsync: false,
    showResponses: false,
    showVisionDetail: true,
    showExtraConfig: true,
  },
  {
    value: 'toapis',
    label: 'ToAPIs 中转',
    hint: '国内/国际节点 URL 不同；生图可能走异步任务',
    defaultUrl: 'https://api.toapis.cn/v1',
    defaultImageBodyStyle: 'toapis',
    defaultPreferResponsesApi: 0,
    defaultSupportsAsync: 1,
    defaultVisionImageDetail: 'low',
    defaultCapabilities: ['chat', 'vision', 'image_gen', 'image_edit'],
    showRelayImageStyle: true,
    showAsync: true,
    showResponses: false,
    showVisionDetail: true,
    showExtraConfig: true,
  },
  {
    value: 'cun',
    label: 'CUN.AI 中转',
    hint: 'OpenAI Compatible；模型名以控制台为准',
    defaultUrl: 'https://www.cun.ai/v1',
    defaultImageBodyStyle: 'openai',
    defaultPreferResponsesApi: 0,
    defaultSupportsAsync: 0,
    defaultVisionImageDetail: 'low',
    defaultCapabilities: ['chat', 'vision', 'image_gen'],
    showRelayImageStyle: true,
    showAsync: false,
    showResponses: false,
    showVisionDetail: true,
    showExtraConfig: true,
  },
  {
    value: 'openai_compatible',
    label: '其它 OpenAI 兼容中转',
    hint: '任意兼容站：自填 URL 与模型名',
    defaultUrl: '',
    defaultImageBodyStyle: 'openai',
    defaultPreferResponsesApi: 0,
    defaultSupportsAsync: 0,
    defaultVisionImageDetail: 'low',
    defaultCapabilities: ['chat', 'vision'],
    showRelayImageStyle: true,
    showAsync: true,
    showResponses: true,
    showVisionDetail: true,
    showExtraConfig: true,
  },
  {
    value: 'custom',
    label: '完全自定义',
    hint: '字段全开；特殊参数放扩展 JSON',
    defaultUrl: '',
    defaultCapabilities: ['chat'],
    showRelayImageStyle: true,
    showAsync: true,
    showResponses: true,
    showVisionDetail: true,
    showExtraConfig: true,
  },
];

export const CAPABILITY_OPTIONS = [
  { label: '对话', value: 'chat' },
  { label: '识图', value: 'vision' },
  { label: '生图', value: 'image_gen' },
  { label: '改图', value: 'image_edit' },
];

export function getGatewayPreset(type?: string): GatewayPreset {
  return (
    GATEWAY_PRESETS.find((p) => p.value === type) ||
    GATEWAY_PRESETS.find((p) => p.value === 'openai_compatible')!
  );
}

export function parseCapabilities(raw?: null | string | string[]): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinCapabilities(list?: null | string[]): string {
  return (list || []).filter(Boolean).join(',');
}

/** 切换接入类型时合并默认值（不覆盖已填密钥） */
export function buildPresetPatch(type: GatewayType) {
  const p = getGatewayPreset(type);
  return {
    gatewayType: p.value,
    url: p.defaultUrl || undefined,
    imageBodyStyle: p.defaultImageBodyStyle,
    preferResponsesApi: p.defaultPreferResponsesApi ?? null,
    supportsAsync: p.defaultSupportsAsync ?? null,
    visionImageDetail: p.defaultVisionImageDetail,
    capabilities: [...p.defaultCapabilities],
  };
}
