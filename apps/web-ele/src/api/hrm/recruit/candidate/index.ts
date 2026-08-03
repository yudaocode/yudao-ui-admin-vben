import type { PageParam, PageResult } from '@vben/request';

import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { requestClient } from '#/api/request';

export namespace HrmRecruitCandidateApi {
  /** 招聘候选人 */
  export interface Candidate {
    id?: number;
    name: string;
    mobile: string;
    sex?: number;
    age?: number;
    email?: string;
    postId?: number;
    postName?: string;
    postStatus?: number;
    deptId?: number;
    deptName?: string;
    ownerEmployeeId?: number;
    ownerEmployeeName?: string;
    stageNumber?: number;
    workTime?: number;
    education?: number;
    graduateSchool?: string;
    latestWorkPlace?: string;
    channelId?: number;
    channelName?: string;
    remark?: string;
    status?: number;
    eliminate?: string;
    statusUpdateTime?: Date;
    entryTime?: Date | number;
    resumeUrls: string[];
    interviewId?: number;
    interviewType?: number;
    interviewEmployeeId?: number;
    interviewEmployeeName?: string;
    otherInterviewEmployeeIds?: number[];
    otherInterviewEmployeeNames?: string[];
    interviewTime?: Date;
    interviewAddress?: string;
    interviewResult?: number;
    employeeId?: number;
    creator?: string;
    creatorName?: string;
    createTime?: Date;
    updateTime?: Date;
  }

  /** 候选人状态统计 */
  export interface StatusCount {
    status: number;
    count: number;
  }

  /** 修改状态 */
  export interface UpdateStatusReq {
    id: number;
    status: number;
  }

  /** 修改职位 */
  export interface UpdatePostReq {
    id: number;
    postId: number;
  }

  /** 修改渠道 */
  export interface UpdateChannelReq {
    id: number;
    channelId: number;
  }

  /** 淘汰 */
  export interface UpdateEliminateReq {
    id: number;
    eliminate: string;
    remark?: string;
  }

  /** 转员工 */
  export interface EntryReq extends HrmEmployeeApi.Employee {
    candidateId: number;
  }
}

/** 查询招聘候选人分页 */
export function getRecruitCandidatePage(params: PageParam) {
  return requestClient.get<PageResult<HrmRecruitCandidateApi.Candidate>>(
    '/hrm/recruit/candidate/page',
    { params },
  );
}

/** 查询招聘候选人详情 */
export function getRecruitCandidate(id: number) {
  return requestClient.get<HrmRecruitCandidateApi.Candidate>(
    `/hrm/recruit/candidate/get?id=${id}`,
  );
}

/** 获得招聘候选人状态统计 */
export function getRecruitCandidateStatusCount(params: Record<string, any>) {
  return requestClient.get<HrmRecruitCandidateApi.StatusCount[]>(
    '/hrm/recruit/candidate/status-count',
    { params },
  );
}

/** 获得待清理的招聘候选人编号 */
export function getCleanRecruitCandidateIdList(
  statuses: number[],
  days: number,
) {
  return requestClient.get<number[]>('/hrm/recruit/candidate/clean-ids', {
    params: { statuses, days },
  });
}

/** 新增招聘候选人 */
export function createRecruitCandidate(data: HrmRecruitCandidateApi.Candidate) {
  return requestClient.post<number>('/hrm/recruit/candidate/create', data);
}

/** 修改招聘候选人 */
export function updateRecruitCandidate(data: HrmRecruitCandidateApi.Candidate) {
  return requestClient.put<boolean>('/hrm/recruit/candidate/update', data);
}

/** 修改招聘候选人状态 */
export function updateRecruitCandidateStatus(
  data: HrmRecruitCandidateApi.UpdateStatusReq,
) {
  return requestClient.put<boolean>(
    '/hrm/recruit/candidate/update-status',
    data,
  );
}

/** 修改招聘候选人应聘职位 */
export function updateRecruitCandidatePost(
  data: HrmRecruitCandidateApi.UpdatePostReq,
) {
  return requestClient.put<boolean>('/hrm/recruit/candidate/update-post', data);
}

/** 修改招聘候选人招聘渠道 */
export function updateRecruitCandidateChannel(
  data: HrmRecruitCandidateApi.UpdateChannelReq,
) {
  return requestClient.put<boolean>(
    '/hrm/recruit/candidate/update-channel',
    data,
  );
}

/** 淘汰招聘候选人 */
export function eliminateRecruitCandidate(
  data: HrmRecruitCandidateApi.UpdateEliminateReq,
) {
  return requestClient.put<boolean>('/hrm/recruit/candidate/eliminate', data);
}

/** 将招聘候选人转为员工档案 */
export function convertRecruitCandidateToEmployee(
  data: HrmRecruitCandidateApi.EntryReq,
) {
  return requestClient.post<number>(
    '/hrm/recruit/candidate/convert-employee',
    data,
  );
}

/** 删除招聘候选人 */
export function deleteRecruitCandidate(id: number) {
  return requestClient.delete<boolean>(
    `/hrm/recruit/candidate/delete?id=${id}`,
  );
}
