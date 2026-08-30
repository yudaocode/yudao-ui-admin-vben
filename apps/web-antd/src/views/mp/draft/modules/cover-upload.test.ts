import { describe, expect, it } from 'vitest';

import { parseCoverUploadChange } from './cover-upload';

describe('parseCoverUploadChange', () => {
  it('reads the material response from ant-design-vue upload change events', () => {
    const response = {
      code: 0,
      data: {
        mediaId: 'media-id',
        url: 'https://example.com/cover.jpg',
      },
    };

    expect(
      parseCoverUploadChange({
        file: {
          response,
          status: 'done',
        },
      }),
    ).toEqual({ response });
  });

  it('accepts the success status used by some upload adapters', () => {
    const response = { code: 0 };

    expect(
      parseCoverUploadChange({
        file: {
          response,
          status: 'success',
        },
      }),
    ).toEqual({ response });
  });

  it('returns an error for a malformed completed response', () => {
    const result = parseCoverUploadChange({
      file: {
        response: undefined,
        status: 'done',
      },
    });

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('上传响应格式错误');
  });

  it('returns the upload error from failed change events', () => {
    const error = new Error('network error');

    expect(
      parseCoverUploadChange({
        file: {
          error,
          status: 'error',
        },
      }),
    ).toEqual({ error });
  });

  it('ignores intermediate upload states', () => {
    expect(
      parseCoverUploadChange({
        file: {
          status: 'uploading',
        },
      }),
    ).toEqual({});
  });
});
