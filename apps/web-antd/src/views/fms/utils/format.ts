import dayjs from 'dayjs';

const UPPERCASE_DIGITS = [
  '零',
  '壹',
  '贰',
  '叁',
  '肆',
  '伍',
  '陆',
  '柒',
  '捌',
  '玖',
];
const INTEGER_UNITS = ['', '拾', '佰', '仟'];
const GROUP_UNITS = ['', '万', '亿', '兆'];

/** 格式化四位整数分组的中文大写 */
function formatIntegerGroup(value: number) {
  let result = '';
  let zeroPending = false;
  for (let position = 3; position >= 0; position--) {
    const unitValue = 10 ** position;
    const digit = Math.floor(value / unitValue) % 10;
    if (digit === 0) {
      if (result && value % unitValue > 0) zeroPending = true;
      continue;
    }
    if (zeroPending) result += UPPERCASE_DIGITS[0];
    result += `${UPPERCASE_DIGITS[digit]}${INTEGER_UNITS[position]}`;
    zeroPending = false;
  }
  return result;
}

/** 格式化整数金额的中文大写 */
function formatIntegerAmount(value: number) {
  const groups: number[] = [];
  let remainingValue = value;
  while (remainingValue > 0) {
    groups.unshift(remainingValue % 10_000);
    remainingValue = Math.floor(remainingValue / 10_000);
  }

  let result = '';
  let zeroPending = false;
  groups.forEach((group, index) => {
    if (group === 0) {
      if (result) zeroPending = true;
      return;
    }
    if (result && (zeroPending || group < 1000)) result += UPPERCASE_DIGITS[0];
    result += `${formatIntegerGroup(group)}${GROUP_UNITS[groups.length - index - 1]}`;
    zeroPending = false;
  });
  return result;
}

/** 格式化金额的中文大写 */
export function formatUppercaseMoney(value: number) {
  if (!Number.isFinite(value)) return '';
  const amountInCents = Math.round(Math.abs(value) * 100);
  if (amountInCents === 0) return '零元整';

  const integerAmount = Math.floor(amountInCents / 100);
  const jiao = Math.floor((amountInCents % 100) / 10);
  const fen = amountInCents % 10;
  let result = integerAmount ? `${formatIntegerAmount(integerAmount)}元` : '';
  if (jiao === 0 && fen === 0) {
    result += '整';
  } else {
    if (jiao > 0) result += `${UPPERCASE_DIGITS[jiao]}角`;
    else if (integerAmount > 0 && fen > 0) result += UPPERCASE_DIGITS[0];
    if (fen > 0) result += `${UPPERCASE_DIGITS[fen]}分`;
  }
  return value < 0 ? `负${result}` : result;
}

/** 格式化非空金额 */
export function formatMoney(value?: number) {
  if (!value) return '';
  return Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** 格式化金额，空值按 0 展示 */
export function formatAmount(value?: number) {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** 格式化数量 */
export function formatQuantity(value?: number, enabled = true) {
  return enabled
    ? Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 4 })
    : '-';
}

/** 格式化汇率 */
export function formatExchangeRate(value?: number) {
  return Number(value || 0).toLocaleString('zh-CN', {
    useGrouping: false,
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

/** 格式化科目余额 */
export function formatSubjectBalance(value?: number, direction?: string) {
  return `${direction ? `${direction} ` : ''}${Number(value || 0).toFixed(2)}`;
}

/** 格式化科目展示名称 */
export function formatSubjectDisplay(
  code?: string,
  name?: string,
  auxiliaryNames: (string | undefined)[] = [],
) {
  if (!code && !name) return '';
  const names = auxiliaryNames.filter(Boolean);
  return `${code || ''} ${name || ''}${names.length ? ` / ${names.join('、')}` : ''}`;
}

/** 构建会计期间导出文件名 */
export function buildPeriodFilename(
  title: string,
  startMonth: string,
  endMonth: string,
) {
  const period =
    startMonth === endMonth ? startMonth : `${startMonth}至${endMonth}`;
  return `${title}-${period}.xls`;
}

/** 格式化会计期间文案 */
export function formatPeriodLabel(startMonth: string, endMonth: string) {
  const startLabel = dayjs(`${startMonth}-01`).format('YYYY年第MM期');
  const endLabel = dayjs(`${endMonth}-01`).format('YYYY年第MM期');
  return startLabel === endLabel
    ? startLabel
    : `${startLabel} 至 ${endLabel}`;
}
