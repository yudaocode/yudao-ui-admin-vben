import type { PageParam, PageResult } from '@vben/request';

import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { requestClient } from '#/api/request';

export namespace HrmRecruitCandidateApi {
  /** 招聘候选人 */
  export interface RecruitCandidate {
    id?: number; // 候选人编号
    name: string; // 候选人姓名
    mobile: string; // 手机号码
    sex?: number; // 性别
    age?: number; // 年龄
    email?: string; // 邮箱
    postId?: number; // 应聘职位编号
    postName?: string; // 应聘职位名称
    postStatus?: number; // 应聘职位状态
    deptId?: number; // 用人部门编号
    deptName?: string; // 用人部门名称
    ownerEmployeeId?: number; // 招聘负责人员工编号
    ownerEmployeeName?: string; // 招聘负责人姓名
    stageNumber?: number; // 面试轮次
    workTime?: number; // 工作年限
    education?: number; // 学历
    graduateSchool?: string; // 毕业院校
    latestWorkPlace?: string; // 最近工作单位
    channelId?: number; // 招聘渠道编号
    channelName?: string; // 招聘渠道名称
    remark?: string; // 备注
    status?: number; // 候选人状态
    eliminate?: string; // 淘汰原因
    statusUpdateTime?: Date; // 状态更新时间
    entryTime?: Date | number; // 入职时间
    resumeUrls: string[]; // 简历附件地址数组
    interviewId?: number; // 当前面试编号
    interviewType?: number; // 面试方式
    interviewEmployeeId?: number; // 主面试官员工编号
    interviewEmployeeName?: string; // 主面试官姓名
    otherInterviewEmployeeIds?: number[]; // 其他面试官员工编号数组
    otherInterviewEmployeeNames?: string[]; // 其他面试官姓名数组
    interviewTime?: Date; // 面试时间
    interviewAddress?: string; // 面试地址
    interviewResult?: number; // 面试结果
    employeeId?: number; // 转入的员工编号
    creator?: string; // 创建人用户编号
    creatorName?: string; // 创建人名称
    createTime?: Date; // 创建时间
    updateTime?: Date; // 更新时间
  }

  /** 候选人状态统计 */
  export interface StatusCount {
    status: number; // 候选人状态
    count: number; // 候选人数量
  }

  /** 修改状态 */
  export interface UpdateStatusReq {
    id: number; // 候选人编号
    status: number; // 候选人状态
  }

  /** 修改职位 */
  export interface UpdatePostReq {
    id: number; // 候选人编号
    postId: number; // 应聘职位编号
  }

  /** 修改渠道 */
  export interface UpdateChannelReq {
    id: number; // 候选人编号
    channelId: number; // 招聘渠道编号
  }

  /** 淘汰 */
  export interface UpdateEliminateReq {
    id: number; // 候选人编号
    eliminate: string; // 淘汰原因
    remark?: string; // 备注
  }

  /** 转员工 */
  export interface EntryReq extends HrmEmployeeApi.Employee {
    candidateId: number;
  }
}

/** 查询招聘候选人分页 */
export function getRecruitCandidatePage(params: PageParam) {
  return requestClient.get<PageResult<HrmRecruitCandidateApi.RecruitCandidate>>(
    '/hrm/recruit/candidate/page',
    { params },
  );
}

/** 查询招聘候选人详情 */
export function getRecruitCandidate(id: number) {
  return requestClient.get<HrmRecruitCandidateApi.RecruitCandidate>(
    `/hrm/recruit/candidate/get?id=${id}`,
  );
}

/** 获得招聘候选人状态统计 */
export function getRecruitCandidateStatusCount(params: PageParam) {
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
export function createRecruitCandidate(
  data: HrmRecruitCandidateApi.RecruitCandidate,
) {
  return requestClient.post<number>('/hrm/recruit/candidate/create', data);
}

/** 修改招聘候选人 */
export function updateRecruitCandidate(
  data: HrmRecruitCandidateApi.RecruitCandidate,
) {
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
