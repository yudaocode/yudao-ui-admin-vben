import dayjs from 'dayjs';

import { isEmpty } from '.';

/** 时间段选择器拓展  */
export function rangePickerExtend() {
  return {
    // 显示格式
    format: 'YYYY-MM-DD HH:mm:ss',
    placeholder: ['开始时间', '结束时间'],
    ranges: {
      今天: [dayjs().startOf('day'), dayjs().endOf('day')],
      最近7天: [
        dayjs().subtract(7, 'day').startOf('day'),
        dayjs().endOf('day'),
      ],
      最近30天: [
        dayjs().subtract(30, 'day').startOf('day'),
        dayjs().endOf('day'),
      ],
      昨天: [
        dayjs().subtract(1, 'day').startOf('day'),
        dayjs().subtract(1, 'day').endOf('day'),
      ],
      本周: [dayjs().startOf('week'), dayjs().endOf('day')],
      本月: [dayjs().startOf('month'), dayjs().endOf('day')],
    },
    showTime: {
      defaultValue: [
        dayjs('00:00:00', 'HH:mm:ss'),
        dayjs('23:59:59', 'HH:mm:ss'),
      ],
      format: 'HH:mm:ss',
    },
    transformDateFunc: (dates: any) => {
      if (dates && dates.length === 2) {
        // 格式化为后台支持的时间格式
        return [dates.createTime[0], dates.createTime[1]].join(',');
      }
      return {};
    },
    // 如果需要10位时间戳（秒级）可以使用 valueFormat: 'X'
    valueFormat: 'YYYY-MM-DD HH:mm:ss',
  };
}

/**
 * 将时间转换为 `几秒前`、`几分钟前`、`几小时前`、`几天前`
 * @param param 当前时间，new Date() 格式或者字符串时间格式
 * @param format 需要转换的时间格式字符串
 * @description param 10秒：  10 * 1000
 * @description param 1分：   60 * 1000
 * @description param 1小时： 60 * 60 * 1000
 * @description param 24小时：60 * 60 * 24 * 1000
 * @description param 3天：   60 * 60* 24 * 1000 * 3
 * @returns 返回拼接后的时间字符串
 */
export function formatPast(
  param: Date | string,
  format = 'YYYY-MM-DD HH:mm:ss',
): string {
  // 传入格式处理、存储转换值
  let s: number, t: any;
  // 获取js 时间戳
  let time: number = Date.now();
  // 是否是对象
  typeof param === 'string' || typeof param === 'object'
    ? (t = new Date(param).getTime())
    : (t = param);
  // 当前时间戳 - 传入时间戳
  time = Number.parseInt(`${time - t}`);
  if (time < 10_000) {
    // 10秒内
    return '刚刚';
  } else if (time < 60_000 && time >= 10_000) {
    // 超过10秒少于1分钟内
    s = Math.floor(time / 1000);
    return `${s}秒前`;
  } else if (time < 3_600_000 && time >= 60_000) {
    // 超过1分钟少于1小时
    s = Math.floor(time / 60_000);
    return `${s}分钟前`;
  } else if (time < 86_400_000 && time >= 3_600_000) {
    // 超过1小时少于24小时
    s = Math.floor(time / 3_600_000);
    return `${s}小时前`;
  } else if (time < 259_200_000 && time >= 86_400_000) {
    // 超过1天少于3天内
    s = Math.floor(time / 86_400_000);
    return `${s}天前`;
  } else {
    // 超过3天
    const date =
      typeof param === 'string' || typeof param === 'object'
        ? new Date(param)
        : param;
    return dayjs(date).format(format);
  }
}

/**
 * 将毫秒，转换成时间字符串。例如说，xx 分钟
 *
 * @param ms 毫秒
 * @returns {string} 字符串
 */
export function formatPast2(ms: number): string {
  if (isEmpty(ms)) {
    return '';
  }
  // 定义时间单位常量，便于维护
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  // 计算各时间单位
  const day = Math.floor(ms / DAY);
  const hour = Math.floor((ms % DAY) / HOUR);
  const minute = Math.floor((ms % HOUR) / MINUTE);
  const second = Math.floor((ms % MINUTE) / SECOND);

  // 根据时间长短返回不同格式
  if (day > 0) {
    return `${day} 天${hour} 小时 ${minute} 分钟`;
  }
  if (hour > 0) {
    return `${hour} 小时 ${minute} 分钟`;
  }
  if (minute > 0) {
    return `${minute} 分钟`;
  }
  return second > 0 ? `${second} 秒` : `${0} 秒`;
}

/**
 * @param {Date | number | string} time 需要转换的时间
 * @param {string} fmt 需要转换的格式 如 yyyy-MM-dd、yyyy-MM-dd HH:mm:ss
 */
export function formatTime(time: Date | number | string, fmt: string) {
  if (time) {
    const date = new Date(time);
    const o = {
      'M+': date.getMonth() + 1,
      'd+': date.getDate(),
      'H+': date.getHours(),
      'm+': date.getMinutes(),
      's+': date.getSeconds(),
      'q+': Math.floor((date.getMonth() + 3) / 3),
      S: date.getMilliseconds(),
    };
    const yearMatch = fmt.match(/y+/);
    if (yearMatch) {
      fmt = fmt.replace(
        yearMatch[0],
        `${date.getFullYear()}`.slice(4 - yearMatch[0].length),
      );
    }
    for (const k in o) {
      const match = fmt.match(new RegExp(`(${k})`));
      if (match) {
        fmt = fmt.replace(
          match[0],
          match[0].length === 1
            ? (o[k as keyof typeof o] as any)
            : `00${o[k as keyof typeof o]}`.slice(
                `${o[k as keyof typeof o]}`.length,
              ),
        );
      }
    }
    return fmt;
  } else {
    return '';
  }
}
