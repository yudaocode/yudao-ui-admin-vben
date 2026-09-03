import type { PmsProjectApi } from '#/api/pms/pm/project';

import dayjs from 'dayjs';

import {
  PmsIterationStatus,
  PmsWorkItemPriority,
  PmsWorkItemStatusType,
  PmsWorkItemType,
} from './constants';

/** 获得工作项类型编码 */
export function getWorkItemTypeCode(type: number) {
  return (
    {
      [PmsWorkItemType.REQUIREMENT]: 'requirement',
      [PmsWorkItemType.TASK]: 'task',
      [PmsWorkItemType.DEFECT]: 'defect',
    }[type] || 'task'
  );
}

/** 获得工作项优先级标签类型 */
export function getPriorityTagType(priority?: number) {
  return {
    [PmsWorkItemPriority.NONE]: 'default',
    [PmsWorkItemPriority.LOW]: 'default',
    [PmsWorkItemPriority.MEDIUM]: 'warning',
    [PmsWorkItemPriority.HIGH]: 'error',
  }[priority ?? -1] as 'default' | 'error' | 'warning';
}

/** 获得工作项优先级颜色 */
export function getPriorityColor(priority?: number) {
  return (
    {
      [PmsWorkItemPriority.NONE]: 'rgba(0, 0, 0, 45%)',
      [PmsWorkItemPriority.LOW]: '#52c41a',
      [PmsWorkItemPriority.MEDIUM]: '#faad14',
      [PmsWorkItemPriority.HIGH]: '#ff4d4f',
    }[priority ?? -1] || 'rgba(0, 0, 0, 45%)'
  );
}

/** 获得工作项状态标签类型 */
export function getWorkItemStatusTagType(status?: number) {
  return {
    [PmsWorkItemStatusType.PENDING]: 'default',
    [PmsWorkItemStatusType.PROCESSING]: 'warning',
    [PmsWorkItemStatusType.COMPLETED]: 'success',
  }[status ?? -1] as 'default' | 'success' | 'warning';
}

/** 获得迭代状态标签类型 */
export function getIterationStatusTagType(status?: number) {
  return {
    [PmsIterationStatus.PLANNED]: 'default',
    [PmsIterationStatus.ACTIVE]: 'processing',
    [PmsIterationStatus.COMPLETED]: 'success',
  }[status ?? -1] as 'default' | 'processing' | 'success';
}

/** 格式化包含中文星期的日期 */
export function formatDateWithWeekday(date: string) {
  return `${dayjs(date).format('MM-DD')}/周${'日一二三四五六'[dayjs(date).day()]}`;
}

/** 移除 HTML 标签并合并空白字符 */
export function stripHtmlTags(content: string) {
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 格式化项目工作项数量 */
export function formatProjectWorkItemCounts(project: PmsProjectApi.Project) {
  return `${project.completedWorkItemCount}/${project.pendingWorkItemCount}/${project.processingWorkItemCount}`;
}

/** 计算项目工作项完成率 */
export function formatProjectCompletionRate(project: PmsProjectApi.Project) {
  const total =
    project.pendingWorkItemCount +
    project.processingWorkItemCount +
    project.completedWorkItemCount;
  return total > 0
    ? Math.round((project.completedWorkItemCount * 100) / total)
    : 0;
}

/** 格式化工时 */
export function formatWorkHours(hours?: number) {
  return hours === undefined ? '--' : `${hours} 小时`;
}
