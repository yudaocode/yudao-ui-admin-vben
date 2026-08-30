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

export function parseCoverUploadChange<T>(
  info: UploadChangeInfo,
): UploadChangeResult<T> {
  if (info.file.status === 'done') {
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
