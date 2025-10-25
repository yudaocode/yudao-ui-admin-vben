import type { VbenFormSchema } from '#/adapter/form';
import type { MpAccountApi } from '#/api/mp/account';

import { beginOfDay, endOfDay, formatDateTime } from '@vben/utils';

import { getSimpleAccountList } from '#/api/mp/account';

/** 关联数据 */
let accountList: MpAccountApi.AccountSimple[] = [];
getSimpleAccountList().then((data) => (accountList = data));

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'accountId',
      label: '公众号',
      component: 'ApiSelect',
      componentProps: {
        options: accountList.map((item) => ({
          label: item.name,
          value: item.id,
        })),
        placeholder: '请选择公众号',
        clearable: true,
      },
      defaultValue: accountList[0]?.id,
    },
    {
      fieldName: 'dateRange',
      label: '时间范围',
      component: 'RangePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
      defaultValue: [
        formatDateTime(beginOfDay(new Date(Date.now() - 3600 * 1000 * 24 * 7))),
        formatDateTime(endOfDay(new Date(Date.now() - 3600 * 1000 * 24))),
      ] as [Date, Date],
    },
  ];
}
