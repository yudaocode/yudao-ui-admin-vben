import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ImManagerChannelApi {
  /** 频道 */
  export interface Channel {
    id: number;
    code: string;
    name: string;
    avatar?: string;
    sort: number;
    status: number;
    createTime?: Date;
  }
}

/** 获得频道分页 */
export function getManagerChannelPage(params: PageParam) {
  return requestClient.get<PageResult<ImManagerChannelApi.Channel>>(
    '/im/manager/channel/page',
    { params },
  );
}

/** 获得频道详情 */
export function getManagerChannel(id: number) {
  return requestClient.get<ImManagerChannelApi.Channel>(
    '/im/manager/channel/get',
    {
      params: { id },
    },
  );
}

/** 新增频道 */
export function createManagerChannel(data: ImManagerChannelApi.Channel) {
  return requestClient.post<number>('/im/manager/channel/create', data);
}

/** 修改频道 */
export function updateManagerChannel(data: ImManagerChannelApi.Channel) {
  return requestClient.put<boolean>('/im/manager/channel/update', data);
}

/** 删除频道 */
export function deleteManagerChannel(id: number) {
  return requestClient.delete<boolean>('/im/manager/channel/delete', {
    params: { id },
  });
}

/** 获得启用的频道精简列表（表单选择用） */
export function getSimpleChannelList() {
  return requestClient.get<ImManagerChannelApi.Channel[]>(
    '/im/manager/channel/simple-list',
  );
}
