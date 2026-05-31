import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProFeedbackApi } from '#/api/mes/pro/feedback';
import type { MesProTaskApi } from '#/api/mes/pro/task';

import { h, markRaw } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesProTaskStatusEnum, MesProWorkOrderStatusEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getRouteProcessByRouteAndProcess } from '#/api/mes/pro/route/process';
import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';
import { MdItemSelect } from '#/views/mes/md/item/components';
import { MdWorkstationSelect } from '#/views/mes/md/workstation/components';
import { ProTaskSelect } from '#/views/mes/pro/task/components';
import { ProWorkOrderSelect } from '#/views/mes/pro/workorder/components';

/** 生产报工表单类型 */
export type FormType = 'approve' | 'create' | 'detail' | 'submit' | 'update';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '报工单号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入报工单号',
      },
    },
    {
      fieldName: 'type',
      label: '报工类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_PRO_FEEDBACK_TYPE, 'number'),
        placeholder: '请选择报工类型',
      },
    },
    {
      fieldName: 'workOrderId',
      label: '生产工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        allowClear: true,
        placeholder: '请选择工单',
      },
    },
    {
      fieldName: 'itemId',
      label: '产品物料',
      component: markRaw(MdItemSelect),
      componentProps: {
        allowClear: true,
        placeholder: '请选择产品物料',
      },
    },
    {
      fieldName: 'feedbackUserId',
      label: '报工人',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择报工人',
        valueField: 'id',
      },
    },
    {
      fieldName: 'creator',
      label: '记录人',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择记录人',
        valueField: 'id',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_PRO_FEEDBACK_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'feedbackTime',
      label: '报工时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesProFeedbackApi.Feedback>['columns'] {
  return [
    {
      field: 'code',
      title: '报工单号',
      width: 160,
      slots: { default: 'code' },
    },
    {
      field: 'type',
      title: '报工类型',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_FEEDBACK_TYPE },
      },
    },
    { field: 'workstationName', title: '工作站', width: 120 },
    { field: 'processName', title: '工序', width: 100 },
    { field: 'workOrderCode', title: '生产工单编码', width: 160 },
    { field: 'itemCode', title: '产品物料编码', width: 120 },
    { field: 'itemName', title: '产品物料名称', minWidth: 140 },
    { field: 'itemSpecification', title: '规格型号', width: 120 },
    { field: 'unitMeasureName', title: '单位', width: 80 },
    { field: 'feedbackQuantity', title: '报工数量', width: 100 },
    { field: 'feedbackUserNickname', title: '报工人', width: 100 },
    {
      field: 'feedbackTime',
      title: '报工时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    { field: 'approveUserNickname', title: '审核人', width: 100 },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_FEEDBACK_STATUS },
      },
    },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/**
 * 新增/编辑/提交/审批/详情生产报工的表单
 *
 * - create / update：录入报工主体信息和数量
 * - submit / approve / detail：主体字段只读
 *
 * 数量区域根据 `checkFlag` 和 `unqualifiedQuantity` 动态显示：
 * - 非质检工序：报工数量 = 合格 + 不良；不良 > 0 时再展开工废/料废/其他废品
 * - 质检工序：只填报工数量（视为待检数量）
 */
