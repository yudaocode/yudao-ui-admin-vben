import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace AiImageApi {
  /** 绘图 */
  export interface Image {
    id: number; // 编号
    userId?: number; // 用户编号；公开画廊不返回
    platform: string; // 平台
    mode: number; // 生成方式，参见 AiImageModeEnum
    modelId?: number; // 模型编号
    model: string; // 模型
    apiKeyId?: number; // API 密钥编号；公开画廊不返回
    prompt: string; // 提示词
    negativePrompt?: string; // 不希望出现的内容
    inputImages?: ImageInput[]; // 输入图片
    width: number; // 图片宽度
    height: number; // 图片高度
    status: number; // 状态
    progress: number; // 进度
    publicStatus: boolean; // 公开状态
    picUrl: string; // 图片地址
    errorMessage?: string; // 错误信息；公开画廊不返回
    options?: ImageOptions; // 通用模型的绘制参数
    midjourneyOptions?: ImageMidjourneyOptions; // Midjourney 的绘制参数
    seedreamOptions?: ImageSeedreamOptions; // Seedream 的绘制参数
    taskId?: string; // 上游任务编号；公开画廊不返回
    parentId?: number; // 来源记录编号
    children?: Image[]; // 派生记录；只在详情返回
    createTime: Date; // 创建时间
    finishTime?: Date; // 完成时间
  }

  /** 输入图片 */
  export interface ImageInput {
    role: string; // 角色，参见 AiImageInputRoleEnum
    url: string; // 图片地址
  }

  /** 通用模型的绘制参数 */
  export interface ImageOptions {
    quality?: string;
    aspectRatio?: string;
    seed?: number;
    steps?: number;
    cfgScale?: number;
    sampler?: string;
    stylePreset?: string;
    clipGuidancePreset?: string;
    style?: string;
    [key: string]: any;
  }

  /** Midjourney 的绘制参数 */
  export interface ImageMidjourneyOptions {
    version?: string;
    aspectRatio?: string;
    quality?: number;
    stylize?: number;
    chaos?: number;
    seed?: number;
    tile?: boolean;
    raw?: boolean;
    hd?: boolean;
    imageWeight?: number;
    characterWeight?: number;
    styleWeight?: number;
    styleVersion?: number;
    dimensions?: string;
    customId?: string;
    finalPrompt?: string;
    buttons?: ImageMidjourneyButton[];
    actionLabel?: string;
    providerStatus?: string;
    modalProtocol?: string;
    legacy?: boolean;
    [key: string]: any;
  }

  /** Seedream 的绘制参数 */
  export interface ImageSeedreamOptions {
    size?: string;
    optimizePromptMode?: string;
    watermark?: boolean;
    resultSize?: string;
    usage?: Record<string, any>;
    errorCode?: string;
  }

  /** Midjourney 按钮 */
  export interface ImageMidjourneyButton {
    customId: string; // MJ::JOB::upsample::1::85a4b4c1-8835-46c5-a15c-aea34fad1862 动作标识
    emoji: string; // 图标 emoji
    label: string; // Make Variations 文本
    type?: string; // 类型
    style: number | string; // 样式: 2（Primary）、3（Green）
  }

  /** 绘图（通用模型、Seedream）Request VO */
  export interface ImageDrawReqVO {
    modelId: number; // 模型编号
    prompt: string; // 提示词
    negativePrompt?: string; // 不希望出现的内容
    referenceImageUrls?: string[]; // 参考图地址数组
    width?: number; // 图片宽度
    height?: number; // 图片高度
    sizeLevel?: string; // 尺寸档位（Seedream）
    aspectRatio?: string; // 比例（只用于回填）
    quality?: string; // 画质（OpenAI）
    seed?: number; // 随机种子
    steps?: number; // 推理步数
    cfgScale?: number; // 引导系数
    sampler?: string; // 采样器（Stability）
    stylePreset?: string; // 风格预设（Stability）
    clipGuidancePreset?: string; // CLIP 引导（Stability）
  }

  /** Midjourney 文生图、图生图、一致性 Request VO */
  export interface ImageMidjourneyImagineReqVO {
    modelId: number; // 模型编号
    mode: number; // 生成方式：20 文生图、21 图生图、24 一致性
    prompt: string; // 提示词
    negativePrompt?: string; // 不希望出现的内容（拼接为 --no）
    version: string; // 版本参数，例如 --v 7
    aspectRatio: string; // 比例
    quality?: number; // 画质 --q
    stylize?: number; // 风格化 --s
    chaos?: number; // 创意度 --c
    seed?: number; // 随机种子 --seed，-1 表示随机
    tile?: boolean; // 平铺 --tile
    raw?: boolean; // RAW --raw
    hd?: boolean; // HD --hd
    referenceImageUrls?: string[]; // 参考图地址数组（图生图 1-5 张）
    imageWeight?: number; // 图片权重 --iw
    crefUrl?: string; // 角色参考图地址 --cref
    characterWeight?: number; // 角色权重 --cw
    srefUrl?: string; // 风格参考图地址 --sref
    styleWeight?: number; // 风格权重 --sw
    styleVersion?: number; // 风格版本 --sv
  }

  /** Midjourney 融图 Request VO */
  export interface ImageMidjourneyBlendReqVO {
    modelId: number; // 模型编号
    imageUrls: string[]; // 融图图片地址数组（2-5 张）
    dimensions: string; // 融图尺寸：PORTRAIT、SQUARE、LANDSCAPE
  }

  /** Midjourney 换脸 Request VO */
  export interface ImageMidjourneySwapFaceReqVO {
    modelId: number; // 模型编号
    sourceUrl: string; // 来源脸图片地址
    targetUrl: string; // 目标图片地址
  }

  /** Midjourney 按钮动作 Request VO */
  export interface ImageMidjourneyActionReqVO {
    id: number; // 图片编号
    customId: string; // MJ::JOB::upsample::1::85a4b4c1-8835-46c5-a15c-aea34fad1862 动作标识
  }

  /** Midjourney 局部重绘 Request VO */
  export interface ImageMidjourneyModalReqVO {
    id: number; // 来源图片编号
    prompt: string; // 重绘提示词
    maskUrl: string; // 蒙版图片地址（黑底，白色为重绘区域）
  }
}

