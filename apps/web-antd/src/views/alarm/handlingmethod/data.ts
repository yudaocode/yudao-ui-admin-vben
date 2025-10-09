import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AlarmHandlingMethodApi } from '#/api/alarm/handlingmethod';

import { DICT_TYPE, getDictOptions } from '#/utils';
// import { floorIdFilterField } from '#/views/bdm/apartment/data';
// import { apartmentIdFilterField } from '#/views/bdm/bed/data';
// import { zoneIdCompositeFilterField } from '#/views/bdm/building/data';
// import { buildingIdFilterField } from '#/views/bdm/floor/data';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    // ...zoneIdCompositeFilterField,
    // buildingIdFilterField,
    // floorIdFilterField,
    // apartmentIdFilterField,
    {
      fieldName: 'type',
      label: '报警类型',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.ALARM_TYPE, 'string'),
        placeholder: '请选择报警类型',
      },
    },
    {
      fieldName: 'level',
      label: '报警级别',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.ALARM_LEVEL, 'number'),
        placeholder: '请选择报警级别',
      },
    },
    {
      fieldName: 'emergencyAssistance',
      label: '紧急救助',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      defaultValue: 1,
      help: '开启后，触发该报警时会自动通知救助人员介入进行救助',
    },
    {
      fieldName: 'emergencyNotify',
      label: '紧急通知',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      defaultValue: 0,
      help: '开启后，触发该报警时会按通知方式通知紧急联系人',
    },
    {
      fieldName: 'notifyMethod',
      label: '通知方式',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.ALARM_NOTIFY_METHOD, 'number'),
        mode: 'multiple',
        placeholder: '请选择通知方式',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    // ...zoneIdCompositeFilterField,
    // buildingIdFilterField,
    // floorIdFilterField,
    // apartmentIdFilterField,
    {
      fieldName: 'type',
      label: '报警类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.ALARM_TYPE, 'string'),
        placeholder: '请选择报警类型',
      },
    },
    {
      fieldName: 'level',
      label: '报警级别',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.ALARM_LEVEL, 'number'),
        placeholder: '请选择报警级别',
      },
    },
    {
      fieldName: 'emergencyAssistance',
      label: '紧急救助',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      help: '开启后，触发该报警时会自动通知救助人员介入进行救助',
    },
    {
      fieldName: 'emergencyNotify',
      label: '紧急通知',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      help: '开启后，触发该报警时会按通知方式通知紧急联系人',
    },
    {
      fieldName: 'notifyMethod',
      label: '通知方式',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.ALARM_NOTIFY_METHOD, 'number'),
        mode: 'multiple',
        placeholder: '请选择通知方式',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<AlarmHandlingMethodApi.HandlingMethod>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'type',
      title: '报警类型',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.ALARM_TYPE },
      },
    },
    {
      field: 'level',
      title: '报警级别',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.ALARM_LEVEL },
      },
    },
    {
      field: 'emergencyAssistance',
      title: '紧急救助',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'emergencyNotify',
      title: '紧急通知',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'notifyMethod',
      title: '通知方式',
      minWidth: 120,
      cellRender: {
        name: 'CellDicts',
        props: { type: DICT_TYPE.ALARM_NOTIFY_METHOD },
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
