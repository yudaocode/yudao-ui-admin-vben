import type { UploadStatus } from 'element-plus';

export type UploadListType = 'picture' | 'picture-card' | 'text';

export type UploadStatus = 'error' | 'removed' | 'success' | 'uploading';

export enum UploadResultStatus {
  DONE = 'success',
  ERROR = 'error',
  REMOVED = 'removed',
  SUCCESS = 'success',
  UPLOADING = 'uploading',
}

export interface CustomUploadFile {
  uid: number;
  name: string;
  status: UploadStatus;
  url?: string;
  response?: any;
  percentage?: number;
  size?: number;
  raw?: File;
}

export function convertToUploadStatus(
  status: UploadResultStatus,
): UploadStatus {
  switch (status) {
    case UploadResultStatus.DONE: {
      return 'success';
    }
    case UploadResultStatus.ERROR: {
      return 'error';
    }
    case UploadResultStatus.REMOVED: {
      return 'removed';
    }
    case UploadResultStatus.UPLOADING: {
      return 'uploading';
    }
    default: {
      return 'success';
    }
  }
}
