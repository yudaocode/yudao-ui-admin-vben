import type { VxeTableGridOptions } from '#/adapter/vxe-table';

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      width: 80,
    },
    {
      field: 'walletId',
      title: '钱包编号',
      width: 100,
    },
    {
      field: 'title',
      title: '关联业务标题',
      width: 200,
    },
    {
      field: 'price',
      title: '交易金额',
      width: 120,
      formatter: ({ cellValue }) => `${cellValue / 100} 元`,
    },
    {
      field: 'balance',
      title: '钱包余额',
      width: 120,
      formatter: ({ cellValue }) => `${cellValue / 100} 元`,
    },
    {
      field: 'createTime',
      title: '交易时间',
      width: 180,
      formatter: 'formatDateTime',
    },
  ];
}
