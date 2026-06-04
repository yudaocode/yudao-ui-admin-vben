import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProAndonConfigApi } from '#/api/mes/pro/andon/config';
import type { MesProAndonRecordApi } from '#/api/mes/pro/andon/record';

import { markRaw } from 'vue';

import { DICT_TYPE, MesProWorkOrderStatusEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';
import { MdWorkstationSelect } from '#/views/mes/md/workstation/components';
import { ProProcessSelect } from '#/views/mes/pro/process/components';
import { ProWorkOrderSelect } from '#/views/mes/pro/workorder/components';

import { AndonConfigSelect } from '../config/components';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'workstationId',
      label: '工作站',
      component: markRaw(MdWorkstationSelect),
      componentProps: {
        clearable: true,
        placeholder: '请选择工作站',
      },
    },
    {
      fieldName: 'userId',
      label: '发起人',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        clearable: true,
        labelField: 'nickname',
        placeholder: '请选择发起人',
        valueField: 'id',
      },
    },
    {
      fieldName: 'handlerUserId',
      label: '处置人',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        clearable: true,
        labelField: 'nickname',
        placeholder: '请选择处置人',
        valueField: 'id',
      },
    },
    {
      fieldName: 'status',
      label: '处理状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_PRO_ANDON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'createTime',
      label: '发起时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesProAndonRecordApi.AndonRecord>['columns'] {
  return [
    { field: 'workstationCode', title: '工作站编码', width: 140 },
    { field: 'workstationName', title: '工作站名称', minWidth: 140 },
    { field: 'workOrderCode', title: '工单编码', width: 140 },
    { field: 'processName', title: '工序名称', width: 140 },
    { field: 'userNickname', title: '发起人', width: 110 },
    {
      field: 'createTime',
      title: '发起时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    { field: 'reason', title: '呼叫原因', minWidth: 160 },
    {
      field: 'level',
      title: '级别',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_ANDON_LEVEL },
      },
    },
    {
      field: 'handleTime',
      title: '处理时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    { field: 'handlerUserNickname', title: '处理人', width: 110 },
    {
      field: 'status',
      title: '处置状态',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_ANDON_STATUS },
      },
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/**
 * 新增/处置/详情安灯呼叫记录的表单
 *
 * - create：录入呼叫主体信息（工作站/发起人/工单/工序/呼叫原因/备注）
 * - update：呼叫主体只读展示创建时的快照字段（workstationName/workOrderCode/processName/reason），编辑处置时间/处置人/备注
 * - detail：所有字段只读
 */
export function useFormSchema(
  formType: FormType,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
  const isCreate = formType === 'create';
  const isUpdate = formType === 'update';
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    isCreate
      ? {
          fieldName: 'workstationId',
          label: '工作站',
          component: markRaw(MdWorkstationSelect),
          componentProps: {
            placeholder: '请选择工作站',
          },
          rules: 'selectRequired',
        }
      : {
          fieldName: 'workstationName',
          label: '工作站',
          component: 'Input',
          componentProps: {
            disabled: true,
          },
        },
    isCreate
      ? {
          fieldName: 'userId',
          label: '发起人',
          component: 'ApiSelect',
          componentProps: {
            api: getSimpleUserList,
            clearable: true,
            labelField: 'nickname',
            placeholder: '请选择发起人',
            valueField: 'id',
          },
        }
      : {
          fieldName: 'userNickname',
          label: '发起人',
          component: 'Input',
          componentProps: {
            disabled: true,
          },
        },
    isCreate
      ? {
          fieldName: 'workOrderId',
          label: '生产工单',
          component: markRaw(ProWorkOrderSelect),
          componentProps: {
            placeholder: '请选择工单（可选）',
            status: MesProWorkOrderStatusEnum.CONFIRMED,
          },
        }
      : {
          fieldName: 'workOrderCode',
          label: '生产工单',
          component: 'Input',
          componentProps: {
            disabled: true,
          },
        },
    isCreate
      ? {
          fieldName: 'processId',
          label: '工序',
          component: markRaw(ProProcessSelect),
          componentProps: {
            placeholder: '请选择工序（可选）',
          },
        }
      : {
          fieldName: 'processName',
          label: '工序',
          component: 'Input',
          componentProps: {
            disabled: true,
          },
        },
    isCreate
      ? {
          fieldName: 'configId',
          label: '呼叫原因',
          component: markRaw(AndonConfigSelect),
          componentProps: {
            // 选择呼叫原因后，自动填充对应的级别
            onChange: async (config?: MesProAndonConfigApi.AndonConfig) => {
              await formApi?.setValues({
                level: config?.level,
                reason: config?.reason,
              });
            },
          },
          rules: 'selectRequired',
        }
      : {
          fieldName: 'reason',
          label: '呼叫原因',
          component: 'Input',
          componentProps: {
            disabled: true,
          },
        },
    {
      fieldName: 'level',
      label: '级别',
      component: 'Select',
      componentProps: {
        disabled: true,
        options: getDictOptions(DICT_TYPE.MES_PRO_ANDON_LEVEL, 'number'),
        placeholder: '由呼叫原因自动带出',
      },
    },
    // 处置信息：update / detail 模式才展示
    ...(isCreate
      ? []
      : ([
          {
            fieldName: 'status',
            label: '状态',
            component: 'Select',
            componentProps: {
              disabled: true,
              options: getDictOptions(
                DICT_TYPE.MES_PRO_ANDON_STATUS,
                'number',
              ),
            },
          },
          {
            fieldName: 'handleTime',
            label: '处置时间',
            component: 'DatePicker',
            componentProps: {
              class: '!w-full',
              disabled: !isUpdate,
              format: 'YYYY-MM-DD HH:mm:ss',
              placeholder: '请选择处置时间',
              type: 'datetime',
              valueFormat: 'x',
            },
          },
          isUpdate
            ? {
                fieldName: 'handlerUserId',
                label: '处置人',
                component: 'ApiSelect',
                componentProps: {
                  api: getSimpleUserList,
                  clearable: true,
                  labelField: 'nickname',
                  placeholder: '请选择处置人',
                  valueField: 'id',
                },
              }
            : {
                fieldName: 'handlerUserNickname',
                label: '处置人',
                component: 'Input',
                componentProps: {
                  disabled: true,
                },
              },
        ] as VbenFormSchema[])),
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        autosize: { maxRows: 3, minRows: 2 },
        disabled: formType === 'detail',
        maxLength: 250,
        placeholder: '请输入备注',
      },
    },
  ];
}
