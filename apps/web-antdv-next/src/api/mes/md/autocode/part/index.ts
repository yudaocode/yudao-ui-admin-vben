import { requestClient } from '#/api/request';

export namespace MesMdAutoCodePartApi {
  /** MES 编码规则分段 */
  export interface AutoCodePart {
    id?: number; // 分段编号
    ruleId?: number; // 规则编号
    sort?: number; // 排序
    type?: number; // 分段类型
    length?: number; // 长度
    dateFormat?: string; // 日期格式
    fixCharacter?: string; // 固定字符
    serialStartNo?: number; // 流水号起始值
    serialStep?: number; // 流水号步长
    cycleFlag?: boolean; // 是否循环
    cycleMethod?: number; // 循环方式
    remark?: string; // 备注
  }
}

/** 查询编码规则分段详情 */
export function getAutoCodePart(id: number) {
  return requestClient.get<MesMdAutoCodePartApi.AutoCodePart>(
    `/mes/md/auto-code-part/get?id=${id}`,
  );
}

/** 查询编码规则分段列表 */
export function getAutoCodePartListByRuleId(ruleId: number) {
  return requestClient.get<MesMdAutoCodePartApi.AutoCodePart[]>(
    '/mes/md/auto-code-part/list-by-rule-id',
    { params: { ruleId } },
  );
}

/** 新增编码规则分段 */
export function createAutoCodePart(data: MesMdAutoCodePartApi.AutoCodePart) {
  return requestClient.post('/mes/md/auto-code-part/create', data);
}

/** 修改编码规则分段 */
export function updateAutoCodePart(data: MesMdAutoCodePartApi.AutoCodePart) {
  return requestClient.put('/mes/md/auto-code-part/update', data);
}

/** 删除编码规则分段 */
export function deleteAutoCodePart(id: number) {
  return requestClient.delete(`/mes/md/auto-code-part/delete?id=${id}`);
}
