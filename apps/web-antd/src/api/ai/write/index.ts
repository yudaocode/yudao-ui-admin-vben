import type { PageParam, PageResult } from '@vben/request';

import type { AiWriteTypeEnum } from '#/utils/constants';

import { fetchEventSource } from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/api/request';

const accessStore = useAccessStore();
export namespace AiWriteApi {
  export interface WriteVO {
    type: AiWriteTypeEnum.REPLY | AiWriteTypeEnum.WRITING; // 1:撰写 2:回复
    prompt: string; // 写作内容提示 1。撰写 2回复
    originalContent: string; // 原文
    length: number; // 长度
    format: number; // 格式
    tone: number; // 语气
    language: number; // 语言
    userId?: number; // 用户编号
    platform?: string; // 平台
    model?: string; // 模型
    generatedContent?: string; // 生成的内容
    errorMessage?: string; // 错误信息
    createTime?: Date; // 创建时间
  }

  export interface AiWritePageReqVO extends PageParam {
    userId?: number; // 用户编号
    type?: AiWriteTypeEnum; //  写作类型
    platform?: string; // 平台
    createTime?: [string, string]; // 创建时间
  }

  export interface AiWriteRespVo {
    id: number;
    userId: number;
    type: number;
    platform: string;
    model: string;
    prompt: string;
    generatedContent: string;
    originalContent: string;
    length: number;
    format: number;
    tone: number;
    language: number;
    errorMessage: string;
    createTime: string;
  }
}

export function writeStream(
  data: any,
  onClose: any,
  onMessage: any,
  onError: any,
  ctrl: any,
) {
  const token = accessStore.accessToken;
  return fetchEventSource(
    `${import.meta.env.VITE_BASE_URL}/ai/write/generate-stream`,
    {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      openWhenHidden: true,
      body: JSON.stringify(data),
      onmessage: onMessage,
      onerror: onError,
      onclose: onClose,
      signal: ctrl.signal,
    },
  );
}

// 获取写作列表
export function getWritePage(params: any) {
  return requestClient.get<PageResult<AiWriteApi.AiWritePageReqVO>>(
    `/ai/write/page`,
    { params },
  );
}

// 删除音乐
export function deleteWrite(id: number) {
  return requestClient.delete(`/ai/write/delete`, { params: { id } });
}