/** 获取【我的】绘图分页 */
export function getImagePageMy(params: PageParam) {
  return requestClient.get<PageResult<AiImageApi.Image>>('/ai/image/my-page', {
    params,
  });
}

/** 获取公开的绘图分页 */
export function getImagePagePublic(params: PageParam) {
  return requestClient.get<PageResult<AiImageApi.Image>>(
    '/ai/image/public-page',
    { params },
  );
}

/** 获取公开的绘图详情 */
export function getImagePublic(id: number) {
  return requestClient.get<AiImageApi.Image>(`/ai/image/get-public?id=${id}`);
}

/** 获取【我的】绘图记录 */
export function getImageMy(id: number) {
  return requestClient.get<AiImageApi.Image>(`/ai/image/get-my?id=${id}`);
}

/** 获取【我的】绘图记录列表 */
export function getImageListMyByIds(ids: number[]) {
  return requestClient.get<AiImageApi.Image[]>(`/ai/image/my-list-by-ids`, {
    params: { ids: ids.join(',') },
  });
}

/** 生成图片（通用模型、Seedream） */
export function drawImage(data: AiImageApi.ImageDrawReqVO) {
  return requestClient.post<number>(`/ai/image/draw`, data);
}

/** 生成专业绘画指令 */
export function optimizePrompt(prompt: string) {
  return requestClient.post<string>(`/ai/image/optimize-prompt`, { prompt });
}

/** 删除【我的】绘画记录 */
export function deleteImageMy(id: number) {
  return requestClient.delete(`/ai/image/delete-my?id=${id}`);
}

/** 公开 / 取消公开【我的】绘画记录 */
export function updateImagePublicMy(id: number, publicStatus: boolean) {
  return requestClient.put(`/ai/image/update-public-my`, { id, publicStatus });
}

/** ================ midjourney 专属 ================ */

/** 【Midjourney】文生图、图生图、一致性 */
export function midjourneyImagine(
  data: AiImageApi.ImageMidjourneyImagineReqVO,
) {
  return requestClient.post<number>(`/ai/image/midjourney/imagine`, data);
}

/** 【Midjourney】融图 */
export function midjourneyBlend(data: AiImageApi.ImageMidjourneyBlendReqVO) {
  return requestClient.post<number>(`/ai/image/midjourney/blend`, data);
}

/** 【Midjourney】换脸 */
export function midjourneySwapFace(
  data: AiImageApi.ImageMidjourneySwapFaceReqVO,
) {
  return requestClient.post<number>(`/ai/image/midjourney/swap-face`, data);
}

/** 【Midjourney】Action 操作（二次生成图片） */
export function midjourneyAction(data: AiImageApi.ImageMidjourneyActionReqVO) {
  return requestClient.post<number>(`/ai/image/midjourney/action`, data);
}

/** 【Midjourney】局部重绘 */
export function midjourneyModal(data: AiImageApi.ImageMidjourneyModalReqVO) {
  return requestClient.post<number>(`/ai/image/midjourney/modal`, data);
}

/** ================ 绘图管理 ================ */

/** 查询绘画分页 */
export function getImagePage(params: PageParam) {
  return requestClient.get<PageResult<AiImageApi.Image>>(`/ai/image/page`, {
    params,
  });
}

/** 查询绘画详情 */
export function getImage(id: number) {
  return requestClient.get<AiImageApi.Image>(`/ai/image/get?id=${id}`);
}

/** 更新绘画发布状态 */
export function updateImage(data: { id: number; publicStatus: boolean }) {
  return requestClient.put(`/ai/image/update`, data);
}

/** 删除绘画 */
export function deleteImage(id: number) {
  return requestClient.delete(`/ai/image/delete?id=${id}`);
}
