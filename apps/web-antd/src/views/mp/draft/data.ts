import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { WxAccountSelect } from '#/views/mp/components/wx-account-select';

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
      field: 'updateTime',
      title: '更新时间',
      minWidth: 180,
      formatter: 'formatDateTime',
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
// TODO @hw：这里的公众号选择，要改参考 /Users/yunai/Java/yudao-ui-admin-vben-v5/apps/web-antd/src/views/mp/tag/data.ts；相关联的代码还简单点~
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'accountId',
      label: '公众号',
      component: markRaw(WxAccountSelect),
    },
  ];
}
