import { requestClient } from '#/api/request';

export namespace ImFacePackApi {
  /** 用户端表情包项（精简版） */
  export interface FacePackUserItem {
    id: number;
    url: string;
    name?: string;
    width: number;
    height: number;
  }

  /** 用户端表情包 + 嵌套 items */
  export interface FacePackUser {
    id: number;
    name: string;
    icon?: string;
    items: FacePackUserItem[];
  }
}

/** 拉取所有启用的系统表情包（含表情列表） */
export function getFacePackList() {
  return requestClient.get<ImFacePackApi.FacePackUser[]>('/im/face-pack/list');
}
