import { requestClient } from '#/api/request';

export namespace BpmCommentApi {
  /** 流程评论 */
  export interface Comment {
    id: string;
    taskId?: string;
    task?: {
      id: string;
      name: string;
      taskDefinitionKey: string;
    };
    processInstanceId: string;
    type: string;
    message: string;
    createTime: string;
    user?: {
      id: number;
      nickname: string;
      avatar?: string;
      deptName?: string;
    };
  }
}

/** 获得指定流程实例的评论列表 */
export const getCommentListByProcessInstanceId = async (
  processInstanceId: string,
) => {
  return await requestClient.get<BpmCommentApi.Comment[]>(
    '/bpm/comment/list-by-process-instance-id',
    { params: { processInstanceId } },
  );
};

/** 创建流程评论 */
export const createComment = async (taskId: string, message: string) => {
  return await requestClient.post('/bpm/comment/create', { taskId, message });
};

