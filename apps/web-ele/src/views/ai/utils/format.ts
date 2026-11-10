/** 格式化 Token 数：null 表示未取得，真实 0 显示 0 */
export function formatTokenCount(value?: null | number) {
  return value === null || value === undefined
    ? '未取得'
    : value.toLocaleString();
}

/** 格式化音乐时长（秒）为 mm:ss；为空时返回 - */
export function formatMusicDuration(seconds?: null | number): string {
  if (seconds === undefined || seconds === null || Number.isNaN(seconds)) {
    return '-';
  }
  const total = Math.max(0, Math.floor(seconds));
  const minute = Math.floor(total / 60);
  const second = total % 60;
  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

/** 音乐名称为空时的展示文案 */
export function getMusicTitle(title?: null | string): string {
  return title || '未命名歌曲';
}