export function useFormSchema(
  formType: FormType,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
  const isHeaderReadonly = ['approve', 'detail', 'submit'].includes(formType);
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'checkFlag',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
      defaultValue: true,
    },
    {
      fieldName: 'routeId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'processId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'itemId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'code',
      label: '报工单号',
      component: 'Input',
      componentProps: {
        disabled: isHeaderReadonly,
        placeholder: '请输入报工单号',
      },
      rules: 'required',
      suffix: () =>
        h(
          Button,
          {
            disabled: isHeaderReadonly,
            type: 'default',
            onClick: async () => {
              const code = await generateAutoCode(
                MesAutoCodeRuleCode.PRO_FEEDBACK_CODE,
              );
              await formApi?.setFieldValue('code', code);
            },
          },
          { default: () => '生成' },
        ),
    },
    {
      fieldName: 'type',
      label: '报工类型',
      component: 'Select',
      componentProps: {
        disabled: isHeaderReadonly,
        options: getDictOptions(DICT_TYPE.MES_PRO_FEEDBACK_TYPE, 'number'),
        placeholder: '请选择报工类型',
      },
      rules: 'required',
    },
    {
      fieldName: 'workOrderId',
      label: '生产工单',
      component: markRaw(ProWorkOrderSelect),
      componentProps: {
        disabled: isHeaderReadonly,
        placeholder: '请选择工单',
        status: MesProWorkOrderStatusEnum.CONFIRMED,
        // 工单变更：清空任务及任务带出的产品信息、数量区域控制位
        onChange: async () => {
          await formApi?.setValues({
            checkFlag: true,
            itemCode: undefined,
            itemId: undefined,
            itemName: undefined,
            itemSpecification: undefined,
            processId: undefined,
            routeId: undefined,
            taskId: undefined,
            unitMeasureName: undefined,
            workstationId: undefined,
          });
        },
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'taskId',
      label: '生产任务',
      component: markRaw(ProTaskSelect),
      dependencies: {
        triggerFields: ['workOrderId', 'workstationId'],
        componentProps: (values) => ({
          disabled: isHeaderReadonly || !values.workOrderId,
          placeholder: values.workOrderId ? '请选择任务' : '请先选择工单',
          statuses: [MesProTaskStatusEnum.PREPARE],
          workOrderId: values.workOrderId,
          workstationId: values.workstationId,
        }),
      },
      // 任务变更：自动填充关联字段、产品信息、checkFlag
      componentProps: {
        onChange: async (task?: MesProTaskApi.Task) => {
          if (!task) {
            return;
          }
          await formApi?.setValues({
            itemCode: task.itemCode,
            itemId: task.itemId,
            itemName: task.itemName,
            itemSpecification: task.itemSpecification,
            processId: task.processId,
            routeId: task.routeId,
            unitMeasureName: task.unitMeasureName,
            workstationId: task.workstationId,
          });
          // 工艺路线工序的 checkFlag 决定数量区域展示
          if (task.routeId && task.processId) {
            try {
              const routeProcess = await getRouteProcessByRouteAndProcess(
                task.routeId,
                task.processId,
              );
              await formApi?.setFieldValue(
                'checkFlag',
                routeProcess?.checkFlag ?? false,
              );
            } catch {
              await formApi?.setFieldValue('checkFlag', true);
            }
          }
        },
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'workstationId',
      label: '工作站',
      component: markRaw(MdWorkstationSelect),
      componentProps: {
        disabled: isHeaderReadonly,
        placeholder: '请选择工作站',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'itemCode',
      label: '产品编码',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      dependencies: {
        triggerFields: ['itemCode'],
        show: (values) => !!values.itemCode,
      },
    },
    {
      fieldName: 'itemName',
      label: '产品名称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      dependencies: {
        triggerFields: ['itemCode'],
        show: (values) => !!values.itemCode,
      },
    },
    {
      fieldName: 'unitMeasureName',
      label: '单位',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      dependencies: {
        triggerFields: ['itemCode'],
        show: (values) => !!values.itemCode,
      },
    },
    {
      fieldName: 'itemSpecification',
      label: '规格',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      dependencies: {
        triggerFields: ['itemCode'],
        show: (values) => !!values.itemCode,
      },
    },
    {
      fieldName: 'feedbackQuantity',
      label: '报工数量',
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 0,
        precision: 2,
      },
      dependencies: {
        triggerFields: ['checkFlag'],
        // 非质检工序时，报工数量 = 合格 + 不良，禁用直接编辑
        componentProps: (values) => ({
          class: 'w-full',
          disabled: !values.checkFlag,
          min: 0,
          placeholder: '请输入报工数量',
          precision: 2,
        }),
      },
      rules: 'required',
    },
    {
      fieldName: 'qualifiedQuantity',
      label: '合格品数量',
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 0,
        precision: 2,
        // 合格/不良变更，自动累计为报工数量
        onChange: async () => {
          const values = await formApi?.getValues();
          await formApi?.setFieldValue(
            'feedbackQuantity',
            (values?.qualifiedQuantity || 0) +
              (values?.unqualifiedQuantity || 0),
          );
        },
      },
      defaultValue: 0,
      dependencies: {
        triggerFields: ['checkFlag'],
        show: (values) => !values.checkFlag,
      },
    },
    {
      fieldName: 'unqualifiedQuantity',
      label: '不良品数量',
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 0,
        precision: 2,
        // 合格/不良变更，自动累计为报工数量
        onChange: async () => {
          const values = await formApi?.getValues();
          await formApi?.setFieldValue(
            'feedbackQuantity',
            (values?.qualifiedQuantity || 0) +
              (values?.unqualifiedQuantity || 0),
          );
        },
      },
      defaultValue: 0,
      dependencies: {
        triggerFields: ['checkFlag'],
        show: (values) => !values.checkFlag,
      },
    },
    {
      fieldName: 'laborScrapQuantity',
      label: '工废数量',
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 0,
        precision: 2,
        // 废品分类变更，自动累计为不良品数量及报工数量
        onChange: async () => {
          const values = await formApi?.getValues();
          const unqualified =
            (values?.laborScrapQuantity || 0) +
            (values?.materialScrapQuantity || 0) +
            (values?.otherScrapQuantity || 0);
          await formApi?.setValues({
            feedbackQuantity:
              (values?.qualifiedQuantity || 0) + unqualified,
            unqualifiedQuantity: unqualified,
          });
        },
      },
      defaultValue: 0,
      dependencies: {
        triggerFields: ['checkFlag', 'unqualifiedQuantity'],
        show: (values) =>
          !values.checkFlag && (values.unqualifiedQuantity || 0) > 0,
      },
    },
    {
      fieldName: 'materialScrapQuantity',
      label: '料废数量',
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 0,
        precision: 2,
        // 废品分类变更，自动累计为不良品数量及报工数量
        onChange: async () => {
          const values = await formApi?.getValues();
          const unqualified =
            (values?.laborScrapQuantity || 0) +
            (values?.materialScrapQuantity || 0) +
            (values?.otherScrapQuantity || 0);
          await formApi?.setValues({
            feedbackQuantity:
              (values?.qualifiedQuantity || 0) + unqualified,
            unqualifiedQuantity: unqualified,
          });
        },
      },
      defaultValue: 0,
      dependencies: {
        triggerFields: ['checkFlag', 'unqualifiedQuantity'],
        show: (values) =>
          !values.checkFlag && (values.unqualifiedQuantity || 0) > 0,
      },
    },
    {
      fieldName: 'otherScrapQuantity',
      label: '其他废品',
      component: 'InputNumber',
      componentProps: {
        class: 'w-full',
        min: 0,
        precision: 2,
        // 废品分类变更，自动累计为不良品数量及报工数量
        onChange: async () => {
          const values = await formApi?.getValues();
          const unqualified =
            (values?.laborScrapQuantity || 0) +
            (values?.materialScrapQuantity || 0) +
            (values?.otherScrapQuantity || 0);
          await formApi?.setValues({
            feedbackQuantity:
              (values?.qualifiedQuantity || 0) + unqualified,
            unqualifiedQuantity: unqualified,
          });
        },
      },
      defaultValue: 0,
      dependencies: {
        triggerFields: ['checkFlag', 'unqualifiedQuantity'],
        show: (values) =>
          !values.checkFlag && (values.unqualifiedQuantity || 0) > 0,
      },
    },
    {
      fieldName: 'feedbackUserId',
      label: '报工人',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        disabled: isHeaderReadonly,
        labelField: 'nickname',
        placeholder: '请选择报工人',
        valueField: 'id',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'feedbackTime',
      label: '报工时间',
      component: 'DatePicker',
      componentProps: {
        class: 'w-full',
        disabled: isHeaderReadonly,
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择报工时间',
        showTime: true,
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'approveUserId',
      label: '审核人',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        disabled: isHeaderReadonly,
        labelField: 'nickname',
        placeholder: '请选择审核人',
        valueField: 'id',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        disabled: formType === 'detail',
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}
