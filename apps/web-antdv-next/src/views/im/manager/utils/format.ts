import { formatDateTime } from '@vben/utils';

/** 展示用户名称 */
export function formatUserLabel(
  nickname: string | undefined,
  userId: number | undefined,
) {
  if (!userId) {
    return '-';
  }
  return `${nickname || '-'} (${userId})`;
}

/** 展示群名称 */
export function formatGroupLabel(
  name: string | undefined,
  groupId: number | undefined,
) {
  if (!groupId) {
    return '-';
  }
  return `${name || '-'} (${groupId})`;
}

/** 展示日期时间 */
export function formatDateTimeText(value?: Date | number | string) {
  return value ? (formatDateTime(value) as string) : '-';
}

/** 格式化 JSON */
export function formatJsonText(content?: string) {
  if (!content) {
    return '';
  }
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

/** 探测图片尺寸 */
export function probeImageSize(url: string) {
  return new Promise<{ height: number; width: number }>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    });
    img.addEventListener('error', reject);
    img.src = url;
  });
}
