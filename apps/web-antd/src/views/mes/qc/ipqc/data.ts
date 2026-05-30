import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcIpqcApi } from '#/api/mes/qc/ipqc';
import type { MesQcIpqcLineApi } from '#/api/mes/qc/ipqc/line';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesProTaskStatusEnum, MesProWorkOrderStatusEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getSimpleUserList } from '#/api/system/user';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdWorkstationSelect } from '#/views/mes/md/workstation/components';
import { ProTaskSelect } from '#/views/mes/pro/task/components';
import { ProWorkOrderSelect } from '#/views/mes/pro/workorder/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 把不合格品数量同步为工废 + 料废 + 其他废品之和 */
function syncUnqualified(formApi?: VbenFormApi) {
  if (!formApi) {
    return;
  }
  void (async () => {
    const values = await formApi.getValues();
    const next =
      Number(values.laborScrapQuantity || 0) +
      Number(values.materialScrapQuantity || 0) +
      Number(values.otherScrapQuantity || 0);
    await formApi.setFieldValue('unqualifiedQuantity', next);
  })();
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
                MesAutoCodeRuleCode.QC_IPQC_CODE,
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
      fieldName: 'type',
      label: '检验类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_IPQC_TYPE, 'number'),
        placeholder: '请选择检验类型',
      },
      rules: 'selectRequired',
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
      fieldName: 'workOrderId',
      label: '生产工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        placeholder: '请选择生产工单',
        status: MesProWorkOrderStatusEnum.CONFIRMED,
        // 工单变更时清空生产任务
        onChange: () => formApi?.setFieldValue('taskId', undefined),
      },
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['sourceDocId'],
        componentProps: (values) => ({
          disabled: !!values.sourceDocId,
          placeholder: '请选择生产工单',
          status: MesProWorkOrderStatusEnum.CONFIRMED,
          onChange: () => formApi?.setFieldValue('taskId', undefined),
        }),
      },
    },
    {
      fieldName: 'workstationId',
      label: '工位',
      component: markRaw(MdWorkstationSelect),
      componentProps: {
        placeholder: '请选择工位',
      },
      rules: 'selectRequired',
      dependencies: {
        triggerFields: ['sourceDocId'],
        componentProps: (values) => ({
          disabled: !!values.sourceDocId,
          placeholder: '请选择工位',
        }),
      },
    },
    {
      fieldName: 'taskId',
      label: '生产任务',
      component: markRaw(ProTaskSelect),
      componentProps: {
        placeholder: '请选择生产任务',
        statuses: [MesProTaskStatusEnum.PREPARE],
      },
      dependencies: {
        triggerFields: ['sourceDocId', 'workOrderId', 'workstationId'],
        componentProps: (values) => ({
          disabled: !!values.sourceDocId || !values.workOrderId,
          placeholder: '请选择生产任务',
          statuses: [MesProTaskStatusEnum.PREPARE],
          workOrderId: values.workOrderId,
          workstationId: values.workstationId,
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
        precision: 2,
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['sourceDocId'],
        componentProps: (values) => ({
          class: '!w-full',
          disabled: !!values.sourceDocId,
          min: 0,
          placeholder: '请输入检测数量',
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
        placeholder: '请输入合格品数量',
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
        placeholder: '请输入不合格品数量',
        precision: 2,
      },
      rules: 'required',
    },
    {
      fieldName: 'laborScrapQuantity',
      label: '工废数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入工废数量',
        precision: 2,
        onChange: () => syncUnqualified(formApi),
      },
      defaultValue: 0,
      rules: 'required',
      dependencies: {
        triggerFields: ['unqualifiedQuantity'],
        show: (values) =>
          values.unqualifiedQuantity != null && values.unqualifiedQuantity > 0,
      },
    },
    {
      fieldName: 'materialScrapQuantity',
      label: '料废数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入料废数量',
        precision: 2,
        onChange: () => syncUnqualified(formApi),
      },
      defaultValue: 0,
      rules: 'required',
      dependencies: {
        triggerFields: ['unqualifiedQuantity'],
        show: (values) =>
          values.unqualifiedQuantity != null && values.unqualifiedQuantity > 0,
      },
    },
    {
      fieldName: 'otherScrapQuantity',
      label: '其他废品数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        min: 0,
        placeholder: '请输入其他废品数量',
        precision: 2,
        onChange: () => syncUnqualified(formApi),
      },
      defaultValue: 0,
      rules: 'required',
      dependencies: {
        triggerFields: ['unqualifiedQuantity'],
        show: (values) =>
          values.unqualifiedQuantity != null && values.unqualifiedQuantity > 0,
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
      fieldName: 'type',
      label: '检验类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_IPQC_TYPE, 'number'),
        placeholder: '请选择检验类型',
      },
    },
    {
      fieldName: 'workOrderId',
      label: '生产工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        placeholder: '请选择生产工单',
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
export function useGridColumns(): VxeTableGridOptions<MesQcIpqcApi.Ipqc>['columns'] {
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
      field: 'type',
      title: '检验类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_IPQC_TYPE },
      },
    },
    {
      field: 'workOrderCode',
      title: '生产工单编号',
      width: 140,
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
      field: 'checkQuantity',
      title: '检测数量',
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

/** 过程检验单行子表的字段 */
export function useLineGridColumns(): VxeTableGridOptions<MesQcIpqcLineApi.IpqcLine>['columns'] {
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
      field: 'toolName',
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
