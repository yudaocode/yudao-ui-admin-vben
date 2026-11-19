import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace AiOcrApi {
  /** AI 文字识别记录 */
  export interface Ocr {
    id: number; // 编号
    userId?: number; // 用户编号，仅管理端有值
    userNickname?: string; // 用户昵称，仅管理端有值
    modelId: number; // 模型编号
    modelName?: string; // 模型名字
    platform: string; // 平台
    model?: string; // 模型标识
    fileName: string; // 图片文件名
    imageUrl: string; // 图片地址
    status: number; // 识别状态，参见 AiOcrStatusEnum
    originalText?: null | string; // 识别出的原文
    errorMessage?: string; // 失败原因
    duration?: number; // 识别耗时，单位：毫秒
    createTime: Date; // 创建时间
    updateTime: Date; // 更新时间
  }

  /** AI 文字识别模型：不包含密钥 */
  export interface OcrModel {
    id: number; // 编号
    name: string; // 模型名字
    platform: string; // 平台
    model?: string; // 模型标识
    description?: string; // 模型简介
  }

  /** AI 文字识别 */
  export interface RecognizeReq {
    modelId: number; // 模型编号
    fileUrl: string; // 图片地址，先上传到文件服务
  }
}

const RECOGNIZE_TIMEOUT = 2 * 60 * 1000; // 同步识别，超时时间放宽到 2 分钟

/** 获得可用的文字识别模型列表 */
export function getOcrModelList() {
  return requestClient.get<AiOcrApi.OcrModel[]>('/ai/ocr/model-list');
}

/** 识别图片中的文字：图片先上传到文件服务，同步返回识别记录，成功、失败都会新增一条记录 */
export function recognizeOcr(data: AiOcrApi.RecognizeReq) {
  return requestClient.post<AiOcrApi.Ocr>('/ai/ocr/recognize', data, {
    timeout: RECOGNIZE_TIMEOUT,
  });
}

/** 获得【我的】识别记录分页 */
export function getOcrMyPage(params: PageParam) {
  return requestClient.get<PageResult<AiOcrApi.Ocr>>('/ai/ocr/my-page', {
    params,
  });
}

/** 获得【我的】识别记录 */
export function getOcrMy(id: number) {
  return requestClient.get<AiOcrApi.Ocr>(`/ai/ocr/get-my?id=${id}`);
}

/** 删除【我的】识别记录 */
export function deleteOcrMy(id: number) {
  return requestClient.delete<boolean>(`/ai/ocr/delete-my?id=${id}`);
}

// ================ 文字识别管理 ================

/** 获得识别记录分页 */
export function getOcrPage(params: PageParam) {
  return requestClient.get<PageResult<AiOcrApi.Ocr>>('/ai/ocr/page', {
    params,
  });
}

/** 获得识别记录：不存在时返回空 */
export function getOcr(id: number) {
  return requestClient.get<AiOcrApi.Ocr | null>(`/ai/ocr/get?id=${id}`);
}

/** 删除识别记录 */
export function deleteOcr(id: number) {
  return requestClient.delete<boolean>(`/ai/ocr/delete?id=${id}`);
}
