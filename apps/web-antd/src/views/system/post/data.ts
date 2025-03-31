import {type VbenFormSchema, z} from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemPostApi } from '#/api/system/post';

import { DICT_TYPE, getDictOptions } from '#/utils/dict';
import { CommonStatusEnum } from '#/utils/constants';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      label: 'id',
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
      component: 'InputNumber',
      componentProps: {
        min: 0,
        class: 'w-full',
        controlsPosition: 'right',
        placeholder: '请输入岗位顺序',
      },
      fieldName: 'sort',
      label: '岗位顺序',
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      fieldName: 'status',
      label: '岗位状态',
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: '岗位备注',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '岗位名称',
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '岗位编码',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      fieldName: 'status',
      label: '岗位状态',
    }
  ];
}

/** 列表的字段 */
export function useGridColumns<T = SystemPostApi.SystemPost>(
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
      title: '岗位顺序',
      minWidth: 100,
    },
    {
      field: 'remark',
      title: '岗位备注',
      minWidth: 200,
    },
    {
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
      field: 'status',
      title: '岗位状态',
      minWidth: 100,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '岗位',
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      minWidth: 130,
    },
  ];
}
