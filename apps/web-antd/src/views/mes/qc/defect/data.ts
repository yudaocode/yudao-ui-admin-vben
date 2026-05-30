import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcDefectApi } from '#/api/mes/qc/defect';

import { h } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';

/** 新增/修改的表单 */
export function useFormSchema(formApi?: VbenFormApi): VbenFormSchema[] {
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
      label: '缺陷编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入缺陷编码',
      },
      rules: 'required',
      suffix: () =>
        h(
          Button,
          {
            type: 'default',
            onClick: async () => {
              const code = await generateAutoCode(
                MesAutoCodeRuleCode.QC_DEFECT_CODE,
              );
              await formApi?.setFieldValue('code', code);
            },
          },
          { default: () => '自动生成' },
        ),
    },
    {
      fieldName: 'name',
      label: '缺陷描述',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入缺陷描述',
        rows: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'type',
      label: '检测项类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_INDICATOR_TYPE, 'number'),
        placeholder: '请选择检测项类型',
      },
      rules: 'required',
    },
    {
      fieldName: 'level',
      label: '缺陷等级',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_DEFECT_LEVEL, 'number'),
        placeholder: '请选择缺陷等级',
      },
      rules: 'required',
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
      label: '缺陷编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入缺陷编码',
      },
    },
    {
      fieldName: 'name',
      label: '缺陷描述',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入缺陷描述',
      },
    },
    {
      fieldName: 'type',
      label: '检测项类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_INDICATOR_TYPE, 'number'),
        placeholder: '请选择检测项类型',
      },
    },
    {
      fieldName: 'level',
      label: '缺陷等级',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_DEFECT_LEVEL, 'number'),
        placeholder: '请选择缺陷等级',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesQcDefectApi.Defect>['columns'] {
  return [
    {
      field: 'code',
      title: '缺陷编码',
      width: 140,
    },
    {
      field: 'name',
      title: '缺陷描述',
      minWidth: 200,
    },
    {
      field: 'type',
      title: '检测项类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_INDICATOR_TYPE },
      },
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
      field: 'remark',
      title: '备注',
      minWidth: 160,
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
