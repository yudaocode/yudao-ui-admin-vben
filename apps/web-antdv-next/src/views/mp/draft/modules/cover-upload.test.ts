import { describe, expect, it } from 'vitest';

import { parseCoverUploadChange } from './cover-upload';

describe('parseCoverUploadChange', () => {
  it('reads the material response from antdv upload change events', () => {
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
