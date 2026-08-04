import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmAttendanceHolidayApi {
  /** 节假日 */
  export interface AttendanceHoliday {
    id?: number; // 节假日编号
    date?: number | string; // 日期
    type: number; // 日期类型
    createTime?: Date; // 创建时间
  }
}

/** 查询节假日分页 */
export function getAttendanceHolidayPage(params: PageParam) {
  return requestClient.get<
    PageResult<HrmAttendanceHolidayApi.AttendanceHoliday>
  >('/hrm/attendance/holiday/page', { params });
}

/** 查询节假日 */
export function getAttendanceHoliday(id: number) {
  return requestClient.get<HrmAttendanceHolidayApi.AttendanceHoliday>(
    '/hrm/attendance/holiday/get',
    { params: { id } },
  );
}

/** 新增节假日 */
export function createAttendanceHoliday(
  data: HrmAttendanceHolidayApi.AttendanceHoliday,
) {
  return requestClient.post<number>('/hrm/attendance/holiday/create', data);
}

/** 修改节假日 */
export function updateAttendanceHoliday(
  data: HrmAttendanceHolidayApi.AttendanceHoliday,
) {
  return requestClient.put<boolean>('/hrm/attendance/holiday/update', data);
}

/** 删除节假日 */
export function deleteAttendanceHoliday(id: number) {
  return requestClient.delete<boolean>('/hrm/attendance/holiday/delete', {
    params: { id },
  });
}
