import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';

/** 选择监听器弹窗的列表字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'name', title: '名字', minWidth: 120 },
    {
      field: 'type',
      title: '类型',
      minWidth: 200,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BPM_PROCESS_LISTENER_TYPE },
      },
    },
    { field: 'event', title: '事件', minWidth: 200 },
    {
      field: 'valueType',
      title: '值类型',
      minWidth: 200,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BPM_PROCESS_LISTENER_VALUE_TYPE },
      },
    },
    { field: 'value', title: '值', minWidth: 150 },
    {
      title: '操作',
      width: 100,
      slots: { default: 'action' },
      fixed: 'right',
    },
  ];
}
