import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmAttendanceHolidayApi {
  export interface Holiday {
    id?: number;
    date?: number | string;
    type: number;
    createTime?: Date;
  }
}

export function getAttendanceHolidayPage(params: PageParam) {
  return requestClient.get<PageResult<HrmAttendanceHolidayApi.Holiday>>(
    '/hrm/attendance/holiday/page',
    { params },
  );
}

export function getAttendanceHoliday(id: number) {
  return requestClient.get<HrmAttendanceHolidayApi.Holiday>(
    '/hrm/attendance/holiday/get',
    { params: { id } },
  );
}

export function createAttendanceHoliday(data: HrmAttendanceHolidayApi.Holiday) {
  return requestClient.post<number>('/hrm/attendance/holiday/create', data);
}

export function updateAttendanceHoliday(data: HrmAttendanceHolidayApi.Holiday) {
  return requestClient.put<boolean>('/hrm/attendance/holiday/update', data);
}

export function deleteAttendanceHoliday(id: number) {
  return requestClient.delete<boolean>('/hrm/attendance/holiday/delete', {
    params: { id },
  });
}
