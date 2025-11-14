import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MpAccountApi } from '#/api/mp/account';

import { getSimpleAccountList } from '#/api/mp/account';

/** 关联数据 */
let accountList: MpAccountApi.AccountSimple[] = [];
getSimpleAccountList().then((data) => (accountList = data));

/** 获取表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'content',
      title: '图文内容',
      minWidth: 300,
      slots: { default: 'content' },
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 列表的搜索表单 */
//  DONE @hw：这里的公众号选择，要改参考 /apps/web-antd/src/views/mp/tag/data.ts；相关联的代码还简单点~
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
      },
      defaultValue: accountList[0]?.id,
    },
  ];
}
