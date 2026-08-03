import { getDictLabel } from '@vben/hooks';

import { SolarDay } from 'tyme4ts';

/** 格式化带千分位的 HRM 金额 */
export function formatHrmMoneyWithThousands(value?: null | number): string {
  return Number(value || 0).toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

/** 格式化 HRM 分析项的字典分类 */
export function formatHrmAnalysisDictType(
  dictType: string,
  type: null | number,
): string {
  return type === null ? '未填写' : getDictLabel(dictType, type) || '未知';
}

/** 格式化 HRM 分析项的区间分类 */
export function formatHrmAnalysisRangeType(
  rangeNames: Record<number, string>,
  type: null | number,
): string {
  return type === null ? '未填写' : rangeNames[type] || '未知';
}

export interface HrmLunarDateInfo {
  dayText: string;
  monthDayText: string;
}

/** 获得 HRM 日历农历信息 */
export function getHrmLunarDateInfo(value: string): HrmLunarDateInfo {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return { dayText: '', monthDayText: '' };
  }
  try {
    const solarDay = SolarDay.fromYmd(year, month, day);
    const lunarDay = solarDay.getLunarDay();
    const lunarFestival = lunarDay.getFestival();
    const solarFestival = solarDay.getFestival();
    const lunarDayName = lunarDay.getName();
    return {
      dayText:
        lunarFestival?.getName() || solarFestival?.getName() || lunarDayName,
      monthDayText: `${lunarDay.getLunarMonth().getName()}${lunarDayName}`,
    };
  } catch {
    return { dayText: '', monthDayText: '' };
  }
}
