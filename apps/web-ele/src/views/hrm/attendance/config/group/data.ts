import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { handleTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { getSimpleDeptList } from '#/api/system/dept';
import HrmEmployeeMultiSelect from '#/views/hrm/employee/components/employee-multi-select.vue';
import {
  HRM_ATTENDANCE_POINT_RADIUS_OPTIONS,
  HRM_WEEK_OPTIONS,
  HrmAttendanceHolidayType,
} from '#/views/hrm/utils/constants';

export { formatHrmAttendanceWeeks } from '#/views/hrm/utils/format';

/** 考勤组基础信息表单 */
export function useGroupBaseFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { maxlength: 50, placeholder: '请输入考勤组名称' },
      fieldName: 'name',
      label: '考勤组名称',
      rules: 'required',
    },
    {
      component: 'ApiTreeSelect',
      componentProps: {
        clearable: true,
        api: async () => handleTree(await getSimpleDeptList()),
        childrenField: 'children',
        labelField: 'name',
        multiple: true,
        placeholder: '请选择部门',
        treeCheckable: true,
        treeDefaultExpandAll: true,
        valueField: 'id',
      },
      fieldName: 'deptIds',
      label: '适用部门',
    },
    {
      component: markRaw(HrmEmployeeMultiSelect),
      componentProps: { title: '选择考勤组员工' },
      fieldName: 'employeeIds',
      label: '适用员工',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        disabled: true,
        options: [{ label: '早晚打卡', value: 1 }],
      },
      defaultValue: 1,
      fieldName: 'ruleType',
      label: '规则类型',
    },
  ];
}

/** 打卡地址表单 */
export function usePointFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '地点名称',
      component: 'Input',
      rules: 'required',
      componentProps: { maxlength: 50, placeholder: '请输入地点名称' },
    },
    {
      fieldName: 'address',
      label: '打卡地址',
      component: 'Input',
      rules: 'required',
      componentProps: { maxlength: 255, placeholder: '请选择或输入地址' },
    },
    {
      fieldName: 'longitude',
      label: '经度',
      component: 'InputNumber',
      rules: z.coerce.number().min(-180, '经度不能小于 -180').max(180),
      componentProps: {
        controls: false,
        max: 180,
        min: -180,
        placeholder: '请输入或选择经度',
        precision: 6,
      },
    },
    {
      fieldName: 'latitude',
      label: '纬度',
      component: 'InputNumber',
      rules: z.coerce.number().min(-90, '纬度不能小于 -90').max(90),
      componentProps: {
        controls: false,
        max: 90,
        min: -90,
        placeholder: '请输入或选择纬度',
        precision: 6,
      },
    },
    {
      fieldName: 'radius',
      label: '打卡范围',
      component: 'Select',
      defaultValue: 300,
      rules: 'required',
      componentProps: {
        options: HRM_ATTENDANCE_POINT_RADIUS_OPTIONS.map((radius) => ({
          label: `${radius} 米`,
          value: radius,
        })),
      },
    },
  ];
}

/** WiFi 表单 */
export function useWifiFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'ssid',
      label: 'WiFi 名称',
      component: 'Input',
      rules: 'required',
      componentProps: { maxlength: 50, placeholder: '请输入 WiFi 名称' },
    },
    {
      fieldName: 'mac',
      label: 'MAC 地址',
      component: 'Input',
      rules: z
        .string()
        .min(1, 'MAC 地址不能为空')
        .regex(
          /^((([0-9a-f]{2}:){5})|(([0-9a-f]{2}-){5}))[0-9a-f]{2}$/i,
          'MAC 地址格式不正确',
        ),
      componentProps: {
        maxlength: 17,
        placeholder: '例如 00:11:22:33:44:55',
      },
    },
  ];
}

/** 特殊日期表单 */
export function useSpecialDateFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'type',
      label: '特殊日期类型',
      component: 'Select',
      defaultValue: HrmAttendanceHolidayType.WORK,
      rules: 'required',
      componentProps: {
        options: [
          { label: '上班', value: HrmAttendanceHolidayType.WORK },
          { label: '休息', value: HrmAttendanceHolidayType.REST },
        ],
        placeholder: '请选择特殊日期类型',
      },
    },
    {
      fieldName: 'date',
      label: '日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        class: 'w-full',
        placeholder: '请选择日期',
        valueFormat: 'x',
      },
    },
  ];
}

/** 班次表单 */
export function useShiftFormSchema(): VbenFormSchema[] {
  const timePickerProps = {
    class: 'w-full',
    format: 'HH:mm',
    valueFormat: 'HH:mm',
  };
  return [
    {
      fieldName: 'weeks',
      label: '工作日',
      component: 'CheckboxGroup',
      defaultValue: [1, 2, 3, 4, 5],
      rules: z.array(z.number()).min(1, '工作日不能为空'),
      formItemClass: 'col-span-2',
      componentProps: { options: HRM_WEEK_OPTIONS },
    },
    {
      fieldName: 'startTime',
      label: '上班时间',
      component: 'TimePicker',
      defaultValue: '09:00',
      rules: 'required',
      componentProps: timePickerProps,
    },
    {
      fieldName: 'endTime',
      label: '下班时间',
      component: 'TimePicker',
      defaultValue: '18:00',
      rules: 'required',
      componentProps: timePickerProps,
    },
    {
      fieldName: 'clockInTimeRange',
      label: '上班打卡时间段',
      component: 'TimeRangePicker',
      defaultValue: ['05:00', '17:59'],
      rules: 'required',
      formItemClass: 'col-span-2',
      componentProps: timePickerProps,
    },
    {
      fieldName: 'clockOutTimeRange',
      label: '下班打卡时间段',
      component: 'TimeRangePicker',
      defaultValue: ['09:01', '04:59'],
      rules: 'required',
      formItemClass: 'col-span-2',
      componentProps: timePickerProps,
    },
    {
      fieldName: 'restTimeRange',
      label: '休息时间',
      component: 'TimeRangePicker',
      defaultValue: ['12:00', '13:00'],
      rules: 'required',
      componentProps: timePickerProps,
    },
    {
      fieldName: 'excludeRestTime',
      label: '工作时长',
      component: 'Checkbox',
      defaultValue: false,
      componentProps: { text: '休息时间不计入工作时长' },
    },
  ];
}

export function useGridFormSchema() {
  return [
    {
      fieldName: 'name',
      label: '考勤组',
      component: 'Input',
      componentProps: { clearable: true, placeholder: '请输入考勤组名称' },
    },
  ];
}

export function useGridColumns(): VxeGridProps['columns'] {
  return [
    { field: 'name', title: '考勤组', minWidth: 160, fixed: 'left' },
    {
      field: 'shifts',
      title: '考勤班次',
      minWidth: 420,
      slots: { default: 'shifts' },
    },
    {
      field: 'ruleType',
      title: '考勤规则',
      minWidth: 120,
      formatter: () => '早晚打卡',
    },
    {
      field: 'scope',
      title: '适用范围',
      minWidth: 220,
      slots: { default: 'scope' },
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
