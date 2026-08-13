import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsSubjectApi } from '#/api/fms/config/subject';

import { DICT_TYPE } from '@vben/constants';

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<FmsSubjectApi.Subject>['columns'] {
  return [
    { type: 'checkbox', width: 48 },
    { field: 'code', title: '编码', minWidth: 130, treeNode: true },
    { field: 'name', title: '名称', minWidth: 190, showOverflow: 'tooltip' },
    {
      title: '类别',
      minWidth: 120,
      slots: { default: 'category' },
    },
    {
      field: 'balanceDirection',
      title: '余额方向',
      width: 90,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.FMS_DEBIT_CREDIT_DIRECTION },
      },
    },
    {
      field: 'auxiliaryTypeNames',
      title: '辅助核算',
      minWidth: 150,
      showOverflow: 'tooltip',
      formatter: ({ cellValue }) =>
        Array.isArray(cellValue) ? cellValue.join('、') : '',
    },
    {
      title: '数量',
      width: 90,
      align: 'center',
      formatter: ({ row }) =>
        row.quantityAccounting ? (row.quantityUnit ?? '') : '',
    },
    {
      field: 'cash',
      title: '现金项',
      width: 90,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      align: 'center',
      slots: { default: 'status' },
    },
    {
      title: '操作',
      width: 190,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
