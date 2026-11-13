import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace AiSkillApi {
  /** AI 技能信息 */
  export interface Skill {
    id?: number; // 编号
    name: string; // 名称：小写字母、数字、中划线，创建后不可修改
    description?: string; // 描述：以 SKILL.md 头信息为准
    version: string; // 版本
    status: number; // 状态
    remark?: string; // 备注
    fileCount?: number; // 文件数量
    roleNames?: string[]; // 引用的角色名称
    createTime?: Date; // 创建时间
    updateTime?: Date; // 更新时间
  }

  /** AI 技能文件信息 */
  export interface SkillFile {
    id: number; // 编号
    skillId: number; // 技能编号
    parentId: number; // 父目录编号
    name: string; // 名称
    type: number; // 类型，参见 AiSkillFileTypeEnum
    fileType?: string; // 文件扩展名
    content?: string; // 文件内容
    size?: number; // 内容字节数
    locked: boolean; // 是否固定
    sort: number; // 排序
    createTime?: Date; // 创建时间
    updateTime?: Date; // 更新时间
    children?: SkillFile[]; // 子节点
  }
}

/** 查询技能分页 */
export function getSkillPage(params: PageParam) {
  return requestClient.get<PageResult<AiSkillApi.Skill>>('/ai/skill/page', {
    params,
  });
}

/** 查询技能详情 */
export function getSkill(id: number) {
  return requestClient.get<AiSkillApi.Skill>(`/ai/skill/get?id=${id}`);
}

/** 查询启用的技能精简列表：只有编号、名称、描述 */
export function getSkillSimpleList() {
  return requestClient.get<AiSkillApi.Skill[]>('/ai/skill/simple-list');
}

/** 新增技能 */
export function createSkill(data: AiSkillApi.Skill) {
  return requestClient.post('/ai/skill/create', data);
}

/** 修改技能 */
export function updateSkill(data: AiSkillApi.Skill) {
  return requestClient.put('/ai/skill/update', data);
}

/** 删除技能 */
export function deleteSkill(id: number) {
  return requestClient.delete(`/ai/skill/delete?id=${id}`);
}

/** 查询技能文件列表 */
export function getSkillFileList(skillId: number) {
  return requestClient.get<AiSkillApi.SkillFile[]>(
    `/ai/skill/file/list?skillId=${skillId}`,
  );
}

/** 查询技能文件详情 */
export function getSkillFile(id: number) {
  return requestClient.get<AiSkillApi.SkillFile>(`/ai/skill/file/get?id=${id}`);
}

/** 新增技能文件 */
export function createSkillFile(data: {
  name: string;
  parentId: number;
  skillId: number;
  type: number;
}) {
  return requestClient.post<number>('/ai/skill/file/create', data);
}

/** 重命名技能文件 */
export function renameSkillFile(data: { id: number; name: string }) {
  return requestClient.put('/ai/skill/file/rename', data);
}

/** 移动技能文件 */
export function moveSkillFile(data: { id: number; parentId: number }) {
  return requestClient.put('/ai/skill/file/move', data);
}

/** 修改技能文件内容 */
export function updateSkillFileContent(data: { content: string; id: number }) {
  return requestClient.put('/ai/skill/file/update-content', data);
}

/** 删除技能文件 */
export function deleteSkillFile(id: number) {
  return requestClient.delete(`/ai/skill/file/delete?id=${id}`);
}
