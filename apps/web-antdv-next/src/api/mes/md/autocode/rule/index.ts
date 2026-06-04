import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdAutoCodeRuleApi {
  /** MES 编码规则 */
  export interface AutoCodeRule {
    id?: number; // 规则编号
    code?: string; // 规则编码
    name?: string; // 规则名称
    description?: string; // 规则描述
    maxLength?: number; // 最大长度
    padded?: boolean; // 是否补齐
    paddedChar?: string; // 补齐字符
    paddedMethod?: number; // 补齐方式
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询编码规则分页 */
export function getAutoCodeRulePage(params: PageParam) {
  return requestClient.get<PageResult<MesMdAutoCodeRuleApi.AutoCodeRule>>(
    '/mes/md/auto-code-rule/page',
    { params },
  );
}

/** 查询编码规则详情 */
export function getAutoCodeRule(id: number) {
  return requestClient.get<MesMdAutoCodeRuleApi.AutoCodeRule>(
    `/mes/md/auto-code-rule/get?id=${id}`,
  );
}

/** 新增编码规则 */
export function createAutoCodeRule(data: MesMdAutoCodeRuleApi.AutoCodeRule) {
  return requestClient.post('/mes/md/auto-code-rule/create', data);
}

/** 修改编码规则 */
export function updateAutoCodeRule(data: MesMdAutoCodeRuleApi.AutoCodeRule) {
  return requestClient.put('/mes/md/auto-code-rule/update', data);
}

/** 删除编码规则 */
export function deleteAutoCodeRule(id: number) {
  return requestClient.delete(`/mes/md/auto-code-rule/delete?id=${id}`);
}

/** 导出编码规则 */
export function exportAutoCodeRule(params: PageParam) {
  return requestClient.download('/mes/md/auto-code-rule/export-excel', { params });
}
