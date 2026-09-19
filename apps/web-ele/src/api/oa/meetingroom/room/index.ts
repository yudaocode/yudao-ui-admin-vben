import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaMeetingRoomApi {
  /** OA 会议室 */
  export interface MeetingRoom {
    id?: number; // 编号
    name?: string; // 名称
    location?: string; // 位置
    type?: number; // 类型
    managerUserId?: number; // 管理员编号
    managerName?: string; // 管理员
    managerPhone?: string; // 联系电话
    status?: number; // 状态
    picUrl?: string; // 照片
    seatCount?: number; // 座位数
    equipments: number[]; // 设备
    allowBooking?: boolean; // 允许预定
    needApproval?: boolean; // 需要审批
    bookingScope?: number; // 预定范围
    bookingUserIds: number[]; // 指定成员
    sort?: number; // 排序
    remark?: string; // 备注
    fileUrls: string[]; // 附件
    createTime?: string; // 创建时间
  }
}

/** 查询会议室分页 */
export function getMeetingRoomPage(params: PageParam) {
  return requestClient.get<PageResult<OaMeetingRoomApi.MeetingRoom>>(
    '/oa/meeting-room/page',
    { params },
  );
}

/** 查询会议室详情 */
export function getMeetingRoom(id: number) {
  return requestClient.get<OaMeetingRoomApi.MeetingRoom>('/oa/meeting-room/get', {
    params: { id },
  });
}

/** 新增会议室 */
export function createMeetingRoom(data: Partial<OaMeetingRoomApi.MeetingRoom>) {
  return requestClient.post<number>('/oa/meeting-room/create', data);
}

/** 修改会议室 */
export function updateMeetingRoom(data: Partial<OaMeetingRoomApi.MeetingRoom>) {
  return requestClient.put<boolean>('/oa/meeting-room/update', data);
}

/** 删除会议室 */
export function deleteMeetingRoom(id: number) {
  return requestClient.delete<boolean>('/oa/meeting-room/delete', {
    params: { id },
  });
}

/** 查询可预定的会议室分页 */
export function getBookableMeetingRoomPage(params: PageParam) {
  return requestClient.get<PageResult<OaMeetingRoomApi.MeetingRoom>>(
    '/oa/meeting-room/bookable-page',
    { params },
  );
}
