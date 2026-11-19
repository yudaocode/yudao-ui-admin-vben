import { requestClient } from '#/api/request';

/** 同步调用模型生成，超时时间放宽到 5 分钟 */
const GENERATE_TIMEOUT = 5 * 60 * 1000;

export namespace AiDramaAssetApi {
  /** AI 短剧音频 */
  export interface Audio {
    id: number;
    projectId: number;
    characterId?: number;
    type: number; // 参见 AiDramaAudioTypeEnum
    name?: string;
    text?: string;
    voice?: string;
    storyboardId?: number; // 对白所属的分镜
    duration?: number; // 时长（秒）
    fileUrl: string;
    storyboardIds?: number[]; // 使用的分镜：配乐、参考音频；为空表示候选
    volume?: number; // 音量（0-2）
    startOffset?: number; // 起始偏移（秒）
    musicId?: number; // 来源的 AI 音乐编号
    createTime?: Date;
  }

  /** 新增音频 Request */
  export interface AudioCreateReq {
    projectId: number;
    characterId?: number;
    type: number;
    name?: string;
    fileUrl: string;
    duration?: number;
    storyboardIds?: number[];
  }

  /** 修改配乐、参考音频 Request：名称、使用的分镜、音量、起始偏移 */
  export interface AudioUpdateReq {
    id: number;
    name?: string;
    storyboardIds?: number[];
    volume?: number;
    startOffset?: number;
  }

  /** 生成音频 Request */
  export interface AudioGenerateReq {
    projectId: number;
    characterId?: number;
    modelId: number;
    voice?: string;
    text: string;
    speed?: number;
  }

  /** 选用 AI 音乐为配乐 Request */
  export interface AudioMusicReq {
    projectId: number;
    musicId: number;
    storyboardIds?: number[];
  }

  /** 动作参考视频 */
  export interface MotionReference {
    id: number;
    projectId: number;
    name: string;
    fileUrl: string;
    duration?: number; // 时长（秒）
    createTime?: Date;
  }

  /** 新增动作参考 Request */
  export interface MotionReferenceCreateReq {
    projectId: number;
    name: string;
    fileUrl: string;
  }

  /** 角色形象 */
  export interface Appearance {
    id: number;
    characterId: number;
    appearanceIndex: number; // 形象序号，从 0 开始
    changeReason?: string; // 变化原因
    description?: string;
    referenceImageUrl?: string;
    imageUrls?: string[]; // 候选图
    imageDescriptions?: string[]; // 候选图的提示词，与候选图一一对应
    selectedIndex?: number; // 选用的候选图下标
    previousImageUrls?: string[]; // 上一版候选图：不为空时可撤销
    modelId?: number;
    status?: number;
    errorMessage?: string;
    updateTime?: Date;
  }

  /** 角色形象创建 / 修改 Request */
  export interface AppearanceSaveReq {
    id?: number;
    characterId?: number;
    changeReason?: string;
    description?: string;
    referenceImageUrl?: string;
    selectedIndex?: number;
  }

  /** 角色 */
  export interface Character {
    id: number;
    projectId: number;
    name: string;
    aliases?: string; // 别名
    roleLevel?: string; // 角色等级，参见 AiDramaCharacterRoleLevelEnum
    sex?: number;
    ageRange?: string;
    personalityTags?: string[];
    costumeTier?: number; // 服装档次，参见 AiDramaCharacterCostumeTierEnum
    description?: string;
    prompt?: string;
    referenceImageUrl?: string;
    voiceDescription?: string; // 声音描述
    sampleText?: string; // 样音文本
    sampleAudioId?: number; // 选用的样音编号
    appearances: Appearance[];
    audios: Audio[];
  }

  /** 角色创建 / 修改 Request */
  export interface CharacterSaveReq {
    id?: number;
    projectId?: number;
    name: string;
    aliases?: string;
    roleLevel?: string;
    sex?: number;
    ageRange?: string;
    personalityTags?: string[];
    costumeTier?: number;
    description?: string;
    prompt?: string;
    referenceImageUrl?: string;
    voiceDescription?: string;
    sampleText?: string;
  }

