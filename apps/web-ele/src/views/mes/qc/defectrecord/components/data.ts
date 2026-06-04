import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcDefectRecordApi } from '#/api/mes/qc/defectrecord';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

/** 表单类型 */
export type FormType = 'create' | 'update';

/** 新增/修改缺陷记录的表单 */
export function useDefectRecordInlineFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '缺陷描述',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入缺陷描述',
        rows: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'level',
      label: '缺陷等级',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_DEFECT_LEVEL, 'number'),
        placeholder: '请选择缺陷等级',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'quantity',
      label: '缺陷数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 1,
        placeholder: '请输入缺陷数量',
      },
      rules: 'required',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Input',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ];
}

/** 缺陷记录列表的字段 */
export function useDefectRecordInlineGridColumns(): VxeTableGridOptions<MesQcDefectRecordApi.DefectRecord>['columns'] {
  return [
    {
      field: 'name',
      title: '缺陷描述',
      minWidth: 200,
    },
    {
      field: 'level',
      title: '缺陷等级',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_DEFECT_LEVEL },
      },
    },
    {
      field: 'quantity',
      title: '缺陷数量',
      width: 100,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 150,
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
