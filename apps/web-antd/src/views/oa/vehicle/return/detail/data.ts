import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { Tag } from 'ant-design-vue';

import { DictTag } from '#/components/dict-tag';

/** 还车申请详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'no',
      label: '还车申请单号',
    },
    {
      field: 'applyNo',
      label: '用车申请单号',
    },
    {
      field: 'vehicleNo',
      label: '车牌号',
    },
    {
      field: 'actualStartTime',
      label: '实际出车时间',
      render: (value) => formatDateTime(value) || '-',
    },
    {
      field: 'startLocation',
      label: '实际出车地点',
    },
    {
      field: 'reason',
      label: '用车事由',
    },
    {
      field: 'passenger',
      label: '随行人',
    },
    {
      field: 'actualReturnTime',
      label: '实际回车时间',
      render: (value) => formatDateTime(value) || '-',
    },
    {
      field: 'returnLocation',
      label: '实际回车地点',
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
      field: 'remark',
      label: '还车说明',
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
