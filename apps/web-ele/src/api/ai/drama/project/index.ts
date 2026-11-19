import type { PageParam, PageResult } from '@vben/request';

import type { AiDramaAssetApi } from '#/api/ai/drama/asset';
import type { AiDramaScriptApi } from '#/api/ai/drama/script';
import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';

import { requestClient } from '#/api/request';

export namespace AiDramaProjectApi {
  /** AI 短剧项目 */
  export interface Project {
    id: number; // 编号
    userId: number; // 用户编号
    userNickname?: string; // 用户昵称
    name: string; // 项目名称
    description?: string; // 项目简介
    idea?: string; // 故事想法
    style?: number; // 画风，参见 AiDramaStyleEnum
    aestheticSkillId?: number; // 美学技能编号
    directorSkillId?: number; // 导演技能编号
    storyboardSkillIds?: number[]; // 分镜技能编号，按顺序生效
    status: number; // 项目状态，参见 AiDramaProjectStatusEnum
    publicStatus: boolean; // 是否公开
    composeAspectRatio?: string; // 画幅：生成镜头视频、成片使用
    composeTransitionType?: number; // 转场类型，参见 AiDramaTransitionTypeEnum
    composeTransitionDurationSeconds?: number; // 转场时长（秒）
    composeStatus?: number; // 成片状态，参见 AiDramaStatusEnum；为空表示未合成
    composeProgress?: number; // 合成进度（0-100）
    composeFileUrl?: string; // 成片地址
    composeDuration?: number; // 成片时长（秒）
    composeStoryboardCount?: number; // 成片镜头数：成片实际拼接的
    composeErrorMessage?: string; // 合成失败原因
    composeFinishTime?: Date; // 成片完成时间
    composeStale?: boolean; // 成片是否待重新合成：实际合成输入（参与的镜头视频、镜头增删）已变化；只在项目详情返回
    composeStaleReason?: string; // 待重新合成的原因，例如「镜头视频已更换」
    storyboardCount?: number; // 镜头数
    storyboardSuccessCount?: number; // 视频已完成的镜头数
    createTime?: Date; // 创建时间
    updateTime?: Date; // 更新时间
  }

  /** AI 短剧项目创建 / 修改 Request */
  export interface SaveReq {
    id?: number;
    name: string;
    description?: string;
    idea?: string;
    style?: number;
    aestheticSkillId?: number;
    directorSkillId?: number;
    storyboardSkillIds?: number[];
    composeAspectRatio?: string;
  }

  /** AI 短剧公开项目 */
  export interface Public {
    id: number;
    name: string;
    style?: number; // 画风，参见 AiDramaStyleEnum
    aspectRatio?: string; // 画幅：成片实际使用的
    composeFileUrl: string;
    composeDuration?: number;
    userId: number;
    userNickname?: string;
    owner: boolean; // 是否本人的项目
    updateTime?: Date;
    storyboardCount?: number; // 镜头数：成片实际拼接的
    outline?: string; // 剧情大纲（详情）
    characters?: { imageUrl?: string; name: string }[]; // 角色（详情）
  }

  /** AI 短剧合成成片 Request */
  export interface ComposeReq {
    projectId: number;
    storyboardIds: number[]; // 镜头，按播放顺序
    aspectRatio: string;
    transitionType: number; // 转场类型，参见 AiDramaTransitionTypeEnum
    transitionDuration?: number;
    narrationAudioId?: number;
    watermarkText?: string;
  }

  /** AI 短剧项目详情：工作台、管理端只读查看 */
  export interface ProjectDetail {
    project: Project;
    script?: AiDramaScriptApi.Script;
    characters: AiDramaAssetApi.Character[];
    locations: AiDramaAssetApi.Location[];
    visualAssets: AiDramaAssetApi.VisualAsset[]; // 道具、关键帧，以及它们的历史版本
    audios: AiDramaAssetApi.Audio[]; // 不属于角色的音频：旁白、配乐、参考音频等
    motionReferences: AiDramaAssetApi.MotionReference[]; // 动作参考视频
    storyboards: AiDramaStoryboardApi.Storyboard[];
  }
}

// ========== 项目：我的 ==========

/** 创建项目 */
export function createDramaProject(data: AiDramaProjectApi.SaveReq) {
  return requestClient.post<number>('/ai/drama/project/create', data);
}

/** 修改【我的】项目 */
export function updateDramaProjectMy(data: AiDramaProjectApi.SaveReq) {
  return requestClient.put<boolean>('/ai/drama/project/update-my', data);
}

/** 删除【我的】项目 */
export function deleteDramaProjectMy(id: number) {
  return requestClient.delete<boolean>(`/ai/drama/project/delete-my?id=${id}`);
}

/** 获得【我的】项目分页 */
export function getDramaProjectMyPage(params: PageParam) {
  return requestClient.get<PageResult<AiDramaProjectApi.Project>>(
    '/ai/drama/project/my-page',
    { params },
  );
}

/** 获得【我的】项目详情 */
export function getDramaProjectDetailMy(id: number) {
  return requestClient.get<AiDramaProjectApi.ProjectDetail>(
    `/ai/drama/project/get-detail-my?id=${id}`,
  );
}

/** 合成成片 */
export function composeDramaProject(data: AiDramaProjectApi.ComposeReq) {
  return requestClient.post<boolean>('/ai/drama/project/compose', data);
}

// ========== 项目：公开广场 ==========

/** 获得公开项目分页 */
export function getDramaProjectPublicPage(params: PageParam) {
  return requestClient.get<PageResult<AiDramaProjectApi.Public>>(
    '/ai/drama/project/public-page',
    { params },
  );
}

/** 获得公开项目详情 */
export function getDramaProjectPublicDetail(id: number) {
  return requestClient.get<AiDramaProjectApi.Public>(
    `/ai/drama/project/public-detail?id=${id}`,
  );
}

// ========== 项目：管理 ==========

/** 获得项目分页 */
export function getDramaProjectPage(params: PageParam) {
  return requestClient.get<PageResult<AiDramaProjectApi.Project>>(
    '/ai/drama/project/page',
    { params },
  );
}

/** 获得项目详情 */
export function getDramaProjectDetail(id: number) {
  return requestClient.get<AiDramaProjectApi.ProjectDetail>(
    `/ai/drama/project/get-detail?id=${id}`,
  );
}

/** 修改项目是否公开 */
export function updateDramaProjectPublicStatus(
  id: number,
  publicStatus: boolean,
) {
  return requestClient.put<boolean>('/ai/drama/project/update-public', {
    id,
    publicStatus,
  });
}

/** 删除项目 */
export function deleteDramaProject(id: number) {
  return requestClient.delete<boolean>(`/ai/drama/project/delete?id=${id}`);
}
