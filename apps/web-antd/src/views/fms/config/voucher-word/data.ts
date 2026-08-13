import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';

import { z } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<FmsVoucherWordApi.VoucherWord>['columns'] {
  return [
    { field: 'name', title: '凭证字', minWidth: 180 },
    { field: 'printTitle', title: '打印标题', minWidth: 260 },
    {
      field: 'defaultStatus',
      title: '是否默认',
      width: 130,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      align: 'center',
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

/** 新增/修改表单 */
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
      fieldName: 'accountSetId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '凭证字',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入凭证字',
        maxlength: 255,
        allowClear: true,
      },
    },
    {
      fieldName: 'printTitle',
      label: '打印标题',
      component: 'Input',
      componentProps: {
        placeholder: '请输入打印标题',
        maxlength: 255,
        allowClear: true,
      },
    },
    {
      fieldName: 'defaultStatus',
      label: '是否默认',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
      },
      rules: z.boolean().default(false),
    },
  ];
}
