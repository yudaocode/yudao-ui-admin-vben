import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmRecruitChannelApi {
  /** 招聘渠道 */
  export interface Channel {
    id?: number;
    systemFlag?: boolean;
    status?: number;
    name: string;
    sort: number;
    remark?: string;
    createTime?: Date;
  }

  /** 渠道状态修改 */
  export interface StatusReq {
    id: number;
    status: number;
  }

  /** 渠道删除 */
  export interface DeleteReq {
    id: number;
    transferChannelId: number;
  }
}

/** 查询招聘渠道分页 */
export function getRecruitChannelPage(params: PageParam) {
  return requestClient.get<PageResult<HrmRecruitChannelApi.Channel>>(
    '/hrm/recruit/channel/page',
    { params },
  );
}

/** 查询招聘渠道详情 */
export function getRecruitChannel(id: number) {
  return requestClient.get<HrmRecruitChannelApi.Channel>(
    `/hrm/recruit/channel/get?id=${id}`,
  );
}

/** 查询招聘渠道精简列表 */
export function getRecruitChannelSimpleList() {
  return requestClient.get<HrmRecruitChannelApi.Channel[]>(
    '/hrm/recruit/channel/simple-list',
  );
}

/** 新增招聘渠道 */
export function createRecruitChannel(data: HrmRecruitChannelApi.Channel) {
  return requestClient.post<number>('/hrm/recruit/channel/create', data);
}

/** 修改招聘渠道 */
export function updateRecruitChannel(data: HrmRecruitChannelApi.Channel) {
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
