/**
 * AI 绘图：模型能力常量
 *
 * 1. 能力只在代码中维护，不新增后台配置；新模型上线 = 在这里加一项
 * 2. 只按 `${platform}:${model}` 精确匹配，不做子串、前缀猜测
 * 3. 决定表单显示哪些字段、可选值与上限；后端只做 VO 的必要校验
 * 4. 「已登记」不代表已与真实上游联调
 */
import { AiImageModeEnum } from '@vben/constants';

/** AI 绘图涉及的平台（与后端 AiPlatformEnum 的 platform 一致） */
export const AiImagePlatformEnum = {
  OPENAI: 'OpenAI',
  TONG_YI: 'TongYi',
  SILICON_FLOW: 'SiliconFlow',
  STABLE_DIFFUSION: 'StableDiffusion',
  DOU_BAO: 'DouBao',
  MIDJOURNEY: 'Midjourney',
};

/** AI 绘图输入图片角色的名称 */
export const AiImageInputRoleLabels: Record<string, string> = {
  reference: '参考图',
  blend: '融图',
  swap_source: '来源脸',
  swap_target: '目标图',
  cref: '角色参考',
  sref: '风格参考',
  mask: '蒙版',
};

// ========== 通用模型、Seedream ==========

/** 高级参数：key 与 ImageDrawReqVO 的字段一致 */
export interface ImageAdvancedField {
  key:
    | 'cfgScale'
    | 'clipGuidancePreset'
    | 'sampler'
    | 'seed'
    | 'steps'
    | 'stylePreset';
  label: string;
  type: 'number' | 'select';
  min?: number;
  max?: number;
  step?: number;
  default?: number | string;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export interface ImageModelCapability {
  client: string; // 客户端标识，例如 OPENAI_IMAGE、ARK_SEEDREAM
  /** 尺寸方式：fixed 固定尺寸；pixel 像素宽高（可选自定义）；tier 尺寸档位 */
  sizeMode: 'fixed' | 'pixel' | 'tier';
  /** 可选尺寸（fixed / pixel），格式 宽x高 */
  sizes?: string[];
  /** 自定义像素范围（pixel）；为空表示不开放自定义 */
  custom?: { max: number; min: number; step: number };
  /** 尺寸档位（tier） */
  tiers?: string[];
  /** 画质（OpenAI） */
  qualities?: string[];
  promptMax: number;
  negativePrompt: boolean;
  /** 参考图：max = 0 不显示；accept 为文件后缀 */
  reference: { accept?: string[]; max: number; maxMb?: number };
  advanced?: ImageAdvancedField[];
  /** 固定参数：只读展示（Seedream） */
  fixed?: { name: string; note: string; value: string }[];
  /** 写法建议（Seedream） */
  guide?: string[];
  status?: { blocked?: string; legacy?: string };
}

const PROMPT_MAX = 1200; // 与 AiImageDrawReqVO.prompt 上限一致
const IMAGE_ACCEPT = ['png', 'jpg', 'jpeg']; // 参考图的文件后缀

const TONG_YI_PIXEL: Pick<
  ImageModelCapability,
  'custom' | 'sizeMode' | 'sizes'
> = {
  sizeMode: 'pixel',
  sizes: ['1024x1024', '1280x720', '720x1280', '1152x768'],
  custom: { min: 512, max: 1440, step: 8 },
};

const SEEDREAM_BASE: Omit<
  ImageModelCapability,
  'promptMax' | 'reference' | 'tiers'
> = {
  client: 'ARK_SEEDREAM',
  sizeMode: 'tier',
  negativePrompt: false,
  fixed: [
    {
      name: 'sequential_image_generation',
      value: '不传',
      note: '官方默认 disabled，每任务 1 张',
    },
    { name: 'response_format', value: 'url', note: '结果转存文件服务' },
    { name: 'watermark', value: 'false', note: '不加水印' },
    {
      name: 'optimize_prompt_options',
      value: '{ mode: standard }',
      note: '标准提示词优化',
    },
  ],
  guide: [
    '0 张参考图 = 文生图；1 张 = 图片编辑（含改字）；2–10 张 = 多图参考，提示词中用“图1、图2”指代',
    '结构：主体描述 + 风格 + 美学；关键信息靠前；用正向表达代替“不要 xxx”',
    '需要文字时明确“生成文字”，写清位置、风格、材质，文字用引号包裹',
    '编辑时一次只做一件事，多实体时写明“对谁做什么”',
  ],
};

const STABILITY_ADVANCED: ImageAdvancedField[] = [
  {
    key: 'seed',
    label: '随机种子',
    type: 'number',
    min: 0,
    max: 4_294_967_295,
    default: 0,
  },
  {
    key: 'steps',
    label: '推理步数',
    type: 'number',
    min: 10,
    max: 50,
    default: 30,
  },
  {
    key: 'cfgScale',
    label: '引导系数',
    type: 'number',
    min: 0,
    max: 35,
    step: 0.5,
    default: 7,
  },
  {
    key: 'sampler',
    label: '采样方法',
    type: 'select',
    default: 'K_DPMPP_2M',
    options: [
      'DDIM',
      'DDPM',
      'K_DPMPP_2M',
      'K_DPMPP_2S_ANCESTRAL',
      'K_DPM_2',
      'K_DPM_2_ANCESTRAL',
      'K_EULER',
      'K_EULER_ANCESTRAL',
      'K_HEUN',
      'K_LMS',
    ].map((value) => ({ value, label: value })),
  },
  {
    key: 'stylePreset',
    label: '风格预设',
    type: 'select',
    default: '',
    options: [
      '',
      '3d-model',
      'analog-film',
      'anime',
      'cinematic',
      'comic-book',
      'digital-art',
      'enhance',
      'fantasy-art',
      'isometric',
      'line-art',
      'low-poly',
      'modeling-compound',
      'neon-punk',
      'origami',
      'photographic',
      'pixel-art',
      'tile-texture',
    ].map((value) => ({ value, label: value || '无' })),
  },
  {
    key: 'clipGuidancePreset',
    label: 'CLIP 引导',
    type: 'select',
    default: 'NONE',
    options: [
      'NONE',
      'FAST_BLUE',
      'FAST_GREEN',
      'SIMPLE',
      'SLOW',
      'SLOWER',
      'SLOWEST',
    ].map((value) => ({ value, label: value })),
  },
];

/** 已登记模型的能力：键 = `${platform}:${model}`，只做精确匹配 */
export const IMAGE_MODEL_CAPABILITIES: Record<string, ImageModelCapability> = {
  'OpenAI:gpt-image-1': {
    client: 'OPENAI_IMAGE',
    sizeMode: 'fixed',
    sizes: ['1024x1024', '1536x1024', '1024x1536'],
    qualities: ['auto', 'high', 'medium', 'low'],
    promptMax: PROMPT_MAX,
    negativePrompt: false,
    reference: { max: 0 },
    status: { legacy: '官方有该模型的历史下线公告，上线前按官方模型页核实' },
  },
  'OpenAI:dall-e-3': {
    client: 'OPENAI_IMAGE',
    sizeMode: 'fixed',
    sizes: ['1024x1024', '1792x1024', '1024x1792'],
    qualities: ['standard', 'hd'],
    promptMax: PROMPT_MAX,
    negativePrompt: false,
    reference: { max: 0 },
  },
  'TongYi:wan2.7-image': {
    client: 'DASHSCOPE_IMAGE',
    ...TONG_YI_PIXEL,
    promptMax: PROMPT_MAX,
    negativePrompt: false,
    reference: { max: 0 },
    status: {
      blocked: 'DashScope SDK 1.1.2.2 没有 wan2.7-image 路由，暂不可用',
    },
  },
  'TongYi:wanx2.1-t2i-turbo': {
    client: 'DASHSCOPE_IMAGE',
    ...TONG_YI_PIXEL,
    promptMax: PROMPT_MAX,
    negativePrompt: false,
    reference: { max: 0 },
  },
  'SiliconFlow:Kwai-Kolors/Kolors': {
    client: 'SILICONFLOW_IMAGE',
    sizeMode: 'pixel',
    sizes: ['1024x1024', '960x1280', '768x1024', '720x1440', '720x1280'],
    promptMax: PROMPT_MAX,
    negativePrompt: true,
    reference: { max: 1, maxMb: 10, accept: [...IMAGE_ACCEPT, 'webp'] },
    advanced: [
      {
        key: 'seed',
        label: '随机种子',
        type: 'number',
        min: 0,
        max: 9_999_999_999,
        placeholder: '留空随机',
      },
      {
        key: 'steps',
        label: '推理步数',
        type: 'number',
        min: 1,
        max: 50,
        default: 20,
      },
      {
        key: 'cfgScale',
        label: '引导系数',
        type: 'number',
        min: 0,
        max: 20,
        step: 0.5,
        default: 7.5,
      },
    ],
  },
  'StableDiffusion:stable-diffusion-v1-6': {
    client: 'STABILITY_IMAGE',
    sizeMode: 'pixel',
    sizes: ['512x512', '768x768', '1024x1024'],
    custom: { min: 320, max: 1536, step: 64 },
    promptMax: PROMPT_MAX,
    negativePrompt: false,
    reference: { max: 0 },
    advanced: STABILITY_ADVANCED,
  },
  // Seedream 5.0 flash：本期只开放已实测的 2K 文生图；参考图、其它档位未实测，暂不开放
  'DouBao:doubao-seedream-5-0-flash-260915': {
    ...SEEDREAM_BASE,
    tiers: ['2K'],
    promptMax: 1000,
    reference: { max: 0 },
    guide: SEEDREAM_BASE.guide?.slice(1), // 不开放参考图：去掉参考图的写法建议
  },
  'DouBao:doubao-seedream-5-0-260128': {
    ...SEEDREAM_BASE,
    tiers: ['2K', '3K'],
    promptMax: 1000,
    reference: { max: 10, maxMb: 10, accept: IMAGE_ACCEPT },
  },
  'DouBao:doubao-seedream-4-5-251128': {
    ...SEEDREAM_BASE,
    tiers: ['2K', '4K'],
    promptMax: 800,
    reference: { max: 10, maxMb: 5, accept: IMAGE_ACCEPT },
  },
  'DouBao:doubao-seedream-4-0-250828': {
    ...SEEDREAM_BASE,
    tiers: ['1K', '2K', '4K'],
    promptMax: 800,
    reference: { max: 10, maxMb: 5, accept: IMAGE_ACCEPT },
  },
};

/** 未登记的模型标识：按平台保守能力（仅文生图、无参考图）；DouBao 没有默认客户端，不可选 */
export const PLATFORM_FALLBACK: Record<string, ImageModelCapability | null> = {
  [AiImagePlatformEnum.OPENAI]: {
    client: 'OPENAI_IMAGE',
    sizeMode: 'fixed',
    sizes: ['1024x1024'],
    promptMax: PROMPT_MAX,
    negativePrompt: false,
    reference: { max: 0 },
  },
  [AiImagePlatformEnum.TONG_YI]: {
    client: 'DASHSCOPE_IMAGE',
    sizeMode: 'fixed',
    sizes: ['1024x1024'],
    promptMax: PROMPT_MAX,
    negativePrompt: false,
    reference: { max: 0 },
  },
  [AiImagePlatformEnum.SILICON_FLOW]: {
    client: 'SILICONFLOW_IMAGE',
    sizeMode: 'fixed',
    sizes: ['1024x1024'],
    promptMax: PROMPT_MAX,
    negativePrompt: false,
    reference: { max: 0 },
  },
  [AiImagePlatformEnum.STABLE_DIFFUSION]: {
    client: 'STABILITY_IMAGE',
    sizeMode: 'fixed',
    sizes: ['1024x1024'],
    promptMax: PROMPT_MAX,
    negativePrompt: false,
    reference: { max: 0 },
  },
  [AiImagePlatformEnum.DOU_BAO]: null,
};

/** 未登记的豆包模型的不可用说明 */
export const DOU_BAO_UNREGISTERED =
  '未登记的豆包图片模型：只有登记的 Seedream 版本可用';

/** 获得模型能力；null 表示不可选 */
export function getImageModelCapability(
  platform: string,
  model: string,
): ImageModelCapability | null {
  const capability = IMAGE_MODEL_CAPABILITIES[`${platform}:${model}`];
  if (capability) {
    return capability;
  }
  return PLATFORM_FALLBACK[platform] ?? null;
}

/** 是否为 AI 绘图支持的平台（其它平台不出现在模型下拉） */
export function isImagePlatform(platform: string) {
  return (
    platform === AiImagePlatformEnum.MIDJOURNEY || platform in PLATFORM_FALLBACK
  );
}

/** 尺寸 宽x高 换算为最简比例，例如 1792x1024 → 7:4 */
export function getSizeRatio(width: number, height: number) {
  if (!width || !height) {
    return '';
  }
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

/** 解析 宽x高 */
export function parseSize(size: string) {
  const [width, height] = size.split('x').map(Number);
  return { width: width as number, height: height as number };
}

// ========== Midjourney ==========

/** 按版本的参数门禁：为空表示不显示、不发送 */
export interface MjVersion {
  key: string;
  name: string;
  flag: string; // 版本参数，例如 --v 7
  badge: string;
  quality: number[]; // --q 可选值
  iw?: { default: number; max: number; min: number }; // --iw 范围
  raw: boolean; // --raw
  hd: boolean; // --hd（V8 系列）
  cref: boolean; // --cref / --cw（旧版角色参考）
  sref: boolean; // --sref / --sw
  sv?: { default: number; max: number; min: number }; // --sv 范围；Niji 7 只有 4
  omni: boolean; // V7 Omni Reference（中转未适配，禁用展示）
  edit: boolean; // V8 Edit（中转未适配，禁用展示）
  why?: Record<string, string>; // 不显示的原因
}

export const MJ_VERSIONS: MjVersion[] = [
  {
    key: 'v8.2',
    name: 'Midjourney V8.2',
    flag: '--v 8.2',
    badge: '官方当前默认',
    quality: [],
    raw: true,
    hd: true,
    cref: false,
    sref: true,
    omni: false,
    edit: true,
    why: { iw: '官方图片权重表未单列 V8.2：暂不暴露，按默认权重 1 图生图' },
  },
  {
    key: 'v8.1',
    name: 'Midjourney V8.1',
    flag: '--v 8.1',
    badge: 'V8 系列',
    quality: [],
    iw: { min: 0, max: 3, default: 1 },
    raw: true,
    hd: true,
    cref: false,
    sref: true,
    omni: false,
    edit: true,
  },
  {
    key: 'v7',
    name: 'Midjourney V7',
    flag: '--v 7',
    badge: '应用默认',
    quality: [1, 2, 4],
    iw: { min: 0, max: 3, default: 1 },
    raw: true,
    hd: false,
    cref: false,
    sref: true,
    sv: { min: 1, max: 6, default: 6 },
    omni: true,
    edit: false,
  },
  {
    key: 'v6.1',
    name: 'Midjourney V6.1',
    flag: '--v 6.1',
    badge: '支持角色参考',
    quality: [0.5, 1, 2],
    raw: true,
    hd: false,
    cref: true,
    sref: true,
    sv: { min: 1, max: 4, default: 4 },
    omni: false,
    edit: false,
    why: {
      iw: '官方未单列 V6.1 的图片权重范围：暂不暴露，按默认权重 1 图生图',
    },
  },
  {
    key: 'niji7',
    name: 'Niji 7',
    flag: '--niji 7',
    badge: '二次元',
    quality: [],
    iw: { min: 0, max: 2, default: 1 },
    raw: false,
    hd: false,
    cref: false,
    sref: true,
    sv: { min: 4, max: 4, default: 4 },
    omni: false,
    edit: false,
    why: {
      raw: 'Niji 7 未给出 RAW 规则：暂不暴露',
      quality: 'Niji 7 未给出 --q 取值：暂不暴露',
      cref: 'Niji 7 官方明确不支持 --cref',
    },
  },
  {
    key: 'niji6',
    name: 'Niji 6',
    flag: '--niji 6',
    badge: '支持角色参考',
    quality: [],
    raw: false,
    hd: false,
    cref: true,
    sref: true,
    omni: false,
    edit: false,
    why: {
      iw: '官方图片权重表未单列 Niji 6：暂不暴露，按默认权重 1 图生图',
      raw: 'Niji 6 的 RAW 规则未明确：暂不暴露',
      quality: '官方画质表未列 Niji：暂不暴露',
    },
  },
];

/** 应用默认版本（与 GeekAI 基线一致）；官方默认 V8.2，改默认需真实中转验收 */
export const MJ_DEFAULT_VERSION = 'v7';

export function getMjVersion(key?: string): MjVersion {
  return (
    MJ_VERSIONS.find((item) => item.key === key) ||
    (MJ_VERSIONS.find((item) => item.key === MJ_DEFAULT_VERSION) as MjVersion)
  );
}

/** 按版本参数反查版本；用于重新生成回填 */
export function getMjVersionByFlag(flag?: string) {
  return MJ_VERSIONS.find((item) => item.flag === flag);
}

/** 中转适配能力：只有已实现的接口可用 */
export const MJ_ADAPTER = {
  omniReference: {
    enabled: false,
    reason: '中转适配未实现 --oref 上传与校验，暂不可用',
  },
  edit: {
    enabled: false,
    reason:
      'V8 Edit 是独立的编辑流程（--edit，最多 4 张），与局部重绘、换脸不同；中转适配未实现',
  },
  modalProtocol: 'ACTION_THEN_MODAL',
};

/** MJ 子模式 */
export const MJ_MODES = [
  { mode: AiImageModeEnum.MIDJOURNEY_IMAGINE, name: '文生图', images: [0, 0] },
  { mode: AiImageModeEnum.MIDJOURNEY_IMAGE, name: '图生图', images: [1, 5] },
  { mode: AiImageModeEnum.MIDJOURNEY_BLEND, name: '融图', images: [2, 5] },
  { mode: AiImageModeEnum.MIDJOURNEY_SWAP_FACE, name: '换脸', images: [2, 2] },
  {
    mode: AiImageModeEnum.MIDJOURNEY_CONSISTENCY,
    name: '一致性',
    images: [0, 0],
  },
];

export const MJ_RATIOS = [
  '1:1',
  '1:2',
  '2:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '16:9',
  '9:16',
];

export const MJ_BLEND_DIMENSIONS = [
  { value: 'PORTRAIT', label: '竖图 2:3' },
  { value: 'SQUARE', label: '方图 1:1' },
  { value: 'LANDSCAPE', label: '横图 3:2' },
];

export const MJ_IMAGE_MAX_MB = 10; // MJ 输入图片的单张上限
export const MJ_IMAGE_ACCEPT = ['png', 'jpg', 'jpeg', 'webp']; // MJ 输入图片的文件后缀

/** MJ 提示词预览：与后端 AiImageServiceImpl#buildMidjourneyPrompt 拼接规则一致 */
export function buildMidjourneyPrompt(req: {
  aspectRatio: string;
  characterWeight?: number;
  chaos?: number;
  crefUrl?: string;
  hd?: boolean;
  imageWeight?: number;
  negativePrompt?: string;
  prompt: string;
  quality?: number;
  raw?: boolean;
  referenceImageUrls?: string[];
  seed?: number;
  srefUrl?: string;
  styleVersion?: number;
  styleWeight?: number;
  stylize?: number;
  tile?: boolean;
  version: string;
}) {
  const isPresent = (value: any) =>
    value !== undefined && value !== null && value !== '';
  const parts: string[] = [(req.prompt || '').trim()];
  if (!(req.prompt || '').toLowerCase().includes('--ar ')) {
    parts.push(`--ar ${req.aspectRatio}`);
  }
  parts.push(req.version);
  if (isPresent(req.quality)) parts.push(`--q ${req.quality}`);
  if (req.tile) parts.push('--tile');
  if (req.raw) parts.push('--raw');
  if (req.hd) parts.push('--hd');
  if (isPresent(req.chaos)) parts.push(`--c ${req.chaos}`);
  if (isPresent(req.stylize)) parts.push(`--s ${req.stylize}`);
  if (isPresent(req.seed) && (req.seed as number) >= 0) {
    parts.push(`--seed ${req.seed}`);
  }
  if (req.referenceImageUrls?.length && isPresent(req.imageWeight)) {
    parts.push(`--iw ${req.imageWeight}`);
  }
  if (req.crefUrl) {
    parts.push(`--cref ${req.crefUrl}`);
    if (isPresent(req.characterWeight)) {
      parts.push(`--cw ${req.characterWeight}`);
    }
  }
  if (req.srefUrl) {
    parts.push(`--sref ${req.srefUrl}`);
    if (isPresent(req.styleWeight)) parts.push(`--sw ${req.styleWeight}`);
    if (isPresent(req.styleVersion)) parts.push(`--sv ${req.styleVersion}`);
  }
  if (req.negativePrompt?.trim()) {
    parts.push(`--no ${req.negativePrompt.trim()}`);
  }
  return parts.join(' ');
}

/** MJ 按钮：U/V 宫格与其它按钮分组；CustomZoom 本期隐藏，Inpaint 打开局部重绘 */
export function isMjGridButton(customId: string) {
  return /::(?:upsample|variation)::[1-4]::/.test(customId);
}

export function isMjHiddenButton(customId: string) {
  return customId.includes('CustomZoom');
}

export function isMjInpaintButton(customId: string) {
  return customId.includes('Inpaint');
}
