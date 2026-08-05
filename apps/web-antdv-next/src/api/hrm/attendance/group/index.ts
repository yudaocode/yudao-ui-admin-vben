import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmAttendanceGroupApi {
  /** 打卡地点 */
  export interface Point {
    name: string; // 地点名称
    address?: string; // 定位地址
    latitude?: number; // 纬度
    longitude?: number; // 经度
    radius?: number; // 有效打卡半径（米）
  }

  /** 打卡 WiFi */
  export interface Wifi {
    ssid: string; // WiFi 名称
    mac?: string; // MAC 地址
  }

  /** 班次 */
  export interface Shift {
    weeks: number[]; // 工作日数组
    startTime: string; // 上班时间
    endTime: string; // 下班时间
    clockInStartTime: string; // 上班打卡开始时间
    clockInEndTime: string; // 上班打卡结束时间
    clockOutStartTime: string; // 下班打卡开始时间
    clockOutEndTime: string; // 下班打卡结束时间
    restStartTime: string; // 休息开始时间
    restEndTime: string; // 休息结束时间
    excludeRestTime: boolean; // 休息时间是否不计入工作时长
  }

  /** 特殊日期 */
  export interface SpecialDate {
    type?: number; // 日期类型
    date?: Date | number | string; // 特殊日期
  }

  /** 扣款规则 */
  export interface DeductRule {
    lateMethod: number; // 迟到扣款方式
    lateDeductMoney: number; // 迟到扣款金额
    earlyMethod: number; // 早退扣款方式
    earlyDeductMoney: number; // 早退扣款金额
    absenteeismMethod: number; // 旷工扣款方式
    absenteeismDeductMoney: number; // 旷工扣款金额
    misscardMethod: number; // 缺卡扣款方式
    misscardDeductMoney: number; // 缺卡扣款金额
  }

  /** 考勤组 */
  export interface AttendanceGroup {
    id?: number; // 考勤组编号
    name: string; // 考勤组名称
    openWifiCard?: boolean; // 是否启用 WiFi 打卡
    openPointCard?: boolean; // 是否启用定位打卡
    rest?: boolean; // 是否法定节假日休息
    defaultStatus?: boolean; // 是否默认考勤组
    specialDates?: SpecialDate[]; // 特殊日期配置数组
    deptIds?: number[]; // 适用部门编号数组
    deptNames?: string[]; // 适用部门名称数组
    employeeIds?: number[]; // 适用员工编号数组
    employeeNames?: string[]; // 适用员工名称数组
    shifts?: Shift[]; // 班次配置
    points?: Point[]; // 打卡地点数组
    wifis?: Wifi[]; // 打卡 WiFi 数组
    deductRule?: DeductRule; // 扣款规则
    createTime?: Date; // 创建时间
  }
}

/** 查询考勤组分页 */
export function getAttendanceGroupPage(params: PageParam) {
  return requestClient.get<PageResult<HrmAttendanceGroupApi.AttendanceGroup>>(
    '/hrm/attendance/group/page',
    { params },
  );
}

/** 查询考勤组 */
export function getAttendanceGroup(id: number) {
  return requestClient.get<HrmAttendanceGroupApi.AttendanceGroup>(
    '/hrm/attendance/group/get',
    { params: { id } },
  );
}

/** 新增考勤组 */
export function createAttendanceGroup(
  data: HrmAttendanceGroupApi.AttendanceGroup,
) {
  return requestClient.post<number>('/hrm/attendance/group/create', data);
}

/** 修改考勤组 */
export function updateAttendanceGroup(
  data: HrmAttendanceGroupApi.AttendanceGroup,
) {
  return requestClient.put<boolean>('/hrm/attendance/group/update', data);
}

/** 删除考勤组 */
export function deleteAttendanceGroup(id: number) {
  return requestClient.delete<boolean>('/hrm/attendance/group/delete', {
    params: { id },
  });
}
