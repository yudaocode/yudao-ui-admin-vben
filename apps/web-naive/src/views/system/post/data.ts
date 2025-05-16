import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemPostApi } from '#/api/system/post';

import { useAccess } from '@vben/access';

import { z } from '#/adapter/form';
import { CommonStatusEnum, DICT_TYPE, getDictOptions } from '#/utils';

const { hasAccessByCodes } = useAccess();

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: '岗位名称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '岗位编码',
      rules: 'required',
    },
    {
      fieldName: 'sort',
      label: '显示顺序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '岗位状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'remark',
      label: '岗位备注',
      component: 'Input',
      componentProps: {
        type: 'textarea',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '岗位名称',
      component: 'Input',
    },
    {
      fieldName: 'code',
      label: '岗位编码',
      component: 'Input',
    },
    {
      fieldName: 'status',
      label: '岗位状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = SystemPostApi.Post>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '岗位编号',
      minWidth: 200,
    },
    {
      field: 'name',
      title: '岗位名称',
      minWidth: 200,
    },
    {
      field: 'code',
      title: '岗位编码',
      minWidth: 200,
    },
    {
      field: 'sort',
      title: '显示顺序',
      minWidth: 100,
    },
    {
      field: 'remark',
      title: '岗位备注',
      minWidth: 200,
    },
    {
      field: 'status',
      title: '岗位状态',
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
      minWidth: 130,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '岗位',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: hasAccessByCodes(['system:post:update']),
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['system:post:delete']),
          },
        ],
      },
    },
  ];
}