  /** 场景 */
  export interface Location {
    id: number;
    projectId: number;
    name: string;
    description?: string;
    crowd?: boolean; // 是否有群演
    crowdDescription?: string;
    availableSlots?: string[]; // 可站位置
    descriptions?: string[];
    referenceImageUrl?: string;
    imageUrls?: string[];
    imageDescriptions?: string[];
    selectedIndex?: number;
    previousImageUrls?: string[];
    modelId?: number;
    status?: number;
    errorMessage?: string;
    updateTime?: Date;
  }

  /** 场景创建 / 修改 Request */
  export interface LocationSaveReq {
    id?: number;
    projectId?: number;
    name: string;
    description?: string;
    crowd?: boolean;
    crowdDescription?: string;
    availableSlots?: string[];
    descriptions?: string[];
    referenceImageUrl?: string;
    selectedIndex?: number;
  }

  /** 视觉资产的参考图：道具使用 referenceImageUrl、shotNumbers；关键帧使用 urls、propsVersion、previousImageUrl */
  export interface ReferenceImages {
    shotNumbers?: number[]; // 道具出现的镜头序号
    referenceImageUrl?: string;
    urls?: string[];
    propsVersion?: string;
    previousImageUrl?: string;
  }

  /** 视觉资产 */
  export interface VisualAsset {
    id: number;
    projectId: number;
    storyboardId?: number; // 关键帧所属的分镜
    parentId?: number; // 历史版本指向当前版本；当前版本为空
    kind: number; // 参见 AiDramaVisualAssetKindEnum
    title?: string;
    prompt?: string;
    referenceImages?: ReferenceImages;
    imageUrl?: string;
    modelId?: number;
    model?: string;
    status?: number;
    errorMessage?: string;
    updateTime?: Date;
  }

  /** 视觉资产创建 / 修改 Request */
  export interface VisualAssetSaveReq {
    id?: number;
    projectId?: number;
    title?: string;
    prompt?: string;
    referenceImageUrl?: string;
    shotNumbers?: number[];
  }

  /** 出图 Request：角色形象、场景、视觉资产使用其编号；批量补图使用项目编号 */
  export interface ImageGenerateReq {
    id: number;
    modelId: number;
  }
}

// ========== 角色 ==========

/** 创建角色 */
export function createDramaCharacter(data: AiDramaAssetApi.CharacterSaveReq) {
  return requestClient.post<number>('/ai/drama/asset/character/create', data);
}

/** 修改角色 */
export function updateDramaCharacter(data: AiDramaAssetApi.CharacterSaveReq) {
  return requestClient.put<boolean>('/ai/drama/asset/character/update', data);
}

/** 删除角色 */
export function deleteDramaCharacter(id: number) {
  return requestClient.delete<boolean>(
    `/ai/drama/asset/character/delete?id=${id}`,
  );
}

// ========== 角色形象 ==========

/** 创建角色形象 */
export function createDramaAppearance(
  data: AiDramaAssetApi.AppearanceSaveReq,
) {
  return requestClient.post<number>('/ai/drama/asset/appearance/create', data);
}

/** 修改角色形象 */
export function updateDramaAppearance(
  data: AiDramaAssetApi.AppearanceSaveReq,
) {
  return requestClient.put<boolean>('/ai/drama/asset/appearance/update', data);
}

/** 删除角色形象 */
export function deleteDramaAppearance(id: number) {
  return requestClient.delete<boolean>(
    `/ai/drama/asset/appearance/delete?id=${id}`,
  );
}

/** 生成角色形象图 */
export function generateDramaAppearanceImage(id: number, modelId: number) {
  return requestClient.post<boolean>(
    '/ai/drama/asset/appearance/generate-image',
    { id, modelId },
  );
}

/** 删除角色形象的候选图 */
export function deleteDramaAppearanceCandidate(id: number, index: number) {
  return requestClient.delete<boolean>(
    `/ai/drama/asset/appearance/delete-candidate?id=${id}&index=${index}`,
  );
}

/** 撤销角色形象的上次出图 */
export function undoDramaAppearanceImage(id: number) {
  return requestClient.put<boolean>(
    `/ai/drama/asset/appearance/undo-image?id=${id}`,
  );
}

// ========== 场景 ==========

/** 创建场景 */
export function createDramaLocation(data: AiDramaAssetApi.LocationSaveReq) {
  return requestClient.post<number>('/ai/drama/asset/location/create', data);
}

