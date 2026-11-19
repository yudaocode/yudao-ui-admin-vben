/**
 * AI 短剧：画幅、转场等选项，候选图、时长、任务状态用的工具方法
 */
import type { AiDramaAssetApi } from '#/api/ai/drama/asset';
import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import {
  AiDramaProjectStatusEnum,
  AiDramaStepEnum,
  AiDramaVisualAssetKindEnum,
  isAiDramaRunning,
} from '@vben/constants';

/** 画幅 */
export const DRAMA_ASPECT_RATIOS = ['9:16', '16:9', '1:1', '3:4', '4:3'];

/** 转场：与后端 AiDramaTransitionTypeEnum 一致 */
export const DRAMA_TRANSITION_NONE = 0;
export const DRAMA_TRANSITIONS = [
  { label: '无', value: DRAMA_TRANSITION_NONE },
  { label: '溶解', value: 1 },
  { label: '黑场淡入淡出', value: 2 },
  { label: '滑动', value: 3 },
];

/** 公开广场的时长筛选 */
export const DRAMA_DURATION_TYPES = [
  { label: '30 秒内', value: 1 },
  { label: '30-60 秒', value: 2 },
  { label: '1 分钟以上', value: 3 },
];

/** 获得选用的候选图；未选用时为空 */
export function getSelectedImageUrl(
  imageUrls?: string[],
  selectedIndex?: number,
) {
  if (
    !imageUrls?.length ||
    selectedIndex === undefined ||
    selectedIndex === null
  ) {
    return undefined;
  }
  return imageUrls[selectedIndex];
}

/** 获得当前的道具：不含历史版本 */
export function getDramaProps(visualAssets?: AiDramaAssetApi.VisualAsset[]) {
  return (visualAssets || []).filter(
    (item) =>
      item.kind === AiDramaVisualAssetKindEnum.PROP && !item.parentId,
  );
}

/** 获得镜头的当前关键帧 */
export function getDramaStoryboardFrame(
  visualAssets: AiDramaAssetApi.VisualAsset[],
  storyboardId: number,
) {
  return visualAssets.find(
    (item) =>
      item.kind === AiDramaVisualAssetKindEnum.SHOT_FRAME &&
      !item.parentId &&
      item.storyboardId === storyboardId,
  );
}

/** 是否有历史版本：可撤销 */
export function hasDramaArchive(
  visualAssets: AiDramaAssetApi.VisualAsset[],
  id: number,
) {
  return visualAssets.some((item) => item.parentId === id);
}

/**
 * 进入项目时的工作台步骤：步骤只在前端，按项目的进度推断
 *
 * 没有剧本时为故事想法；剧本已修改时为剧本审阅；没有分镜时为资产配置；否则为分镜与成片
 */
export function getDramaStep(detail: AiDramaProjectApi.ProjectDetail) {
  if (!detail.script?.content) {
    return AiDramaStepEnum.IDEA;
  }
  if (detail.project.status === AiDramaProjectStatusEnum.SCRIPT_CHANGED) {
    return AiDramaStepEnum.SCRIPT;
  }
  if (detail.storyboards.length === 0) {
    return detail.characters.length > 0 || detail.locations.length > 0
      ? AiDramaStepEnum.ASSET
      : AiDramaStepEnum.SCRIPT;
  }
  return AiDramaStepEnum.STORYBOARD;
}

/** 格式化时长：秒 → m:ss */
export function formatDramaDuration(seconds?: number) {
  if (seconds === undefined || seconds === null) {
    return '-';
  }
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** 项目详情中是否有生成中的任务：出图、镜头视频、成片 */
export function hasDramaRunning(detail?: AiDramaProjectApi.ProjectDetail) {
  if (!detail) {
    return false;
  }
  return (
    isAiDramaRunning(detail.project.composeStatus) ||
    detail.characters.some((character) =>
      character.appearances.some((item) => isAiDramaRunning(item.status)),
    ) ||
    detail.locations.some((item) => isAiDramaRunning(item.status)) ||
    detail.visualAssets.some((item) => isAiDramaRunning(item.status)) ||
    detail.storyboards.some((item) => isAiDramaRunning(item.videoStatus))
  );
}
