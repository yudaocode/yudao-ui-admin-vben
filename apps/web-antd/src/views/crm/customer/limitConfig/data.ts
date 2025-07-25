import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { handleTree } from '@vben/utils';

import { LimitConfType } from '#/api/crm/customer/limitConfig';
import { getSimpleDeptList } from '#/api/system/dept';
import { getSimpleUserList } from '#/api/system/user';
import { DICT_TYPE } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(confType: LimitConfType): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'userIds',
      label: '规则适用人群',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        fieldNames: {
          label: 'nickname',
          value: 'id',
        },
        mode: 'tags',
        allowClear: true,
      },
      rules: 'required',
    },
    {
      fieldName: 'deptIds',
      label: '规则适用部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => {
          const data = await getSimpleDeptList();
          return handleTree(data);
        },
        multiple: true,
        fieldNames: { label: 'name', value: 'id', children: 'children' },
        placeholder: '请选择规则适用部门',
        treeDefaultExpandAll: true,
      },
      rules: 'required',
    },
    {
      fieldName: 'maxCount',
      label:
        confType === LimitConfType.CUSTOMER_QUANTITY_LIMIT
          ? '拥有客户数上限'
          : '锁定客户数上限',
      component: 'InputNumber',
    },
    {
      fieldName: 'dealCountEnabled',
      label: '成交客户是否占用拥有客户数',
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '是', value: true },
          { label: '否', value: false },
        ],
      },
      dependencies: {
        triggerFields: [''],
        show: () => confType === LimitConfType.CUSTOMER_QUANTITY_LIMIT,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(
  confType: LimitConfType,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      fixed: 'left',
    },
    {
      field: 'users',
      title: '规则适用人群',
      formatter: ({ cellValue }) => {
        return cellValue
          .map((user: any) => {
            return user.nickname;
          })
          .join(',');
      },
    },
    {
      field: 'depts',
      title: '规则适用部门',
      formatter: ({ cellValue }) => {
        return cellValue
          .map((dept: any) => {
            return dept.name;
          })
          .join(',');
      },
    },
    {
      field: 'maxCount',
      title:
        confType === LimitConfType.CUSTOMER_QUANTITY_LIMIT
          ? '拥有客户数上限'
          : '锁定客户数上限',
    },
    {
      field: 'dealCountEnabled',
      title: '成交客户是否占用拥有客户数',
      visible: confType === LimitConfType.CUSTOMER_QUANTITY_LIMIT,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
