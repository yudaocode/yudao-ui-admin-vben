import { requestClient } from '#/api/request';

export namespace MesCalHolidayApi {
  /** MES 假期设置 */
  export interface Holiday {
    id?: number; // 编号
    day?: number | string; // 日期
    type?: number; // 日期类型
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }

  /** 假期查询参数 */
  export interface HolidayQuery {
    startDay?: string;
    endDay?: string;
  }
}

/** 查询假期设置列表 */
export function getHolidayList(params?: MesCalHolidayApi.HolidayQuery) {
  return requestClient.get<MesCalHolidayApi.Holiday[]>(
    '/mes/cal/holiday/list',
    { params },
  );
}

/** 根据日期查询假期设置 */
export function getHolidayByDay(day: string) {
  return requestClient.get<MesCalHolidayApi.Holiday>(
    '/mes/cal/holiday/get-by-day',
    { params: { day } },
  );
}

/** 保存假期设置 */
export function saveHoliday(data: MesCalHolidayApi.Holiday) {
  return requestClient.post('/mes/cal/holiday/save', data);
}
