import type { DescriptionItemSchema } from '#/components/description';

import { formatDateTime } from '@vben/utils';

/** 详情页的系统字段 */
export function useFollowUpDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'ownerUserName',
      label: '负责人',
    },
    {
      field: 'contactLastContent',
      label: '最后跟进记录',
    },
    {
      field: 'contactLastTime',
      label: '最后跟进时间',
      content: (data) => formatDateTime(data?.contactLastTime) as string,
    },
    {
      field: 'creatorName',
      label: '创建人',
    },
    {
      field: 'createTime',
      label: '创建时间',
      content: (data) => formatDateTime(data?.createTime) as string,
    },
    {
      field: 'updateTime',
      label: '更新时间',
      content: (data) => formatDateTime(data?.updateTime) as string,
    },
  ];
}
