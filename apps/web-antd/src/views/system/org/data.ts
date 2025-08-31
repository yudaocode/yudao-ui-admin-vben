import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OrgApi } from '#/api/system/org';

import { handleTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { getOrgList } from '#/api/system/org';
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
      fieldName: 'parentId',
      label: '上级组织',
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: async () => {
          const data = await getOrgList({});
          data.unshift({
            id: 0,
            name: '顶级组织',
          });
          return handleTree(data);
        },
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择上级组织',
        treeDefaultExpandAll: true,
      },
      rules: 'selectRequired',
      defaultValue: 0,
    },
    {
      fieldName: 'name',
      label: '组织名称',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入组织名称',
      },
    },
    {
      fieldName: 'abbreviation',
      label: '组织简称',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入组织简称',
      },
    },
    {
      fieldName: 'sort',
      label: '显示顺序',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入显示顺序',
      },
      defaultValue: 0,
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

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '组织名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入组织名称',
      },
    },
    {
      fieldName: 'abbreviation',
      label: '组织简称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入组织简称',
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
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<OrgApi.Org>['columns'] {
  return [
    {
      field: 'id',
      title: '组织id',
      minWidth: 120,
    },
    {
      field: 'name',
      title: '组织名称',
      minWidth: 120,
      treeNode: true,
    },
    {
      field: 'abbreviation',
      title: '组织简称',
      minWidth: 120,
    },
    {
      field: 'sort',
      title: '显示顺序',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '部门状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 120,
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
