import { requestClient } from '#/api/request';

export namespace HrmPortalAttendanceClockApi {
  /** 员工端打卡记录 */
  export interface AttendanceRecord {
    id: number; // 打卡记录编号
    employeeId: number; // 打卡员工编号
    clockTime: Date; // 打卡时间
    type?: number; // 打卡类型
    attendanceTime?: Date; // 应打卡时间
    sourceType?: number; // 打卡来源
    status?: number; // 打卡状态
    stage?: number; // 打卡阶段
    address?: string; // 打卡地址
    longitude?: number; // 经度
    latitude?: number; // 纬度
    ssid?: string; // WiFi 名称
    mac?: string; // WiFi MAC 地址
    remark?: string; // 备注
  }
}

/**
 * 获得我的考勤记录列表
 *
 * 说明：源 vue3 已提供该 API，当前 Portal 页面未引用（日明细由 statistics 承接）。
 * 保留迁移以与源 API 目录对齐，避免被误判为遗漏。
 */
export function getAttendanceRecordList(year?: number, month?: number) {
  return requestClient.get<HrmPortalAttendanceClockApi.AttendanceRecord[]>(
    '/hrm/portal/attendance/clock/list',
    { params: { year, month } },
  );
}
