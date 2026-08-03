import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmRecruitPostApi {
  /** 招聘职位 */
  export interface Post {
    id?: number;
    postName: string;
    deptId?: number;
    deptName?: string;
    jobNature?: number;
    areaId?: number;
    areaName?: string;
    recruitNum?: number;
    reason?: string;
    workTime?: number;
    educationRequire?: number;
    minSalary?: number;
    maxSalary?: number;
    salaryUnit?: number;
    minAge?: number;
    maxAge?: number;
    latestEntryTime?: Date;
    ownerEmployeeId?: number;
    ownerEmployeeName?: string;
    interviewEmployeeIds?: number[];
    interviewEmployeeNames?: string[];
    description?: string;
    emergencyLevel?: number;
    postTypeId?: number;
    postTypeName?: string;
    status?: number;
    stopReason?: string;
    hasEntryNum?: number;
    recruitSchedule?: number;
    createTime?: Date;
  }

  /** 职位状态统计 */
  export interface StatusCount {
    status: number;
    count: number;
  }

  /** 职位状态修改 */
  export interface StatusReq {
    id: number;
    status: number;
    stopReason?: string;
  }
}

/** 查询招聘职位分页 */
export function getRecruitPostPage(params: PageParam) {
  return requestClient.get<PageResult<HrmRecruitPostApi.Post>>(
    '/hrm/recruit/post/page',
    { params },
  );
}

/** 查询招聘职位详情 */
export function getRecruitPost(id: number) {
  return requestClient.get<HrmRecruitPostApi.Post>(
    `/hrm/recruit/post/get?id=${id}`,
  );
}

/** 获得招聘职位精简列表 */
export function getRecruitPostSimpleList() {
  return requestClient.get<HrmRecruitPostApi.Post[]>(
    '/hrm/recruit/post/simple-list',
  );
}

/** 获得招聘职位状态统计 */
export function getRecruitPostStatusCount(params: PageParam) {
  return requestClient.get<HrmRecruitPostApi.StatusCount[]>(
    '/hrm/recruit/post/status-count',
    { params },
  );
}

/** 新增招聘职位 */
export function createRecruitPost(data: HrmRecruitPostApi.Post) {
  return requestClient.post<number>('/hrm/recruit/post/create', data);
}

/** 修改招聘职位 */
export function updateRecruitPost(data: HrmRecruitPostApi.Post) {
  return requestClient.put<boolean>('/hrm/recruit/post/update', data);
}

/** 修改招聘职位状态 */
export function updateRecruitPostStatus(data: HrmRecruitPostApi.StatusReq) {
  return requestClient.put<boolean>('/hrm/recruit/post/update-status', data);
}
