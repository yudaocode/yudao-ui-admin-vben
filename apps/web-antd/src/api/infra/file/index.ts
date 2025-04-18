import { requestClient } from '#/api/request';
import type { PageParam, PageResult } from '@vben/request';
import type { AxiosRequestConfig } from '@vben/request';

/** Axios 上传进度事件 */
export type AxiosProgressEvent = AxiosRequestConfig['onUploadProgress'];

export namespace InfraFileApi {
  /** 文件信息 */
  export interface InfraFile {
    id?: number;
    configId?: number;
    path: string;
    name?: string;
    url?: string;
    size?: number;
    type?: string;
    createTime?: Date;
  }

  /** 文件预签名地址 */
  export interface FilePresignedUrlRespVO {
    configId: number; // 文件配置编号
    uploadUrl: string; // 文件上传 URL
    url: string; // 文件 URL
  }

  /** 上传文件 */
  export interface FileUploadReqVO {
    file: File;
    path?: string;
  }
}

/** 查询文件列表 */
export function getFilePage(params: PageParam) {
  return requestClient.get<PageResult<InfraFileApi.InfraFile>>('/infra/file/page', {
    params
  });
}

/** 删除文件 */
export function deleteFile(id: number) {
  return requestClient.delete(`/infra/file/delete?id=${id}`);
}

/** 获取文件预签名地址 */
export function getFilePresignedUrl(path: string) {
  return requestClient.get<InfraFileApi.FilePresignedUrlRespVO>('/infra/file/presigned-url', {
    params: { path }
  });
}

/** 创建文件 */
export function createFile(data: InfraFileApi.InfraFile) {
  return requestClient.post('/infra/file/create', data);
}

/** 上传文件 */
export function uploadFile(data: InfraFileApi.FileUploadReqVO, onUploadProgress?: AxiosProgressEvent) {
  return requestClient.upload('/infra/file/upload', data, { onUploadProgress });
}
