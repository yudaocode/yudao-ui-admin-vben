import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace AiSpeechApi {
  /** AI 语音 */
  export interface Speech {
    id: number; // 编号
    userId: number; // 用户编号
    userNickname?: string; // 用户昵称，仅管理侧有值
    modelId: number; // 模型编号
    platform: string; // 平台
    model: string; // 模型标识
    inputText: string; // 朗读文本
    voice: string; // 音色
    format: string; // 音频格式
    speed?: number; // 语速，为空时为 1
    status: number; // 状态，参见 AiSpeechStatusEnum
    audioUrl?: string; // 音频地址
    audioSize?: number; // 音频大小（字节）
    errorMessage?: string; // 失败原因
    createTime: Date; // 创建时间
    finishTime?: Date; // 完成时间
  }

  /** AI 语音生成 */
  export interface GenerateReq {
    modelId: number; // 模型编号
    inputText: string; // 朗读文本
    voice: string; // 音色
    format: string; // 音频格式
    speed?: number; // 语速，不传时为 1
  }
}

/** 生成语音 */
export function generateSpeech(data: AiSpeechApi.GenerateReq) {
  return requestClient.post<number>('/ai/speech/generate', data);
}

/** 获得【我的】语音分页 */
export function getSpeechMyPage(params: PageParam) {
  return requestClient.get<PageResult<AiSpeechApi.Speech>>(
    '/ai/speech/my-page',
    { params },
  );
}

/** 获得【我的】语音：生成中的会同步一次结果 */
export function getSpeechMy(id: number) {
  return requestClient.get<AiSpeechApi.Speech>(`/ai/speech/get-my?id=${id}`);
}

/** 删除【我的】语音 */
export function deleteSpeechMy(id: number) {
  return requestClient.delete<boolean>(`/ai/speech/delete-my?id=${id}`);
}

/** 获得语音分页（管理端） */
export function getSpeechPage(params: PageParam) {
  return requestClient.get<PageResult<AiSpeechApi.Speech>>('/ai/speech/page', {
    params,
  });
}

/** 获得语音（管理端）：不存在时返回空 */
export function getSpeech(id: number) {
  return requestClient.get<AiSpeechApi.Speech | null>(
    `/ai/speech/get?id=${id}`,
  );
}

/** 删除语音（管理端） */
export function deleteSpeech(id: number) {
  return requestClient.delete<boolean>(`/ai/speech/delete?id=${id}`);
}
