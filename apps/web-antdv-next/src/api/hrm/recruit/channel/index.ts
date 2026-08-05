import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmRecruitChannelApi {
  /** 招聘渠道 */
  export interface RecruitChannel {
    id?: number; // 招聘渠道编号
    systemFlag?: boolean; // 是否系统内置
    status?: number; // 状态
    name: string; // 渠道名称
    sort: number; // 显示顺序
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }

  /** 渠道状态修改 */
  export interface StatusReq {
    id: number; // 候选人编号
    status: number; // 候选人状态
  }

  /** 渠道删除 */
  export interface DeleteReq {
    id: number; // 待删除招聘渠道编号
    transferChannelId: number; // 承接招聘渠道编号
  }
}

/** 查询招聘渠道分页 */
export function getRecruitChannelPage(params: PageParam) {
  return requestClient.get<PageResult<HrmRecruitChannelApi.RecruitChannel>>(
    '/hrm/recruit/channel/page',
    { params },
  );
}

/** 查询招聘渠道详情 */
export function getRecruitChannel(id: number) {
  return requestClient.get<HrmRecruitChannelApi.RecruitChannel>(
    `/hrm/recruit/channel/get?id=${id}`,
  );
}

/** 查询招聘渠道精简精简列表 */
export function getRecruitChannelSimpleList() {
  return requestClient.get<HrmRecruitChannelApi.RecruitChannel[]>(
    '/hrm/recruit/channel/simple-list',
  );
}

/** 新增招聘渠道 */
export function createRecruitChannel(
  data: HrmRecruitChannelApi.RecruitChannel,
) {
  return requestClient.post<number>('/hrm/recruit/channel/create', data);
}

/** 修改招聘渠道 */
export function updateRecruitChannel(
  data: HrmRecruitChannelApi.RecruitChannel,
) {
  return requestClient.put<boolean>('/hrm/recruit/channel/update', data);
}

/** 修改招聘渠道状态 */
export function updateRecruitChannelStatus(
  data: HrmRecruitChannelApi.StatusReq,
) {
  return requestClient.put<boolean>('/hrm/recruit/channel/update-status', data);
}

/** 删除招聘渠道 */
export function deleteRecruitChannel(data: HrmRecruitChannelApi.DeleteReq) {
  return requestClient.delete<boolean>('/hrm/recruit/channel/delete', {
    data,
  });
}
