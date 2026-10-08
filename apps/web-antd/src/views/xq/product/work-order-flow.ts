import type { XqWorkOrderApi } from '#/api/xq/work-order';

/** 任务列表主流程状态（与后端 flowStatus 筛选值对应） */
export const FLOW_STEPS = [
  '文案待执行',
  '文案执行中',
  '待分配美工',
  '待执行图片',
  '图片执行中',
  '待上架',
  '已上架',
] as const;

export type FlowStep = (typeof FLOW_STEPS)[number];

/** 列表步进条短文案 */
export const FLOW_STEP_SHORT: Record<FlowStep, string> = {
  文案待执行: '文案待执行',
  文案执行中: '文案执行中',
  待分配美工: '待分美工',
  待执行图片: '待出图',
  图片执行中: '出图中',
  待上架: '待上架',
  已上架: '已上架',
};

export function flowStepIndex(step: string) {
  const i = (FLOW_STEPS as readonly string[]).indexOf(step);
  return i === -1 ? -1 : i;
}

export const FLOW_STATUS_OPTIONS = [
  { label: '文案待执行', value: 'copy_pending' },
  { label: '文案执行中', value: 'copy_running' },
  { label: '待分配美工', value: 'assign_image' },
  { label: '待执行图片', value: 'image_pending' },
  { label: '图片执行中', value: 'image_running' },
  { label: '待上架', value: 'list_pending' },
  { label: '已上架', value: 'listed' },
  { label: '已关闭', value: 'closed' },
];

const IMAGE_STARTED = new Set([
  'done',
  'generated',
  'rejected',
  'revised',
  'running',
]);

export function isImageStarted(row?: null | XqWorkOrderApi.WorkOrder) {
  if (!row?.imageUserId) return false;
  return IMAGE_STARTED.has(String(row.imageStatus || '').toLowerCase());
}

/** 美工未开跑前可分配/改派 */
export function canSwitchImageUser(row?: null | XqWorkOrderApi.WorkOrder) {
  if (!row || row.status !== 10) return false;
  if (!row.imageUserId) return true;
  return !isImageStarted(row);
}

export function hasCopyReady(row?: null | XqWorkOrderApi.WorkOrder) {
  if (!row) return false;
  if (row.contentTitle?.trim()) return true;
  return ['inherited', 'success'].includes(String(row.rpaCopyStatus || ''));
}

export function flowStep(row: XqWorkOrderApi.WorkOrder): '已关闭' | FlowStep {
  if (row.status === 20) return '已上架';
  if (row.status === 30) return '已关闭';
  if (row.status !== 10) return '已关闭';

  const rpa = String(row.rpaCopyStatus || '');
  if (rpa === 'running' || rpa === 'queued') return '文案执行中';

  if (!hasCopyReady(row)) return '文案待执行';

  if (!row.imageUserId) return '待分配美工';

  const img = String(row.imageStatus || '').toLowerCase();
  if (img === 'done' || row.listingStatus === 'export_pending_confirm') {
    return '待上架';
  }
  if (
    img === 'running' ||
    img === 'generated' ||
    img === 'revised' ||
    img === 'rejected'
  ) {
    return '图片执行中';
  }
  // todo / pending / 空
  return '待执行图片';
}

/** 待上架子状态文案 */
export function listSubLabel(row: XqWorkOrderApi.WorkOrder) {
  if (flowStep(row) !== '待上架') return '';
  if (row.listingStatus === 'export_pending_confirm') {
    return '导表成功，待确认是否上架';
  }
  return '';
}
