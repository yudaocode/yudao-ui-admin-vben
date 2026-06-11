import { requestClient } from '#/api/request';

export namespace MesCalCalendarApi {
  /** 排班日历班组排班项 */
  export interface CalendarTeamShiftItem {
    teamId?: number; // 班组编号
    teamName?: string; // 班组名称
    shiftId?: number; // 班次编号
    shiftName?: string; // 班次名称
    sort?: number; // 排序
  }

  /** 排班日历天 */
  export interface CalendarDay {
    day?: string; // 日期
    shiftType?: number; // 轮班方式
    teamShifts?: CalendarTeamShiftItem[]; // 班组班次
  }
}

/** 查询排班日历列表 */
export function getCalendarList(params: any) {
  return requestClient.get<MesCalCalendarApi.CalendarDay[]>(
    '/mes/cal/calendar/list',
    { params },
  );
}
