import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { useUserStore } from '@vben/stores';
import {
  beginOfDay,
  endOfDay,
  erpCalculatePercentage,
  formatDateTime,
  handleTree,
} from '@vben/utils';

import { getSimpleDeptList } from '#/api/system/dept';
import { getSimpleUserList } from '#/api/system/user';
import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

const userStore = useUserStore();

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'times',
      label: '时间范围',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
      },
      defaultValue: [
        formatDateTime(beginOfDay(new Date(Date.now() - 3600 * 1000 * 24 * 7))),
        formatDateTime(endOfDay(new Date(Date.now() - 3600 * 1000 * 24))),
      ] as [Date, Date],
    },
    {
      fieldName: 'interval',
      label: '时间间隔',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.DATE_INTERVAL, 'number'),
      },
      defaultValue: 2,
    },
    {
      fieldName: 'deptId',
      label: '归属部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => {
          const data = await getSimpleDeptList();
          return handleTree(data);
        },
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        treeDefaultExpandAll: true,
      },
      defaultValue: userStore.userInfo?.deptId,
    },
    {
      fieldName: 'userId',
      label: '员工',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        allowClear: true,
        labelField: 'nickname',
        valueField: 'id',
      },
    },
  ];
}

/** 列表的字段 */
export function useSummaryGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'seq',
      title: '序号',
    },
    {
      field: 'ownerUserName',
      title: '员工姓名',
      minWidth: 100,
    },
    {
      field: 'customerCreateCount',
      title: '新增客户数',
      minWidth: 200,
    },
    {
      field: 'customerDealCount',
      title: '成交客户数',
      minWidth: 200,
    },
    {
      field: 'customerDealRate',
      title: '客户成交率(%)',
      minWidth: 200,
      formatter: ({ row }) => {
        return erpCalculatePercentage(
          row.customerDealCount,
          row.customerCreateCount,
        );
      },
    },
    {
      field: 'contractPrice',
      title: '合同总金额',
      minWidth: 200,
      formatter: 'formatAmount2',
    },
    {
      field: 'receivablePrice',
      title: '回款金额',
      minWidth: 200,
      formatter: 'formatAmount2',
    },
    {
      field: 'creceivablePrice',
      title: '未回款金额',
      minWidth: 200,
      formatter: ({ row }) => {
        return erpCalculatePercentage(row.receivablePrice, row.contractPrice);
      },
    },
    {
      field: 'ccreceivablePrice',
      title: '回款完成率(%)',
      formatter: ({ row }) => {
        return erpCalculatePercentage(row.receivablePrice, row.contractPrice);
      },
    },
  ];
}
