import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BpmCategoryApi } from '#/api/bpm/category';

import { useAccess } from '@vben/access';

import { z } from '#/adapter/form';
import { getSimpleUserList } from '#/api/system/user';
import { CommonStatusEnum, DICT_TYPE, getDictOptions } from '#/utils';

const { hasAccessByCodes } = useAccess();
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
      label: '组名',
      component: 'Input',
      componentProps: {
        placeholder: '请输入组名',
      },
      rules: 'required',
    },
    {
      fieldName: 'description',
      label: '描述',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入描述',
      },
    },
    {
      fieldName: 'userIds',
      label: '成员',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择成员',
        api: getSimpleUserList,
        labelField: 'nickname',
        valueField: 'id',
        mode: 'tags',
      },
      rules: z.array(z.number()).min(1, '请选择成员').default([]),
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
      label: '组名',
      component: 'Input',
      componentProps: {
        placeholder: '请输入组名',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        placeholder: '请选择状态',
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        allowClear: true,
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        placeholder: ['开始时间', '结束时间'],
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = BpmCategoryApi.CategoryVO>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      minWidth: 100,
    },
    {
      field: 'name',
      title: '组名',
      minWidth: 200,
    },
    {
      field: 'description',
      title: '描述',
      minWidth: 200,
    },
    {
      field: 'userIds',
      title: '成员',
      minWidth: 200,
      slots: {
        default: 'userIds-cell',
      },
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 180,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '用户分组',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: hasAccessByCodes(['bpm:user-group:update']),
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['bpm:user-group:delete']),
          },
        ],
      },
    },
  ];
}
