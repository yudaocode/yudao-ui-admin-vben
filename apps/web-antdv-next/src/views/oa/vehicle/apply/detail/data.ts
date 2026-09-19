import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { formatDateTime } from '@vben/utils';

import { Tag } from 'antdv-next';

import { DictTag } from '#/components/dict-tag';

/** 用车申请详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'no',
      label: '申请单号',
    },
    {
      field: 'vehicleNo',
      label: '车牌号',
    },
    {
      field: 'startTime',
      label: '预计出车时间',
      render: (value) => formatDateTime(value) || '-',
    },
    {
      field: 'endTime',
      label: '预计回车时间',
      render: (value) => formatDateTime(value) || '-',
    },
    {
      field: 'startLocation',
      label: '出车地点',
    },
    {
      field: 'endLocation',
      label: '预计回车地点',
    },
    {
      field: 'reason',
      label: '用车事由',
      span: 2,
    },
    {
      field: 'status',
      label: '审批状态',
      render: (value) => {
        if (value === BpmProcessInstanceStatus.NOT_START) {
          return h(Tag, () => '未提交');
        }
        return value === undefined
          ? undefined
          : h(DictTag, { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, value });
      },
    },
    {
      field: 'returnStatus',
      label: '还车状态',
      render: (value) => getDictLabel(DICT_TYPE.OA_VEHICLE_RETURN_STATUS, value),
    },
    {
      field: 'remark',
      label: '备注',
      span: 2,
    },
    {
      field: 'fileUrls',
      label: '附件',
      span: 2,
      slot: 'fileUrls',
    },
  ];
}
