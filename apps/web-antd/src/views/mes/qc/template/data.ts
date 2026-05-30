import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcTemplateApi } from '#/api/mes/qc/template';
import type { MesQcTemplateIndicatorApi } from '#/api/mes/qc/template/indicator';
import type { MesQcTemplateItemApi } from '#/api/mes/qc/template/item';

import { h, markRaw } from 'vue';

import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdUnitMeasureSelect } from '#/views/mes/md/unitmeasure/components';
import { QcIndicatorSelect } from '#/views/mes/qc/indicator/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

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
      label: '方案编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入方案编号',
      },
      rules: 'required',
      suffix: () =>
        h(
          Button,
          {
            type: 'default',
            onClick: async () => {
              const code = await generateAutoCode(
                MesAutoCodeRuleCode.QC_TEMPLATE_CODE,
              );
              await formApi?.setFieldValue('code', code);
            },
          },
          { default: () => '自动生成' },
        ),
    },
    {
      fieldName: 'name',
      label: '方案名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入方案名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'types',
      label: '检测种类',
      component: 'Select',
      formItemClass: 'col-span-3',
      componentProps: {
        allowClear: true,
        mode: 'multiple',
        options: getDictOptions(DICT_TYPE.MES_QC_TYPE, 'number'),
        placeholder: '请选择检测种类',
      },
      rules: z.array(z.number()).min(1, '检测种类不能为空'),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
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
      label: '方案编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入方案编号',
      },
    },
    {
      fieldName: 'name',
      label: '方案名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入方案名称',
      },
    },
    {
      fieldName: 'type',
      label: '检测种类',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_QC_TYPE, 'number'),
        placeholder: '请选择检测种类',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesQcTemplateApi.Template>['columns'] {
  return [
    {
      field: 'code',
      title: '方案编号',
      width: 150,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '方案名称',
      minWidth: 180,
    },
    {
      field: 'types',
      title: '检测种类',
      minWidth: 200,
      slots: { default: 'types' },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
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

/** 检测指标项子表的字段 */
export function useIndicatorGridColumns(): VxeTableGridOptions<MesQcTemplateIndicatorApi.TemplateIndicator>['columns'] {
  return [
    {
      field: 'indicatorCode',
      title: '检测项编码',
      width: 140,
    },
    {
      field: 'indicatorName',
      title: '检测项名称',
      minWidth: 150,
    },
    {
      field: 'indicatorType',
      title: '检测项类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_INDICATOR_TYPE },
      },
    },
    {
      field: 'indicatorTool',
      title: '检测工具',
      width: 120,
    },
    {
      field: 'checkMethod',
      title: '检测方法',
      minWidth: 180,
    },
    {
      field: 'standardValue',
      title: '标准值',
      width: 100,
    },
    {
      field: 'unitMeasureName',
      title: '单位',
      width: 80,
    },
    {
      field: 'thresholdMax',
      title: '误差上限',
      width: 100,
    },
    {
      field: 'thresholdMin',
      title: '误差下限',
      width: 100,
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 检测指标项子表的表单 */
export function useIndicatorFormSchema(): VbenFormSchema[] {
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
      fieldName: 'indicatorId',
      label: '质检指标',
      component: markRaw(QcIndicatorSelect),
      componentProps: {
        placeholder: '请选择质检指标',
      },
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'standardValue',
      label: '标准值',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        precision: 4,
        placeholder: '请输入标准值',
      },
    },
    {
      fieldName: 'unitMeasureId',
      label: '计量单位',
      component: markRaw(MdUnitMeasureSelect),
      componentProps: {
        placeholder: '请选择计量单位',
      },
    },
    {
      fieldName: 'thresholdMax',
      label: '误差上限',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        precision: 4,
        placeholder: '请输入',
      },
    },
    {
      fieldName: 'thresholdMin',
      label: '误差下限',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        precision: 4,
        placeholder: '请输入',
      },
    },
    {
      fieldName: 'checkMethod',
      label: '检测方法',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入检测方法',
        rows: 3,
      },
    },
    {
      fieldName: 'docUrl',
      label: '说明图URL',
      component: 'Input',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入说明图URL',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        placeholder: '请输入备注',
        rows: 2,
      },
    },
  ];
}

/** 产品关联子表的字段 */
export function useItemGridColumns(): VxeTableGridOptions<MesQcTemplateItemApi.TemplateItem>['columns'] {
  return [
    {
      field: 'itemCode',
      title: '物料编码',
      width: 130,
    },
    {
      field: 'itemName',
      title: '物料名称',
      minWidth: 150,
    },
    {
      field: 'specification',
      title: '规格型号',
      minWidth: 130,
    },
    {
      field: 'unitMeasureName',
      title: '计量单位',
      width: 100,
    },
    {
      field: 'quantityCheck',
      title: '最低检测数',
      width: 110,
    },
    {
      field: 'quantityUnqualified',
      title: '最大不合格数',
      width: 120,
      formatter: ({ cellValue }) =>
        cellValue === 0 ? '不启用' : (cellValue ?? ''),
    },
    {
      field: 'criticalRate',
      title: '最大致命缺陷率(%)',
      width: 150,
    },
    {
      field: 'majorRate',
      title: '最大严重缺陷率(%)',
      width: 150,
    },
    {
      field: 'minorRate',
      title: '最大轻微缺陷率(%)',
      width: 150,
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 产品关联子表的表单 */
export function useItemFormSchema(): VbenFormSchema[] {
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
      fieldName: 'itemId',
      label: '产品物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择产品物料',
      },
      formItemClass: 'col-span-3',
      rules: 'required',
    },
    {
      fieldName: 'quantityCheck',
      label: '最低检测数',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 1,
        placeholder: '请输入最低检测数',
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'quantityUnqualified',
      label: '最大不合格数',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '0表示不启用',
      },
      rules: z.number().default(0),
      help: '超出最大不合格数后整批判定不合格，0表示不启用',
    },
    {
      fieldName: 'criticalRate',
      label: '致命缺陷率(%)',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        max: 100,
        precision: 2,
        placeholder: '0表示不允许',
      },
      rules: z.number().default(0),
      help: '缺陷比例超出后整批判定不合格，0表示不允许出现',
    },
    {
      fieldName: 'majorRate',
      label: '严重缺陷率(%)',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        max: 100,
        precision: 2,
        placeholder: '0表示不允许',
      },
      rules: z.number().default(0),
      help: '缺陷比例超出后整批判定不合格，0表示不允许出现',
    },
    {
      fieldName: 'minorRate',
      label: '轻微缺陷率(%)',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        max: 100,
        precision: 2,
      },
      rules: z.number().default(100),
      help: '缺陷比例超出后整批判定不合格',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        placeholder: '请输入备注',
        rows: 2,
      },
    },
  ];
}
