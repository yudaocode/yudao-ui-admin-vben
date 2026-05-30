import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcIndicatorApi } from '#/api/mes/qc/indicator';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesQcResultValueType } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton } from 'element-plus';

import { generateAutoCode } from '#/api/mes/md/autocode/record';

import { QcIndicatorResultSpecificationInput } from './components';

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
      label: '检测项编码',
      component: 'Input',
      componentProps: {
        maxlength: 64,
        placeholder: '请输入检测项编码',
      },
      rules: 'required',
      suffix: () =>
        h(
          ElButton,
          {
            onClick: async () => {
              const code = await generateAutoCode(
                MesAutoCodeRuleCode.QC_INDICATOR_CODE,
              );
              await formApi?.setFieldValue('code', code);
            },
          },
          { default: () => '自动生成' },
        ),
    },
    {
      fieldName: 'name',
      label: '检测项名称',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '请输入检测项名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'type',
      label: '检测项类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_INDICATOR_TYPE, 'number'),
        placeholder: '请选择检测项类型',
      },
      rules: 'required',
    },
    {
      fieldName: 'tool',
      label: '检测工具',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '请输入检测工具',
      },
    },
    {
      fieldName: 'resultType',
      label: '结果值类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        // 结果值类型变化时清空结果值属性
        onChange: () =>
          formApi?.setFieldValue('resultSpecification', undefined),
        options: getDictOptions(DICT_TYPE.MES_QC_RESULT_TYPE, 'number'),
        placeholder: '请选择结果值类型',
      },
      rules: 'required',
    },
    {
      fieldName: 'resultSpecification',
      label: '结果值属性',
      component: markRaw(QcIndicatorResultSpecificationInput),
      // 按结果值类型在组件内部切换文件类型 RadioGroup / 字典类型 Select
      dependencies: {
        triggerFields: ['resultType'],
        if: (values) =>
          values.resultType === MesQcResultValueType.FILE ||
          values.resultType === MesQcResultValueType.DICT,
        componentProps: (values) => ({
          resultType: values.resultType,
        }),
      },
      rules: 'required',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        maxlength: 250,
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
      label: '检测项编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入检测项编码',
      },
    },
    {
      fieldName: 'name',
      label: '检测项名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入检测项名称',
      },
    },
    {
      fieldName: 'type',
      label: '检测项类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_INDICATOR_TYPE, 'number'),
        placeholder: '请选择检测项类型',
      },
    },
    {
      fieldName: 'resultType',
      label: '结果值类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_QC_RESULT_TYPE, 'number'),
        placeholder: '请选择结果值类型',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesQcIndicatorApi.Indicator>['columns'] {
  return [
    {
      field: 'code',
      title: '检测项编码',
      width: 140,
    },
    {
      field: 'name',
      title: '检测项名称',
      minWidth: 160,
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
      field: 'tool',
      title: '检测工具',
      width: 140,
    },
    {
      field: 'resultType',
      title: '结果值类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_QC_RESULT_TYPE },
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

/** 选择弹窗的搜索表单 */
export function useSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '检测项名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入检测项名称',
      },
    },
    {
      fieldName: 'type',
      label: '检测项类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_INDICATOR_TYPE, 'number'),
        placeholder: '请选择检测项类型',
      },
    },
  ];
}

/** 选择弹窗的字段 */
export function useSelectGridColumns(
  multiple = true,
): VxeTableGridOptions<MesQcIndicatorApi.Indicator>['columns'] {
  return [
    {
      type: multiple ? 'checkbox' : 'radio',
      width: 50,
    },
    {
      field: 'code',
      title: '检测项编码',
      width: 140,
    },
    {
      field: 'name',
      title: '检测项名称',
      minWidth: 160,
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
      field: 'tool',
      title: '检测工具',
      width: 120,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 140,
    },
  ];
}
