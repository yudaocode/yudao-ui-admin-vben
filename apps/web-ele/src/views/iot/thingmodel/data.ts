import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ThingModelApi } from '#/api/iot/thingmodel';

import { DICT_TYPE, getDataTypeOptionsLabel } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'type',
      label: '功能类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_THING_MODEL_TYPE, 'number'),
        placeholder: '请选择功能类型',
        clearable: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<ThingModelApi.ThingModel>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'type',
      title: '功能类型',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IOT_THING_MODEL_TYPE },
      },
    },
    {
      field: 'name',
      title: '功能名称',
      minWidth: 150,
    },
    {
      field: 'identifier',
      title: '标识符',
      minWidth: 120,
    },
    {
      title: '数据类型',
      minWidth: 100,
      formatter: ({ row }) =>
        getDataTypeOptionsLabel(row.property?.dataType ?? '') || '-',
    },
    {
      title: '数据定义',
      minWidth: 200,
      slots: { default: 'dataDefinition' },
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
