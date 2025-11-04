import { message } from 'ant-design-vue';

import { $t } from '#/locales';

export enum UploadType {
  Image = 'image',
  Video = 'video',
  Voice = 'voice',
}

interface UploadTypeConfig {
  allowTypes: string[];
  maxSizeMB: number;
  name: string;
}

export interface UploadRawFile {
  name: string;
  size: number;
  type: string;
}

const UPLOAD_CONFIGS: Record<UploadType, UploadTypeConfig> = {
  [UploadType.Image]: {
    allowTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/jpg',
    ],
    maxSizeMB: 2,
    name: '图片',
  },
  [UploadType.Video]: {
    allowTypes: ['video/mp4'],
    maxSizeMB: 10,
    name: '视频',
  },
  [UploadType.Voice]: {
    allowTypes: [
      'audio/mp3',
      'audio/mpeg',
      'audio/wma',
      'audio/wav',
      'audio/amr',
    ],
    maxSizeMB: 2,
    name: '语音',
  },
};

export const useBeforeUpload = (type: UploadType, maxSizeMB?: number) => {
  const fn = (rawFile: UploadRawFile): boolean => {
    const config = UPLOAD_CONFIGS[type];
    const finalMaxSize = maxSizeMB ?? config.maxSizeMB;

    // 格式不正确
    if (!config.allowTypes.includes(rawFile.type)) {
      message.error($t('mp.upload.invalidFormat', [config.name]));
      return false;
    }

    // 大小不正确
    if (rawFile.size / 1024 / 1024 > finalMaxSize) {
      message.error($t('mp.upload.maxSize', [config.name, finalMaxSize]));
      return false;
    }

    return true;
  };

  return fn;
};
