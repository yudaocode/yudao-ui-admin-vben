import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcOqcApi } from '#/api/mes/qc/oqc';
import type { MesQcOqcLineApi } from '#/api/mes/qc/oqc/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getSimpleUserList } from '#/api/system/user';
import { MdClientSelect } from '#/views/mes/md/client/components';
import { MdItemSelect } from '#/views/mes/md/item/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改的表单 */
export function useFormSchema(
  formType: FormType,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
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
      fieldName: 'sourceDocId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'sourceLineId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'status',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'code',
      label: '检验单编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入检验单编号',
      },
      rules: 'required',
      suffix: () =>
        h(
          Button,
          {
            disabled: formType === 'detail',
            type: 'default',
            onClick: async () => {
              const code = await generateAutoCode(
                MesAutoCodeRuleCode.QC_OQC_CODE,
              );
              await formApi?.setFieldValue('code', code);
            },
          },
          { default: () => '生成' },
        ),
    },
    {
      fieldName: 'name',
      label: '检验单名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入检验单名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'sourceDocType',
      label: '来源单据类型',
      component: 'Select',
      componentProps: {
        disabled: true,
        options: getDictOptions(DICT_TYPE.MES_QC_SOURCE_DOC_TYPE, 'number'),
        placeholder: '来源单据类型',
      },
      dependencies: {
        triggerFields: ['sourceDocType'],
        show: (values) => !!values.sourceDocType,
      },
    },
    {
      fieldName: 'sourceDocCode',
      label: '来源单据编号',
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: '来源单据编号',
      },
      dependencies: {
        triggerFields: ['sourceDocType', 'sourceDocId'],
        show: (values) => !!values.sourceDocType && !!values.sourceDocId,
      },
    },
    {
      fieldName: 'itemId',
      label: '产品物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择产品物料',
      },
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['sourceDocId'],
        componentProps: (values) => ({
          disabled: !!values.sourceDocId,
          placeholder: '请选择产品物料',
        }),
      },
    },
    {
      fieldName: 'clientId',
      label: '客户',
      component: markRaw(MdClientSelect),
      componentProps: {
        placeholder: '请选择客户',
      },
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['sourceDocId'],
        componentProps: (values) => ({
          disabled: !!values.sourceDocId,
          placeholder: '请选择客户',
        }),
      },
    },
    {
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入批次号',
      },
    },
    {
      fieldName: 'outQuantity',
      label: '发货数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入发货数量',
        precision: 2,
        // 新建态下，发货数量变化时把 checkQuantity 也填上同值
        onChange: async (value: null | number | undefined) => {
          if (value == null || !formApi) return;
          const values = await formApi.getValues();
          if (!values.id && values.checkQuantity == null) {
            await formApi.setFieldValue('checkQuantity', value);
          }
        },
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['sourceDocId'],
        componentProps: (values) => ({
          class: '!w-full',
          disabled: !!values.sourceDocId,
          min: 0,
          placeholder: '请输入发货数量',
          precision: 2,
          onChange: async (value: null | number | undefined) => {
            if (value == null || !formApi) return;
            const current = await formApi.getValues();
            if (!current.id && current.checkQuantity == null) {
              await formApi.setFieldValue('checkQuantity', value);
            }
          },
        }),
      },
    },
    {
      fieldName: 'checkQuantity',
      label: '检测数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入检测数量',
        // 新建态下，检测数量变化时把 outQuantity 也填上同值
        onChange: async (value: null | number | undefined) => {
          if (value == null || !formApi) return;
          const values = await formApi.getValues();
          if (!values.id && values.outQuantity == null) {
            await formApi.setFieldValue('outQuantity', value);
          }
        },
      },
      rules: 'required',
    },
    {
      fieldName: 'qualifiedQuantity',
      label: '合格品数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入合格品数量',
      },
      rules: 'required',
    },
    {
      fieldName: 'unqualifiedQuantity',
      label: '不合格品数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入不合格品数量',
      },
      rules: 'required',
    },
    {
      fieldName: 'inspectorUserId',
      label: '检测人员',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择检测人员',
        valueField: 'id',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'outDate',
      label: '出货日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        placeholder: '请选择出货日期',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'inspectDate',
      label: '检测日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        placeholder: '请选择检测日期',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'checkResult',
      label: '检测结果',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_QC_CHECK_RESULT, 'number'),
        placeholder: '请选择检测结果',
      },
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
      label: '检验单编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入检验单编号',
      },
    },
    {
      fieldName: 'clientId',
      label: '客户',
      component: markRaw(MdClientSelect),
      componentProps: {
        placeholder: '请选择客户',
      },
    },
    {
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入批次号',
      },
    },
    {
      fieldName: 'itemId',
      label: '产品物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        placeholder: '请选择产品物料',
      },
    },
    {
      fieldName: 'checkResult',
      label: '检测结果',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_QC_CHECK_RESULT, 'number'),
        placeholder: '请选择检测结果',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesQcOqcApi.Oqc>['columns'] {
  return [
    {
      field: 'code',
      title: '检验单编号',
      width: 160,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '检验单名称',
      minWidth: 180,
    },
    {
      field: 'clientNickname',
      title: '客户名称',
      width: 120,
    },
    {
      field: 'batchCode',
      title: '批次号',
      width: 130,
    },
    {
      field: 'itemCode',
      title: '产品物料编码',
      width: 130,
    },
    {
      field: 'itemName',
      title: '产品物料名称',
      minWidth: 150,
    },
    {
      field: 'itemSpecification',
      title: '规格型号',
      minWidth: 150,
    },
    {
      field: 'unitName',
      title: '单位',
      width: 80,
    },
    {
      field: 'outQuantity',
      title: '发货数量',
      width: 100,
    },
    {
      field: 'checkQuantity',
      title: '检测数量',
      width: 100,
    },
    {
      field: 'unqualifiedQuantity',
      title: '不合格数',
      width: 100,
    },
    {
      field: 'checkResult',
      title: '检测结果',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_QC_CHECK_RESULT },
      },
    },
    {
      field: 'outDate',
      title: '出货日期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'inspectDate',
      title: '检测日期',
      width: 120,
      formatter: 'formatDate',
    },
    {
      field: 'inspectorNickname',
      title: '检测人员',
      width: 100,
    },
    {
      field: 'status',
      title: '单据状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_ORDER_STATUS },
      },
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 出货检验单行子表的字段 */
export function useLineGridColumns(): VxeTableGridOptions<MesQcOqcLineApi.OqcLine>['columns'] {
  return [
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
      field: 'tool',
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
      field: 'maxThreshold',
      title: '误差上限',
      width: 100,
    },
    {
      field: 'minThreshold',
      title: '误差下限',
      width: 100,
    },
    {
      field: 'criticalQuantity',
      title: '致命缺陷数',
      width: 110,
    },
    {
      field: 'majorQuantity',
      title: '严重缺陷数',
      width: 110,
    },
    {
      field: 'minorQuantity',
      title: '轻微缺陷数',
      width: 110,
    },
    {
      title: '操作',
      width: 110,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
