export namespace FmsReportApi {
  /** 财务报表查询参数 */
  export interface ListReq {
    accountSetId: number; // 账套编号
    startMonth: string; // 开始会计期间
    endMonth: string; // 结束会计期间
  }

  /** 财务报表未映射科目信息 */
  export interface UnmappedSubject {
    id: number; // 科目编号
    code: string; // 科目编码
    name: string; // 科目名称
  }

  /** 财务报表项目信息 */
  export interface ReportItem {
    id: number; // 配置编号
    name: string; // 项目名称
    rowNo: number; // 行次
    level: number; // 层级
    editable: boolean; // 是否可编辑
    formula: string; // 公式
    openingAmount: number; // 期初金额
    closingAmount: number; // 期末金额
    currentAmount: number; // 本期金额
    yearAmount: number; // 本年累计金额
  }

  /** 财务报表公式信息 */
  export interface Formula {
    subjectId?: number; // 科目编号
    subjectName: string; // 科目名称
    subjectNumber: string; // 科目编码
    operator: '+' | '-'; // 运算符
    rules: number; // 取数规则
    openingAmount?: number; // 期初金额
    closingAmount?: number; // 期末金额
    currentAmount?: number; // 本期金额
    yearAmount?: number; // 本年累计金额
  }

  /** 财务报表公式项修改参数 */
  export interface FormulaItemUpdateReq {
    subjectId: number; // 科目编号
    operator: '+' | '-'; // 运算符
    rules: number; // 取数规则
  }

  /** 财务报表公式修改参数 */
  export interface FormulaUpdateReq {
    accountSetId: number; // 账套编号
    id: number; // 配置编号
    formulas: FormulaItemUpdateReq[]; // 公式项数组
  }
}
