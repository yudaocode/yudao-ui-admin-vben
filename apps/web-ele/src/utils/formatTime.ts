/**
 * 将毫秒，转换成时间字符串。例如说，xx 分钟
 *
 * @param ms 毫秒
 * @returns {string} 字符串
 */
export function formatPast2(ms: number): string {
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
