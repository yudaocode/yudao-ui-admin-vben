import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BpmTaskApi } from '#/api/bpm/task';

import { useAccess } from '@vben/access';

import { getRangePickerDefaultProps } from '#/utils';

const { hasAccessByCodes } = useAccess();

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '流程名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入流程名称',
        allowClear: true,
      },
    },

    {
      fieldName: 'createTime',
      label: '抄送时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = BpmTaskApi.TaskVO>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'processInstanceName',
      title: '流程名称',
      minWidth: 200,
      fixed: 'left',
    },
    {
      field: 'summary',
      title: '摘要',
      minWidth: 200,
      slots: {
        default: 'slot-summary',
      },
    },

    {
      field: 'startUser.nickname',
      title: '流程发起人',
      minWidth: 120,
    },

    {
      field: 'processInstanceStartTime',
      title: '流程发起时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },

    {
      field: 'activityName',
      title: '抄送节点',
      minWidth: 180,
    },

    {
      field: 'createUser.nickname',
      title: '抄送人',
      minWidth: 180,
      slots: {
        default: 'slot-createUser',
      },
    },
    {
      field: 'reason',
      title: '抄送意见',
      minWidth: 180,
    },

    {
      field: 'createTime',
      title: '抄送时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },

    {
      field: 'operation',
      title: '操作',
      minWidth: 120,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '流程名称',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            text: '详情',
            show: hasAccessByCodes(['bpm:task:query']),
          },
        ],
      },
    },
  ];
}
