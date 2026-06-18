// TODO @AI：全局有方法，可以替代的。
import type { AxiosProgressEvent } from '#/api/infra/file'

import { uploadFile } from '#/api/infra/file'

/** 上传文件 */
export async function updateFile(
  data: FormData,
  onUploadProgress?: AxiosProgressEvent
) {
  const file = data.get('file')
  if (!(file instanceof File)) {
    throw new TypeError('上传文件不能为空')
  }
  const directory = data.get('directory')
  const url = await uploadFile(
    {
      file,
      directory: typeof directory === 'string' ? directory : undefined
    },
    onUploadProgress
  )
  return { data: url }
}
