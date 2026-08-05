import type { TableColumnsType } from 'antdv-next';

import type { HrmInsuranceMonthRecordApi } from '#/api/hrm/insurance/month-record';

export function useListColumns(): TableColumnsType<HrmInsuranceMonthRecordApi.InsuranceMonthRecord> {
  return [
    {
      title: '社保表',
      dataIndex: 'title',
      key: 'title',
      fixed: 'left',
      minWidth: 190,
    },
    {
      title: '参保人数',
      dataIndex: 'insuredEmployeeCount',
      key: 'insuredEmployeeCount',
      align: 'center',
      width: 100,
    },
    {
      title: '停保人数',
      dataIndex: 'stoppedEmployeeCount',
      key: 'stoppedEmployeeCount',
      align: 'center',
      width: 100,
    },
    {
      title: '个人社保',
      dataIndex: 'personalInsuranceAmount',
      key: 'personalInsuranceAmount',
      align: 'right',
      width: 120,
    },
    {
      title: '公司社保',
      dataIndex: 'corporateInsuranceAmount',
      key: 'corporateInsuranceAmount',
      align: 'right',
      width: 120,
    },
    {
      title: '个人公积金',
      dataIndex: 'personalProvidentFundAmount',
      key: 'personalProvidentFundAmount',
      align: 'right',
      width: 130,
    },
    {
      title: '公司公积金',
      dataIndex: 'corporateProvidentFundAmount',
      key: 'corporateProvidentFundAmount',
      align: 'right',
      width: 130,
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      fixed: 'right',
      width: 80,
    },
  ];
}
