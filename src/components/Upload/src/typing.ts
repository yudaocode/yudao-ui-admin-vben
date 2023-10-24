import type { BasicColumn } from '../../Table'
import type { UploadApiResult } from '@/api/base/model/uploadModel'

export enum UploadResultStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  UPLOADING = 'uploading',
}

export interface FileItem {
  thumbUrl?: string
  name: string
  size: string | number
  type?: string
  percent: number
  file: File
  status?: UploadResultStatus
  responseData?: UploadApiResult
  uuid: string
}

export interface PreviewFileItem {
  url: string
  name: string
  type: string
}

export interface FileBasicColumn extends Omit<BasicColumn, 'customRender'> {
  /**
   * Renderer of the table cell. The return value should be a VNode, or an object for colSpan/rowSpan config
   * @type Function | ScopedSlot
   */
  customRender?: Fn
  /**
   * Title of this column
   * @type any (string | slot)
   */
  title: string
  /**
   * Display field of the data record, could be set like a.b.c
   * @type string
   */
  dataIndex: string
}
