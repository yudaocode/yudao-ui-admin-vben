import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { handleTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { getDeptList } from '#/api/system/dept';
import { CommonStatusEnum, DICT_TYPE, getDictOptions } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
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
      fieldName: 'name',
      label: '状态组名',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'deptIds',
      label: '应用部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => {
          const data = await getDeptList();
          return handleTree(data);
        },
        multiple: true,
        fieldNames: { label: 'name', value: 'id', children: 'children' },
        placeholder: '请选择应用部门',
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '状态组名',
    },
    {
      field: 'deptNames',
      title: '应用部门',
      formatter: ({ cellValue }) =>
        cellValue?.length > 0 ? cellValue.join(' ') : '全公司',
    },
    {
      field: 'creator',
      title: '创建人',
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
