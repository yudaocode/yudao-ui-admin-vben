interface UploadChangeInfo {
  file: {
    error?: unknown;
    response?: unknown;
    status?: string;
  };
}

interface UploadChangeResult<T> {
  error?: Error;
  response?: T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Ant Design Vue only reports upload completion through the change event.
 * Keep response/error extraction in one place so intermediate states do not
 * update the draft cover.
 */
export function parseCoverUploadChange<T>(
  info: UploadChangeInfo,
): UploadChangeResult<T> {
  if (info.file.status === 'done' || info.file.status === 'success') {
    if (!isRecord(info.file.response)) {
      return { error: new Error('上传响应格式错误') };
    }
    return { response: info.file.response as T };
  }
  if (info.file.status === 'error') {
    return {
      error:
        info.file.error instanceof Error
          ? info.file.error
          : new Error('上传失败'),
    };
  }
  return {};
}
