import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdUnitMeasureApi } from '#/api/mes/md/unitmeasure';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { getUnitMeasureSimpleList } from '#/api/mes/md/unitmeasure';

/** 新增/修改计量单位的表单 */
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
      fieldName: 'code',
      label: '单位编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入单位编码',
      },
      rules: 'required',
    },
    {
      fieldName: 'name',
      label: '单位名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入单位名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'primaryFlag',
      label: '是否主单位',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
      },
      rules: z.boolean().default(true),
    },
    {
      fieldName: 'primaryId',
      label: '主单位',
      component: 'ApiSelect',
      componentProps: {
        api: async () => {
          const list = await getUnitMeasureSimpleList();
          return list.filter((item) => item.primaryFlag === true);
        },
        clearable: true,
        labelField: 'name',
        placeholder: '请选择主单位',
        valueField: 'id',
      },
      dependencies: {
        triggerFields: ['primaryFlag'],
        show: (values) => values.primaryFlag === false,
      },
    },
    {
      fieldName: 'changeRate',
      label: '与主单位换算比例',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 0,
        precision: 4,
        step: 1,
      },
      dependencies: {
        triggerFields: ['primaryFlag'],
        show: (values) => values.primaryFlag === false,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '单位编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入单位编码',
      },
    },
    {
      fieldName: 'name',
      label: '单位名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入单位名称',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesMdUnitMeasureApi.UnitMeasure>['columns'] {
  return [
    {
      field: 'code',
      title: '单位编码',
      minWidth: 160,
    },
    {
      field: 'name',
      title: '单位名称',
      minWidth: 160,
    },
    {
      field: 'primaryFlag',
      title: '是否主单位',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'changeRate',
      title: '与主单位换算比例',
      minWidth: 150,
    },
    {
      field: 'status',
      title: '状态',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 180,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
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
