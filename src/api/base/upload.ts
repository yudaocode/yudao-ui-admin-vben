import type { AxiosProgressEvent } from 'axios'
import type { UploadApiResult } from './model/uploadModel'
import { defHttp } from '@/utils/http/axios'
import type { UploadFileParams } from '@/types/axios'
import { useGlobSetting } from '@/hooks/setting'

const { uploadUrl = '' } = useGlobSetting()

/**
 * @description: Upload interface
 */
export function uploadApi(params: UploadFileParams, onUploadProgress: (progressEvent: AxiosProgressEvent) => void) {
  return defHttp.uploadFile<UploadApiResult>(
    {
      url: uploadUrl,
      onUploadProgress,
    },
    params,
  )
}
