export interface FormVO {
  id: number
  name: string
  conf: string
  fields: string[]
  status: number
  remark: string
  createTime: string
}

export interface TaskProcessVO {
  id: string
  name: string
  startUserId: number
  startUserNickname: string
  processDefinitionId: string
}

export interface TaskTodoVO {
  id: string
  name: string
  claimTime: string
  createTime: string
  suspensionState: number
  processInstance: TaskProcessVO
}

export interface TaskDoneVO {
  id: string
  name: string
  claimTime: string
  createTime: string
  endTime: string
  durationInMillis: number
  suspensionState: number
  result: number
  reason: string
  processInstance: TaskProcessVO
}
