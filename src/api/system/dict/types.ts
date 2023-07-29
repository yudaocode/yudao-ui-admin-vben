export interface DictTypeVO {
  id: number
  name: string
  type: string
  status: number
  remark: string
  createTime: Date
}

export interface DictTypePageReqVO {
  name: string
  type: string
  status: number
  createTime: Date[]
}

export interface DictTypeExportReqVO {
  name: string
  type: string
  status: number
  createTime: Date[]
}

export interface DictDataVO {
  id: number
  sort: number
  label: string
  value: string
  dictType: string
  status: number
  colorType: string
  cssClass: string
  remark: string
  createTime: Date
}
export interface DictDataPageReqVO {
  label: string
  dictType: string
  status: number
}

export interface DictDataExportReqVO {
  label: string
  dictType: string
  status: number
}
