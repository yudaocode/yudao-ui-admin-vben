import type { PageParam, PageResult } from '@vben/request';

import type { BpmTaskApi } from '../task';

import type { BpmModelApi } from '#/api/bpm/model';
import type { BpmCandidateStrategyEnum, BpmNodeTypeEnum } from '#/utils';

import { requestClient } from '#/api/request';

export namespace BpmProcessInstanceApi {
  // TODO @芋艿：一些注释缺少或者不对；
  export type Task = {
    id: number;
    name: string;
  };

  export type User = {
    avatar: string;
    id: number;
    nickname: string;
  };

  // 审批任务信息
  export type ApprovalTaskInfo = {
    assigneeUser: User;
    id: number;
    ownerUser: User;
    reason: string;
    signPicUrl: string;
    status: number;
  };

  // 审批节点信息
  export type ApprovalNodeInfo = {
    candidateStrategy?: BpmCandidateStrategyEnum;
    candidateUsers?: User[];
    endTime?: Date;
    id: number;
    name: string;
    nodeType: BpmNodeTypeEnum;
    startTime?: Date;
    status: number;
    tasks: ApprovalTaskInfo[];
  };

  /** 流程实例 */
  export type ProcessInstanceVO = {
    businessKey: string;
    category: string;
    createTime: string;
    endTime: string;
    fields: string[];
    formVariables: Record<string, any>;
    id: number;
    name: string;
    processDefinition?: BpmModelApi.ProcessDefinitionVO;
    processDefinitionId: string;
    remark: string;
    result: number;
    startTime?: Date;
    startUser?: User;
    status: number;
    tasks?: BpmProcessInstanceApi.Task[];
  };

  // 审批详情
  export type ApprovalDetail = {
    activityNodes: BpmProcessInstanceApi.ApprovalNodeInfo[];
    formFieldsPermission: any;
    processDefinition: BpmModelApi.ProcessDefinitionVO;
    processInstance: BpmProcessInstanceApi.ProcessInstanceVO;
    status: number;
    todoTask: BpmTaskApi.TaskVO;
  };

  // 抄送流程实例 VO
  export type CopyVO = {
    activityId: string;
    activityName: string;
    createTime: number;
    createUser: User;
    id: number;
    processInstanceId: string;
    processInstanceName: string;
    processInstanceStartTime: number;
    reason: string;
    startUser: User;
    summary: {
      key: string;
      value: string;
    }[];
    taskId: string;
  };
}

/** 查询我的流程实例分页 */
export async function getProcessInstanceMyPage(params: PageParam) {
  return requestClient.get<PageResult<BpmProcessInstanceApi.ProcessInstanceVO>>(
    '/bpm/process-instance/my-page',
    { params },
  );
}

/** 查询管理员流程实例分页 */
export async function getProcessInstanceManagerPage(params: PageParam) {
  return requestClient.get<PageResult<BpmProcessInstanceApi.ProcessInstanceVO>>(
    '/bpm/process-instance/manager-page',
    { params },
  );
}

/** 新增流程实例 */
export async function createProcessInstance(data: any) {
  return requestClient.post<BpmProcessInstanceApi.ProcessInstanceVO>(
    '/bpm/process-instance/create',
    data,
  );
}

/** 申请人主动取消流程实例 */
export async function cancelProcessInstanceByStartUser(
  id: number,
  reason: string,
) {
  return requestClient.delete<boolean>(
    '/bpm/process-instance/cancel-by-start-user',
    {
      data: { id, reason },
    },
  );
}

/** 管理员取消流程实例 */
export async function cancelProcessInstanceByAdmin(id: number, reason: string) {
  return requestClient.delete<boolean>(
    '/bpm/process-instance/cancel-by-admin',
    {
      data: { id, reason },
    },
  );
}

/** 查询流程实例详情 */
export async function getProcessInstance(id: number) {
  return requestClient.get<BpmProcessInstanceApi.ProcessInstanceVO>(
    `/bpm/process-instance/get?id=${id}`,
  );
}

/** 查询复制流程实例分页 */
export async function getProcessInstanceCopyPage(params: PageParam) {
  return requestClient.get<PageResult<BpmProcessInstanceApi.ProcessInstanceVO>>(
    '/bpm/process-instance/copy/page',
    { params },
  );
}

/** 更新流程实例 */
export async function updateProcessInstance(
  data: BpmProcessInstanceApi.ProcessInstanceVO,
) {
  return requestClient.put<BpmProcessInstanceApi.ProcessInstanceVO>(
    '/bpm/process-instance/update',
    data,
  );
}

/** 获取审批详情 */
export async function getApprovalDetail(params: any) {
  return requestClient.get<BpmProcessInstanceApi.ApprovalDetail>(
    `/bpm/process-instance/get-approval-detail`,
    { params },
  );
}

/** 获取下一个执行的流程节点 */
export async function getNextApprovalNodes(params: any) {
  return requestClient.get<BpmProcessInstanceApi.ApprovalNodeInfo[]>(
    `/bpm/process-instance/get-next-approval-nodes`,
    { params },
  );
}

/** 获取表单字段权限 */
export async function getFormFieldsPermission(params: any) {
  return requestClient.get<BpmProcessInstanceApi.ProcessInstanceVO>(
    `/bpm/process-instance/get-form-fields-permission`,
    { params },
  );
}

/** 获取流程实例 BPMN 模型视图 */
export async function getProcessInstanceBpmnModelView(id: string) {
  return requestClient.get<BpmProcessInstanceApi.ProcessInstanceVO>(
    `/bpm/process-instance/get-bpmn-model-view?id=${id}`,
  );
}
