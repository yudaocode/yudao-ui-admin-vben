import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BpmTaskApi } from '#/api/bpm/task';

import { useAccess } from '@vben/access';

import { getCategorySimpleList } from '#/api/bpm/category';
import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

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
      fieldName: 'processDefinitionId',
      label: '所属流程',
      component: 'Input',
      componentProps: {
        placeholder: '请输入流程定义的编号',
        allowClear: true,
      },
    },
    // 流程分类
    {
      fieldName: 'category',
      label: '流程分类',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请输入流程分类',
        allowClear: true,
        api: getCategorySimpleList,
        labelField: 'name',
        valueField: 'code',
      },
    },
    // 流程状态
    {
      fieldName: 'status',
      label: '流程状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
          'number',
        ),
        placeholder: '请选择流程状态',
        allowClear: true,
      },
    },
    // 发起时间
    {
      fieldName: 'createTime',
      label: '发起时间',
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
      field: 'name',
      title: '流程名称',
      minWidth: 200,
      fixed: 'left',
    },
    {
      field: 'processInstance.summary',
      title: '摘要',
      minWidth: 200,
      slots: {
        default: 'slot-summary',
      },
    },

    {
      field: 'processInstance.startUser.nickname',
      title: '发起人',
      minWidth: 120,
    },

    {
      field: 'createTime',
      title: '发起时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },

    {
      field: 'name',
      title: '当前任务',
      minWidth: 180,
    },

    {
      field: 'createTime',
      title: '任务时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },

    {
      field: 'processInstanceId',
      title: '流程编号',
      minWidth: 280,
    },

    {
      field: 'id',
      title: '任务编号',
      minWidth: 280,
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
            code: 'audit',
            text: '办理',
            show: hasAccessByCodes(['bpm:task:query']),
          },
        ],
      },
    },
  ];
}
