import { requestClient } from '#/api/request';

export namespace FmsClosingTemplateApi {
  /** 结账模板科目规则 */
  export interface SubjectRule {
    subjectId?: number; // 科目编号
    subjectCode?: string; // 科目编码快照
    digest: string; // 摘要
    direction: number; // 借贷方向
    amountRatio: number; // 金额比例
  }

  /** 结账模板 */
  export interface ClosingTemplate {
    id?: number; // 模板编号
    accountSetId: number; // 账套编号
    presetCode?: string; // 系统预置编码
    name: string; // 模板名称
    category: number; // 模板分类
    periodEnd: boolean; // 是否期末结转
    subjectId?: number; // 来源科目编号
    formulaRule?: number; // 取数规则
    timeType?: number; // 取数时间类型
    subjects: SubjectRule[]; // 结转科目规则数组
    sort: number; // 显示顺序
    createTime?: Date; // 创建时间
  }
}

/** 查询结账模板列表 */
export function getClosingTemplateList(accountSetId: number) {
  return requestClient.get<FmsClosingTemplateApi.ClosingTemplate[]>(
    '/fms/closing/template/list',
    { params: { accountSetId } },
  );
}

/** 新增结账模板 */
export function createClosingTemplate(
  data: FmsClosingTemplateApi.ClosingTemplate,
) {
  return requestClient.post<number>('/fms/closing/template/create', data);
}

/** 修改结账模板 */
export function updateClosingTemplate(
  data: FmsClosingTemplateApi.ClosingTemplate,
) {
  return requestClient.put<boolean>('/fms/closing/template/update', data);
}

/** 删除结账模板 */
export function deleteClosingTemplate(accountSetId: number, id: number) {
  return requestClient.delete<boolean>('/fms/closing/template/delete', {
    params: { accountSetId, id },
  });
}
