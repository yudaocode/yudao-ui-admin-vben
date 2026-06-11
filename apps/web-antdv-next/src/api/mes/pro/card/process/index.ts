import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesProCardProcessApi {
  /** MES 流转卡工序记录 */
  export interface CardProcess {
    id?: number; // 编号
    cardId?: number; // 流转卡编号
    sort?: number; // 序号
    processId?: number; // 工序编号
    processCode?: string; // 工序编码
    processName?: string; // 工序名称
    inputTime?: number; // 进入工序时间
    outputTime?: number; // 出工序时间
    inputQuantity?: number; // 投入数量
    outputQuantity?: number; // 产出数量
    unqualifiedQuantity?: number; // 不合格品数量
    workstationId?: number; // 工位编号
    workstationCode?: string; // 工位编码
    workstationName?: string; // 工位名称
    userId?: number; // 操作人编号
    nickname?: string; // 操作人名称
    ipqcId?: number; // 过程检验单编号
    remark?: string; // 备注
  }

  /** MES 流转卡工序记录分页查询参数 */
  export interface PageParams extends PageParam {
    cardId?: number;
  }
}

/** 查询流转卡工序记录分页 */
export function getCardProcessPage(params: MesProCardProcessApi.PageParams) {
  return requestClient.get<PageResult<MesProCardProcessApi.CardProcess>>(
    '/mes/pro/card-process/page',
    { params },
  );
}

/** 查询流转卡工序记录详情 */
export function getCardProcess(id: number) {
  return requestClient.get<MesProCardProcessApi.CardProcess>(
    `/mes/pro/card-process/get?id=${id}`,
  );
}

/** 新增流转卡工序记录 */
export function createCardProcess(data: MesProCardProcessApi.CardProcess) {
  return requestClient.post('/mes/pro/card-process/create', data);
}

/** 修改流转卡工序记录 */
export function updateCardProcess(data: MesProCardProcessApi.CardProcess) {
  return requestClient.put('/mes/pro/card-process/update', data);
}

/** 删除流转卡工序记录 */
export function deleteCardProcess(id: number) {
  return requestClient.delete(`/mes/pro/card-process/delete?id=${id}`);
}