/** 修改场景 */
export function updateDramaLocation(data: AiDramaAssetApi.LocationSaveReq) {
  return requestClient.put<boolean>('/ai/drama/asset/location/update', data);
}

/** 删除场景 */
export function deleteDramaLocation(id: number) {
  return requestClient.delete<boolean>(
    `/ai/drama/asset/location/delete?id=${id}`,
  );
}

/** 生成场景图 */
export function generateDramaLocationImage(id: number, modelId: number) {
  return requestClient.post<boolean>(
    '/ai/drama/asset/location/generate-image',
    { id, modelId },
  );
}

/** 删除场景的候选图 */
export function deleteDramaLocationCandidate(id: number, index: number) {
  return requestClient.delete<boolean>(
    `/ai/drama/asset/location/delete-candidate?id=${id}&index=${index}`,
  );
}

/** 撤销场景的上次出图 */
export function undoDramaLocationImage(id: number) {
  return requestClient.put<boolean>(
    `/ai/drama/asset/location/undo-image?id=${id}`,
  );
}

// ========== 视觉资产 ==========

/** 创建视觉资产 */
export function createDramaVisualAsset(
  data: AiDramaAssetApi.VisualAssetSaveReq,
) {
  return requestClient.post<number>(
    '/ai/drama/asset/visual-asset/create',
    data,
  );
}

/** 修改视觉资产 */
export function updateDramaVisualAsset(
  data: AiDramaAssetApi.VisualAssetSaveReq,
) {
  return requestClient.put<boolean>(
    '/ai/drama/asset/visual-asset/update',
    data,
  );
}

/** 删除视觉资产 */
export function deleteDramaVisualAsset(id: number) {
  return requestClient.delete<boolean>(
    `/ai/drama/asset/visual-asset/delete?id=${id}`,
  );
}

/** 生成视觉资产图 */
export function generateDramaVisualAssetImage(id: number, modelId: number) {
  return requestClient.post<boolean>(
    '/ai/drama/asset/visual-asset/generate-image',
    { id, modelId },
  );
}

/** 撤销道具、关键帧的上次出图：与最近的历史版本互换 */
export function undoDramaVisualAssetImage(id: number) {
  return requestClient.put<boolean>(
    `/ai/drama/asset/visual-asset/undo-image?id=${id}`,
  );
}

/** 批量补全缺失的图片；返回提交的数量 */
export function generateDramaMissingImages(projectId: number, modelId: number) {
  return requestClient.post<number>('/ai/drama/asset/generate-missing-images', {
    id: projectId,
    modelId,
  });
}

// ========== 音频 ==========

/** 创建音频 */
export function createDramaAudio(data: AiDramaAssetApi.AudioCreateReq) {
  return requestClient.post<number>('/ai/drama/asset/audio/create', data);
}

/** 修改配乐、参考音频：名称、使用的分镜、音量、起始偏移 */
export function updateDramaAudio(data: AiDramaAssetApi.AudioUpdateReq) {
  return requestClient.put<boolean>('/ai/drama/asset/audio/update', data);
}

/** 生成音频 */
export function generateDramaAudio(data: AiDramaAssetApi.AudioGenerateReq) {
  return requestClient.post<number>('/ai/drama/asset/audio/generate', data, {
    timeout: GENERATE_TIMEOUT,
  });
}

/** 选用音频 */
export function selectDramaAudio(id: number) {
  return requestClient.put<boolean>(`/ai/drama/asset/audio/select?id=${id}`);
}

/** 删除音频 */
export function deleteDramaAudio(id: number) {
  return requestClient.delete<boolean>(
    `/ai/drama/asset/audio/delete?id=${id}`,
  );
}

/** 选用 AI 音乐为配乐 */
export function createDramaMusicAudio(data: AiDramaAssetApi.AudioMusicReq) {
  return requestClient.post<number>('/ai/drama/asset/audio/create-music', data);
}

// ========== 动作参考 ==========

/** 创建动作参考 */
export function createDramaMotionReference(
  data: AiDramaAssetApi.MotionReferenceCreateReq,
) {
  return requestClient.post<number>(
    '/ai/drama/asset/motion-reference/create',
    data,
  );
}

/** 删除动作参考 */
export function deleteDramaMotionReference(id: number) {
  return requestClient.delete<boolean>(
    `/ai/drama/asset/motion-reference/delete?id=${id}`,
  );
}
