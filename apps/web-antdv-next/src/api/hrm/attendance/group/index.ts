import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmAttendanceGroupApi {
  export interface Point {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }

  export interface Wifi {
    ssid: string;
    mac?: string;
  }

  export interface Shift {
    weeks: number[];
    startTime: string;
    endTime: string;
    clockInStartTime: string;
    clockInEndTime: string;
    clockOutStartTime: string;
    clockOutEndTime: string;
    restStartTime: string;
    restEndTime: string;
    excludeRestTime: boolean;
  }

  export interface SpecialDate {
    type?: number;
    date?: Date | number | string;
  }

  export interface DeductRule {
    lateMethod: number;
    lateDeductMoney: number;
    earlyMethod: number;
    earlyDeductMoney: number;
    absenteeismMethod: number;
    absenteeismDeductMoney: number;
    misscardMethod: number;
    misscardDeductMoney: number;
  }

  export interface Group {
    id?: number;
    name: string;
    openWifiCard?: boolean;
    openPointCard?: boolean;
    rest?: boolean;
    defaultStatus?: boolean;
    specialDates?: SpecialDate[];
    deptIds?: number[];
    deptNames?: string[];
    employeeIds?: number[];
    employeeNames?: string[];
    shifts?: Shift[];
    points?: Point[];
    wifis?: Wifi[];
    deductRule?: DeductRule;
    createTime?: Date;
  }
}

export function getAttendanceGroupPage(params: PageParam) {
  return requestClient.get<PageResult<HrmAttendanceGroupApi.Group>>(
    '/hrm/attendance/group/page',
    { params },
  );
}

export function getAttendanceGroup(id: number) {
  return requestClient.get<HrmAttendanceGroupApi.Group>(
    '/hrm/attendance/group/get',
    { params: { id } },
  );
}

export function createAttendanceGroup(data: HrmAttendanceGroupApi.Group) {
  return requestClient.post<number>('/hrm/attendance/group/create', data);
}

export function updateAttendanceGroup(data: HrmAttendanceGroupApi.Group) {
  return requestClient.put<boolean>('/hrm/attendance/group/update', data);
}

export function deleteAttendanceGroup(id: number) {
  return requestClient.delete<boolean>('/hrm/attendance/group/delete', {
    params: { id },
  });
}
