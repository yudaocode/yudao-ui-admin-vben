import { requestClient } from '#/api/request';

export namespace HrmRecruitInterviewApi {
  /** 招聘面试 */
  export interface Interview {
    id?: number;
    candidateId?: number;
    type?: number;
    stageNumber?: number;
    interviewEmployeeId?: number;
    interviewEmployeeName?: string;
    otherInterviewEmployeeIds?: number[];
    otherInterviewEmployeeNames?: string[];
    interviewTime?: Date | number;
    address?: string;
    remark?: string;
    result?: number;
    evaluate?: string;
    cancelReason?: string;
    createTime?: Date;
  }

  /** 面试结果修改 */
  export interface ResultReq {
    id: number;
    result: number;
    evaluate?: string;
    cancelReason?: string;
  }
}

/** 查询招聘面试详情 */
export function getRecruitInterview(id: number) {
  return requestClient.get<HrmRecruitInterviewApi.Interview>(
    `/hrm/recruit/interview/get?id=${id}`,
  );
}

/** 查询候选人的招聘面试列表 */
export function getRecruitInterviewListByCandidate(candidateId: number) {
  return requestClient.get<HrmRecruitInterviewApi.Interview[]>(
    `/hrm/recruit/interview/list-by-candidate?candidateId=${candidateId}`,
  );
}

/** 新增招聘面试 */
export function createRecruitInterview(data: HrmRecruitInterviewApi.Interview) {
  return requestClient.post<number>('/hrm/recruit/interview/create', data);
}

/** 修改招聘面试 */
export function updateRecruitInterview(data: HrmRecruitInterviewApi.Interview) {
  return requestClient.put<boolean>('/hrm/recruit/interview/update', data);
}

/** 修改招聘面试结果 */
export function updateRecruitInterviewResult(
  data: HrmRecruitInterviewApi.ResultReq,
) {
  return requestClient.put<boolean>(
    '/hrm/recruit/interview/update-result',
    data,
  );
}

/** 删除招聘面试 */
export function deleteRecruitInterview(id: number) {
  return requestClient.delete<boolean>(
    `/hrm/recruit/interview/delete?id=${id}`,
  );
}
