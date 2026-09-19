import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import {
  OaMeetingRoomBookingScope,
  OaMeetingRoomStatus,
} from '#/views/oa/utils/constants';
import { UserSelect } from '#/views/system/user/components';

/** 新增/修改的表单 */
export function useFormSchema(options: {
  onManagerChange: (
    user: SystemUserApi.User | SystemUserApi.User[] | undefined,
  ) => void;
}): VbenFormSchema[] {
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
      fieldName: 'name',
      label: '会议室名称',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '请输入名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'type',
      label: '会议室类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_MEETING_ROOM_TYPE, 'number'),
        placeholder: '请选择类型',
      },
      rules: 'required',
    },
    {
      fieldName: 'location',
      label: '会议室位置',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入位置',
      },
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'managerUserId',
      label: '负责人',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择负责人',
        onChange: options.onManagerChange,
      },
      rules: 'required',
    },
    {
      fieldName: 'managerPhone',
      label: '负责人联系方式',
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: '选择负责人后显示',
      },
    },
    {
      fieldName: 'status',
      label: '可用状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_MEETING_ROOM_STATUS, 'number'),
      },
      rules: z.number().default(OaMeetingRoomStatus.NORMAL),
    },
    {
      fieldName: 'picUrl',
      label: '会议室图片',
      component: 'ImageUpload',
      componentProps: {
        maxNumber: 1,
      },
    },
    {
      fieldName: 'seatCount',
      label: '坐席数',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        precision: 0,
        placeholder: '请输入坐席数',
      },
    },
    {
      fieldName: 'equipments',
      label: '会议室设备',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_MEETING_ROOM_EQUIPMENT, 'number'),
        mode: 'multiple',
        placeholder: '请选择设备',
      },
      defaultValue: [],
    },
    {
      fieldName: 'allowBooking',
      label: '允许预定',
      component: 'Switch',
      rules: z.boolean().default(true),
    },
    {
      fieldName: 'needApproval',
      label: '预定需审批',
      component: 'Switch',
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'bookingScope',
      label: '可用范围',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.OA_MEETING_ROOM_BOOKING_SCOPE,
          'number',
        ),
      },
      rules: z.number().default(OaMeetingRoomBookingScope.ALL),
    },
    {
      fieldName: 'sort',
      label: '显示顺序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 0,
        placeholder: '请输入显示顺序',
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'bookingUserIds',
      label: '指定成员',
      component: markRaw(UserSelect),
      componentProps: {
        multiple: true,
        placeholder: '请选择指定成员',
      },
      formItemClass: 'col-span-2',
      defaultValue: [],
      dependencies: {
        rules: (values) =>
          values.bookingScope === OaMeetingRoomBookingScope.SPECIFIED
            ? 'required'
            : null,
        show: (values) =>
          values.bookingScope === OaMeetingRoomBookingScope.SPECIFIED,
        triggerFields: ['bookingScope'],
      },
    },
    {
      fieldName: 'fileUrls',
      label: '附件',
      component: 'FileUpload',
      componentProps: {
        maxNumber: 10,
        maxSize: 10,
      },
      formItemClass: 'col-span-2',
      defaultValue: [],
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        maxlength: 200,
        showCount: true,
        rows: 2,
        placeholder: '请输入备注',
      },
      formItemClass: 'col-span-2',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '会议室名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入会议室名称',
      },
    },
    {
      fieldName: 'location',
      label: '会议室位置',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入会议室位置',
      },
    },
    {
      fieldName: 'type',
      label: '会议室类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_MEETING_ROOM_TYPE, 'number'),
        allowClear: true,
        placeholder: '请选择会议室类型',
      },
    },
    {
      fieldName: 'managerName',
      label: '负责人',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入负责人姓名',
      },
    },
    {
      fieldName: 'status',
      label: '可用状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_MEETING_ROOM_STATUS, 'number'),
        allowClear: true,
        placeholder: '请选择可用状态',
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'picUrl',
      title: '会议室图片',
      width: 110,
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'name',
      title: '会议室名称',
      minWidth: 180,
    },
    {
      field: 'seatCount',
      title: '坐席数',
      minWidth: 90,
    },
    {
      field: 'type',
      title: '会议室类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_MEETING_ROOM_TYPE },
      },
    },
    {
      field: 'location',
      title: '会议室位置',
      minWidth: 180,
    },
    {
      field: 'managerName',
      title: '负责人',
      minWidth: 120,
    },
    {
      field: 'managerPhone',
      title: '联系方式',
      minWidth: 140,
    },
    {
      field: 'status',
      title: '可用状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_MEETING_ROOM_STATUS },
      },
    },
    {
      field: 'equipments',
      title: '会议室设备',
      minWidth: 200,
      slots: { default: 'equipments' },
    },
    {
      field: 'allowBooking',
      title: '允许预定',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'needApproval',
      title: '需审批',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'sort',
      title: '显示顺序',
      minWidth: 90,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 180,
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 会议室选择弹窗的搜索表单 */
export function useRoomSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '会议室名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入会议室名称',
      },
    },
    {
      fieldName: 'location',
      label: '会议室位置',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入会议室位置',
      },
    },
    {
      fieldName: 'type',
      label: '会议室类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_MEETING_ROOM_TYPE, 'number'),
        allowClear: true,
        placeholder: '请选择会议室类型',
      },
    },
  ];
}

/** 会议室选择弹窗的字段 */
export function useRoomSelectGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'radio',
      width: 50,
    },
    {
      field: 'name',
      title: '会议室名称',
      minWidth: 180,
    },
    {
      field: 'location',
      title: '会议室位置',
      minWidth: 180,
    },
    {
      field: 'type',
      title: '会议室类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_MEETING_ROOM_TYPE },
      },
    },
    {
      field: 'seatCount',
      title: '坐席数',
      width: 85,
    },
    {
      field: 'status',
      title: '可用状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_MEETING_ROOM_STATUS },
      },
    },
    {
      field: 'managerName',
      title: '负责人',
      width: 120,
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
