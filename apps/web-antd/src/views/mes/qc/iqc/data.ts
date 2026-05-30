import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcIqcApi } from '#/api/mes/qc/iqc';
import type { MesQcIqcLineApi } from '#/api/mes/qc/iqc/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdVendorSelect } from '#/views/mes/md/vendor/components';

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
                MesAutoCodeRuleCode.QC_IQC_CODE,
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
        triggerFields: ['id', 'sourceDocId'],
        componentProps: (values) => ({
          disabled: !!values.id || !!values.sourceDocId,
          placeholder: '请选择产品物料',
        }),
      },
    },
    {
      fieldName: 'vendorId',
      label: '供应商',
      component: markRaw(MdVendorSelect),
      componentProps: {
        placeholder: '请选择供应商',
      },
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['sourceDocId'],
        componentProps: (values) => ({
          disabled: !!values.sourceDocId,
          placeholder: '请选择供应商',
        }),
      },
    },
    {
      fieldName: 'vendorBatch',
      label: '供应商批次号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入供应商批次号',
      },
    },
    {
      fieldName: 'receivedQuantity',
      label: '本次接收数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        precision: 2,
        placeholder: '请输入本次接收数量',
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['sourceDocId'],
        componentProps: (values) => ({
          class: '!w-full',
          disabled: !!values.sourceDocId,
          min: 0,
          precision: 2,
          placeholder: '请输入本次接收数量',
        }),
      },
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
      fieldName: 'receiveDate',
      label: '来料日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD',
        placeholder: '请选择来料日期',
        valueFormat: 'x',
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
      fieldName: 'vendorId',
      label: '供应商',
      component: markRaw(MdVendorSelect),
      componentProps: {
        placeholder: '请选择供应商',
      },
    },
    {
      fieldName: 'vendorBatch',
      label: '供应商批次',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入供应商批次号',
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
    {
      fieldName: 'receiveDate',
      label: '来料日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
      },
    },
    {
      fieldName: 'inspectDate',
      label: '检测日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
      },
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
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesQcIqcApi.Iqc>['columns'] {
  return [
    {
      field: 'code',
      title: '来料检验单编号',
      width: 160,
      slots: { default: 'code' },
    },
    {
      field: 'name',
      title: '来料检验单名称',
      minWidth: 180,
    },
    {
      field: 'vendorNickname',
      title: '供应商简称',
      width: 120,
    },
    {
      field: 'vendorBatch',
      title: '供应商批次号',
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
      field: 'receivedQuantity',
      title: '接收数量',
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
      field: 'receiveDate',
      title: '来料日期',
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
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 来料检验行子表的字段 */
export function useLineGridColumns(): VxeTableGridOptions<MesQcIqcLineApi.IqcLine>['columns'] {
  return [
    {
      field: 'indicatorName',
      title: '检测项名称',
      width: 150,
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
      title: '检测要求',
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
      field: 'remark',
      title: '备注',
      minWidth: 150,
    },
    {
      title: '操作',
      width: 110,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
