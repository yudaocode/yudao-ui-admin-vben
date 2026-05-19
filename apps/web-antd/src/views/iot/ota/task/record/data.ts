import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';

/** 升级记录的列表字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'deviceName',
      title: '设备名称',
      minWidth: 150,
      align: 'center',
    },
    {
      field: 'fromFirmwareVersion',
      title: '当前版本',
      width: 120,
      align: 'center',
    },
    {
      field: 'status',
      title: '升级状态',
      width: 120,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IOT_OTA_TASK_RECORD_STATUS },
      },
    },
    {
      field: 'progress',
      title: '升级进度',
      width: 120,
      align: 'center',
      formatter: ({ row }) => `${row.progress || 0}%`,
    },
    {
      field: 'description',
      title: '状态描述',
      minWidth: 150,
      align: 'center',
      showOverflow: 'tooltip',
    },
    {
      field: 'updateTime',
      title: '更新时间',
      width: 180,
      align: 'center',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}
