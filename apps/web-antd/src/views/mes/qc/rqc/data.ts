import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcRqcApi } from '#/api/mes/qc/rqc';
import type { MesQcRqcLineApi } from '#/api/mes/qc/rqc/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesQcSourceDocTypeEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getSimpleUserList } from '#/api/system/user';
import { MdItemSelect } from '#/views/mes/md/item/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 列表搜索专用：来源单据类型字典只允许 RQC 用到的两种 */
function getRqcSourceDocTypeOptions() {
  const allowed = new Set<number>([
    MesQcSourceDocTypeEnum.RETURN_ISSUE,
    MesQcSourceDocTypeEnum.RETURN_SALES,
  ]);
  return getDictOptions(DICT_TYPE.MES_QC_SOURCE_DOC_TYPE, 'number').filter(
    (item) => allowed.has(Number(item.value)),
  );
}

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
                MesAutoCodeRuleCode.QC_RQC_CODE,
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
      fieldName: 'type',
      label: '检验类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_RQC_TYPE, 'number'),
        placeholder: '请选择检验类型',
      },
      rules: 'selectRequired',
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
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入批次号',
      },
    },
    {
      fieldName: 'checkQuantity',
      label: '检测数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入',
        precision: 2,
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['sourceDocId'],
        componentProps: (values) => ({
          class: '!w-full',
          disabled: !!values.sourceDocId,
          min: 0,
          placeholder: '请输入',
          precision: 2,
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
        placeholder: '请输入',
        precision: 2,
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
        placeholder: '请输入',
        precision: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'inspectDate',
      label: '检测日期',
      component: 'DatePicker',
      componentProps: {
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择检测日期',
        showTime: true,
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
      fieldName: 'sourceDocType',
      label: '来源单据类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getRqcSourceDocTypeOptions(),
        placeholder: '请选择来源单据类型',
      },
    },
    {
      fieldName: 'sourceDocCode',
      label: '来源单据编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入来源单据编号',
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
      fieldName: 'batchCode',
      label: '批次号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入批次号',
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
export function useGridColumns(): VxeTableGridOptions<MesQcRqcApi.Rqc>['columns'] {
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
      field: 'sourceDocType',
      title: '来源单据类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_QC_SOURCE_DOC_TYPE },
      },
    },
    {
      field: 'sourceDocCode',
      title: '来源单据编码',
      width: 160,
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
      width: 130,
    },
    {
      field: 'unitName',
      title: '单位',
      width: 80,
    },
    {
      field: 'batchCode',
      title: '批次号',
      width: 130,
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
      field: 'inspectDate',
      title: '检测日期',
      width: 160,
      formatter: 'formatDateTime',
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

/** 退货检验单行子表的字段 */
export function useLineGridColumns(): VxeTableGridOptions<MesQcRqcLineApi.RqcLine>['columns'] {
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
