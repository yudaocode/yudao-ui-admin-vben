import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';
import {
  OA_ATTENDANCE_STATUS,
  OA_ATTENDANCE_TYPE,
} from '#/views/oa/utils/constants';
import { UserSelect } from '#/views/system/user/components';

/** 获得考勤状态选项：上班打卡可选正常、迟到；下班打卡可选正常、早退；请假、出差分别仅可选对应状态 */
export function getAttendanceStatusOptions(type?: number) {
  const allowedStatusValues: number[] =
    {
      [OA_ATTENDANCE_TYPE.CLOCK_IN]: [
        OA_ATTENDANCE_STATUS.NORMAL,
        OA_ATTENDANCE_STATUS.LATE,
      ],
      [OA_ATTENDANCE_TYPE.CLOCK_OUT]: [
        OA_ATTENDANCE_STATUS.NORMAL,
        OA_ATTENDANCE_STATUS.EARLY,
      ],
      [OA_ATTENDANCE_TYPE.LEAVE]: [OA_ATTENDANCE_STATUS.LEAVE],
      [OA_ATTENDANCE_TYPE.TRAVEL]: [OA_ATTENDANCE_STATUS.TRAVEL],
    }[type ?? 0] ?? [];
  return getDictOptions(DICT_TYPE.OA_ATTENDANCE_STATUS, 'number').filter(
    (item) => allowedStatusValues.includes(item.value as number),
  );
}

/** 修改考勤记录的表单 */
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
    {
      fieldName: 'type',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'userName',
      label: '员工',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'typeName',
      label: '考勤类型',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'attendanceTime',
      label: '考勤时间',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'status',
      label: '考勤状态',
      component: 'Select',
      componentProps: {
        options: getAttendanceStatusOptions(),
        placeholder: '请选择考勤状态',
      },
      dependencies: {
        triggerFields: ['type'],
        componentProps: (values) => ({
          options: getAttendanceStatusOptions(values.type),
        }),
      },
      rules: 'required',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        maxlength: 500,
        showWordLimit: true,
        rows: 3,
        placeholder: '请输入备注',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '员工',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择员工',
      },
    },
    {
      fieldName: 'type',
      label: '考勤类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_ATTENDANCE_TYPE, 'number'),
        clearable: true,
        placeholder: '请选择考勤类型',
      },
    },
    {
      fieldName: 'status',
      label: '考勤状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_ATTENDANCE_STATUS, 'number'),
        clearable: true,
        placeholder: '请选择考勤状态',
      },
    },
    {
      fieldName: 'attendanceTime',
      label: '考勤时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'userName',
      title: '员工',
      minWidth: 120,
      align: 'center',
    },
    {
      field: 'deptName',
      title: '部门',
      minWidth: 120,
      align: 'center',
    },
    {
      field: 'type',
      title: '考勤类型',
      width: 110,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_ATTENDANCE_TYPE },
      },
    },
    {
      field: 'status',
      title: '考勤状态',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_ATTENDANCE_STATUS },
      },
    },
    {
      field: 'attendanceTime',
      title: '考勤时间',
      width: 180,
      align: 'center',
      formatter: 'formatDateTime',
    },
    {
      field: 'attendanceIp',
      title: '考勤 IP',
      minWidth: 130,
      align: 'center',
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 180,
      align: 'center',
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}
