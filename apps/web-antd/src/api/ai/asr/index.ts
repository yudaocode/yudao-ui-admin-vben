import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace AiAsrApi {
  /** AI 语音识别记录 */
  export interface Asr {
    id: number; // 编号
    userId: number; // 用户编号
    userNickname?: string; // 用户昵称，仅管理端有值
    modelId: number; // 模型编号
    modelName?: string; // 模型名字
    platform: string; // 平台
    model?: string; // 模型标识
    fileName: string; // 音频文件名
    audioUrl: string; // 音频地址
    status: number; // 识别状态，参见 AiAsrStatusEnum
    originalText?: null | string; // 识别出的原文
    errorMessage?: string; // 失败原因
    duration?: number; // 识别耗时，单位：毫秒
    createTime: Date; // 创建时间
    updateTime: Date; // 更新时间
  }

  /** AI 语音识别 */
  export interface RecognizeReq {
    modelId: number; // 模型编号
    fileUrl: string; // 音频地址，先上传到文件服务
  }
}

const RECOGNIZE_TIMEOUT = 2 * 60 * 1000; // 同步识别，超时时间放宽到 2 分钟

/** 识别音频中的语音：音频先上传到文件服务，同步返回识别记录，成功、失败都会新增一条记录 */
export function recognizeAsr(data: AiAsrApi.RecognizeReq) {
  return requestClient.post<AiAsrApi.Asr>('/ai/asr/recognize', data, {
    timeout: RECOGNIZE_TIMEOUT,
  });
}

/** 获得【我的】识别记录分页 */
export function getAsrMyPage(params: PageParam) {
  return requestClient.get<PageResult<AiAsrApi.Asr>>('/ai/asr/my-page', {
    params,
  });
}

/** 获得【我的】识别记录 */
export function getAsrMy(id: number) {
  return requestClient.get<AiAsrApi.Asr>(`/ai/asr/get-my?id=${id}`);
}

/** 删除【我的】识别记录 */
export function deleteAsrMy(id: number) {
  return requestClient.delete<boolean>(`/ai/asr/delete-my?id=${id}`);
}

// ========== 语音识别管理 ==========

/** 获得识别记录分页 */
export function getAsrPage(params: PageParam) {
  return requestClient.get<PageResult<AiAsrApi.Asr>>('/ai/asr/page', {
    params,
  });
}

/** 获得识别记录；不存在（例如已删除）时返回 null */
export function getAsr(id: number) {
  return requestClient.get<AiAsrApi.Asr | null>(`/ai/asr/get?id=${id}`);
}

/** 删除识别记录 */
export function deleteAsr(id: number) {
  return requestClient.delete<boolean>(`/ai/asr/delete?id=${id}`);
}
