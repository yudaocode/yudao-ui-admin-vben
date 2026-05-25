import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProAndonConfigApi } from '#/api/mes/pro/andon/config';
import type { MesProAndonRecordApi } from '#/api/mes/pro/andon/record';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { getSimpleRoleList } from '#/api/system/role';
import { getSimpleUserList } from '#/api/system/user';
import { MdWorkstationSelect } from '#/views/mes/md/workstation/components';
import { ProProcessSelect } from '#/views/mes/pro/process/components';
import { ProWorkOrderSelect } from '#/views/mes/pro/workorder/components';
import { MesProWorkOrderStatusEnum } from '#/views/mes/utils/constants';

import { AndonConfigSelect } from '../config/components';

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'workstationId',
      label: '工作站',
      component: MdWorkstationSelect as any,
      componentProps: { allowClear: true, placeholder: '请选择工作站' },
    },
    {
      fieldName: 'userId',
      label: '发起人',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
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
        allowClear: true,
        api: getSimpleUserList,
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
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_PRO_ANDON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'createTime',
      label: '发起时间',
      component: 'RangePicker',
      componentProps: {
        allowClear: true,
        defaultTime: [
          new Date(2000, 0, 1, 0, 0, 0),
          new Date(2000, 0, 1, 23, 59, 59),
        ],
        format: 'YYYY-MM-DD HH:mm:ss',
        showTime: true,
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
    },
  ];
}

/** 列表字段 */
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

/** 安灯记录表单（按表单类型动态切换字段） */
export function useFormSchema(
  formType: 'create' | 'detail' | 'update',
  onConfigChange?: (config: MesProAndonConfigApi.AndonConfig | undefined) => void,
): VbenFormSchema[] {
  const isCreate = formType === 'create';
  const isUpdate = formType === 'update';
  const isDetail = formType === 'detail';
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
          component: MdWorkstationSelect as any,
          componentProps: { placeholder: '请选择工作站' },
          rules: 'selectRequired',
        }
      : {
          fieldName: 'workstationName',
          label: '工作站',
          component: 'Input',
          componentProps: { disabled: true },
        },
    isCreate
      ? {
          fieldName: 'userId',
          label: '发起人',
          component: 'ApiSelect',
          componentProps: {
            allowClear: true,
            api: getSimpleUserList,
            labelField: 'nickname',
            placeholder: '请选择发起人',
            valueField: 'id',
          },
        }
      : {
          fieldName: 'userNickname',
          label: '发起人',
          component: 'Input',
          componentProps: { disabled: true },
        },
    isCreate
      ? {
          fieldName: 'workOrderId',
          label: '生产工单',
          component: ProWorkOrderSelect as any,
          componentProps: {
            placeholder: '请选择工单（可选）',
            status: MesProWorkOrderStatusEnum.CONFIRMED,
          },
        }
      : {
          fieldName: 'workOrderCode',
          label: '生产工单',
          component: 'Input',
          componentProps: { disabled: true },
        },
    isCreate
      ? {
          fieldName: 'processId',
          label: '工序',
          component: ProProcessSelect as any,
          componentProps: { placeholder: '请选择工序（可选）' },
        }
      : {
          fieldName: 'processName',
          label: '工序',
          component: 'Input',
          componentProps: { disabled: true },
        },
    isCreate
      ? {
          fieldName: 'configId',
          label: '呼叫原因',
          component: AndonConfigSelect as any,
          componentProps: { onChange: onConfigChange },
          rules: 'selectRequired',
        }
      : {
          fieldName: 'reason',
          label: '呼叫原因',
          component: 'Input',
          componentProps: { disabled: true },
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
    // 处置信息：update / detail 才展示
    ...(isCreate
      ? []
      : ([
          {
            fieldName: 'status',
            label: '状态',
            component: 'Select',
            componentProps: {
              disabled: true,
              options: getDictOptions(DICT_TYPE.MES_PRO_ANDON_STATUS, 'number'),
            },
          },
          {
            fieldName: 'handleTime',
            label: '处置时间',
            component: 'DatePicker',
            componentProps: {
              disabled: !isUpdate,
              format: 'YYYY-MM-DD HH:mm:ss',
              placeholder: isUpdate ? '请选择处置时间' : undefined,
              showTime: true,
              valueFormat: 'x',
            },
          },
          isUpdate
            ? {
                fieldName: 'handlerUserId',
                label: '处置人',
                component: 'ApiSelect',
                componentProps: {
                  allowClear: true,
                  api: getSimpleUserList,
                  labelField: 'nickname',
                  placeholder: '请选择处置人',
                  valueField: 'id',
                },
              }
            : {
                fieldName: 'handlerUserNickname',
                label: '处置人',
                component: 'Input',
                componentProps: { disabled: true },
              },
        ] as VbenFormSchema[])),
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        disabled: isDetail,
        maxLength: 250,
        placeholder: '请输入备注',
        rows: 2,
      },
    },
  ];
}

/** 安灯配置表格列（弹窗内嵌网格） */
export function useConfigGridColumns(): VxeTableGridOptions<MesProAndonConfigApi.AndonConfig>['columns'] {
  return [
    { field: 'reason', title: '呼叫原因', minWidth: 200 },
    {
      field: 'level',
      title: '级别',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_ANDON_LEVEL },
      },
    },
    { field: 'handlerRoleName', title: '处置角色', width: 140 },
    { field: 'handlerUserNickname', title: '处置人', width: 140 },
    { field: 'remark', title: '备注', minWidth: 160 },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 安灯配置表单（弹窗内的新增/编辑表单） */
export function useConfigFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'reason',
      label: '呼叫原因',
      component: 'Textarea',
      componentProps: {
        autoSize: { maxRows: 3, minRows: 1 },
        maxLength: 200,
        placeholder: '请输入呼叫原因',
      },
      rules: z.string().min(1, '呼叫原因不能为空').max(200),
    },
    {
      fieldName: 'level',
      label: '级别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MES_PRO_ANDON_LEVEL, 'number'),
        placeholder: '请选择级别',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'handlerRoleId',
      label: '处置角色',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleRoleList,
        labelField: 'name',
        placeholder: '请选择角色（与处置人至少填一个）',
        valueField: 'id',
      },
    },
    {
      fieldName: 'handlerUserId',
      label: '处置人',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择处置人（与角色至少填一个）',
        valueField: 'id',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Input',
      componentProps: { maxLength: 100, placeholder: '请输入备注' },
    },
  ];
}
