import type { HrmHomeApi } from '#/api/hrm/home';

import { requestClient } from '#/api/request';

export type { HrmHomeApi };

/** 获得员工端首页日历 */
export function getEmployeeHomeCalendar(params: {
  endDate: string;
  startDate: string;
}) {
  return requestClient.get<HrmHomeApi.HomeCalendarItem[]>(
    '/hrm/portal/home/calendar',
    { params },
  );
}
