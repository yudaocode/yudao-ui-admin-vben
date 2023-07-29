export interface CodegenTableVO {
  id: number
  tableId: number
  isParentMenuIdValid: boolean
  dataSourceConfigId: number
  scene: number
  tableName: string
  tableComment: string
  remark: string
  moduleName: string
  businessName: string
  className: string
  classComment: string
  author: string
  createTime: Date
  updateTime: Date
  templateType: number
  parentMenuId: number
}

export interface CodegenColumnVO {
  id: number
  tableId: number
  columnName: string
  dataType: string
  columnComment: string
  nullable: number
  primaryKey: number
  autoIncrement: string
  ordinalPosition: number
  javaType: string
  javaField: string
  dictType: string
  example: string
  createOperation: number
  updateOperation: number
  listOperation: number
  listOperationCondition: string
  listOperationResult: number
  htmlType: string
}
export interface DatabaseTableVO {
  name: string
  comment: string
}
export interface CodegenDetailVO {
  table: CodegenTableVO
  columns: CodegenColumnVO[]
}
export interface CodegenPreviewVO {
  filePath: string
  code: string
}
export interface CodegenUpdateReqVO {
  table: CodegenTableVO
  columns: CodegenColumnVO[]
}
export interface CodegenCreateListReqVO {
  dataSourceConfigId: number
  tableNames: string[]
}
