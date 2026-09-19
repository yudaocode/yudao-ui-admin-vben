import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h, markRaw } from 'vue';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime, handleTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { getSimpleDeptList } from '#/api/system/dept';
import { DictTag } from '#/components/dict-tag';
import { getRangePickerDefaultProps } from '#/utils';
import { OaMeetingRoomReminderType } from '#/views/oa/utils/constants';
import { UserSelect } from '#/views/system/user/components';

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
    {
      fieldName: 'roomId',
      label: '会议室',
      component: 'Input',
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'roomName',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'roomLocation',
      label: '会议室位置',
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: '选择会议室后显示',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'title',
      label: '会议主题',
      component: 'Input',
      componentProps: {
        maxlength: 200,
        placeholder: '请输入会议主题',
      },
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'startTime',
      label: '会议开始时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择开始时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'endTime',
      label: '会议结束时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择结束时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
      dependencies: {
        rules: (values) =>
          z
            .any()
            .refine((value) => !!value, '结束时间不能为空')
            .refine(
              () =>
                !values.startTime ||
                !values.endTime ||
                Number(values.endTime) > Number(values.startTime),
              '结束时间必须晚于开始时间',
            ),
        triggerFields: ['startTime', 'endTime'],
      },
    },
    {
      fieldName: 'moderatorUserId',
      label: '主持人',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择主持人',
      },
      rules: 'required',
    },
    {
      fieldName: 'reminderType',
      label: '会议提醒',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.OA_MEETING_ROOM_REMINDER_TYPE,
          'number',
        ),
        placeholder: '请选择提醒方式',
      },
      rules: z.number().default(OaMeetingRoomReminderType.NONE),
    },
    {
      fieldName: 'attendeeUserIds',
      label: '参会人员',
      component: markRaw(UserSelect),
      componentProps: {
        multiple: true,
        placeholder: '请选择参会人员',
      },
      formItemClass: 'col-span-2',
      defaultValue: [],
    },
    {
      fieldName: 'description',
      label: '会议说明',
      component: 'Textarea',
      componentProps: {
        maxlength: 500,
        showCount: true,
        rows: 3,
        placeholder: '请输入会议内容',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'remark',
      label: '申请备注',
      component: 'Textarea',
      componentProps: {
        maxlength: 500,
        showCount: true,
        rows: 2,
        placeholder: '请输入备注',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'fileUrls',
      label: '附件',
      component: 'FileUpload',
      componentProps: {
        maxNumber: 5,
      },
      formItemClass: 'col-span-2',
      defaultValue: [],
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '单据编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入单据编号',
      },
    },
    {
      fieldName: 'status',
      label: '单据状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '未提交', value: BpmProcessInstanceStatus.NOT_START },
          ...getDictOptions(
            DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
            'number',
          ).filter((item) => item.value !== BpmProcessInstanceStatus.NOT_START),
        ],
        allowClear: true,
        placeholder: '请选择单据状态',
      },
    },
    {
      fieldName: 'roomName',
      label: '会议室名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入会议室名称',
      },
    },
    {
      fieldName: 'title',
      label: '会议主题',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入会议主题',
      },
    },
    {
      fieldName: 'moderatorName',
      label: '主持人',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入主持人',
      },
    },
    {
      fieldName: 'deptId',
      label: '申请部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        fieldNames: { label: 'name', value: 'id', children: 'children' },
        allowClear: true,
        placeholder: '请选择申请部门',
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'useStatus',
      label: '使用状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_MEETING_ROOM_USE_STATUS, 'number'),
        allowClear: true,
        placeholder: '请选择使用状态',
      },
    },
    {
      fieldName: 'startTime',
      label: '会议开始时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'endTime',
      label: '会议结束时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'creator',
      label: '创建人',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择创建人',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'no',
      title: '单据编号',
      minWidth: 220,
      slots: { default: 'no' },
    },
    {
      field: 'status',
      title: '单据状态',
      minWidth: 110,
      slots: { default: 'status' },
    },
    {
      field: 'useStatus',
      title: '使用状态',
      minWidth: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_MEETING_ROOM_USE_STATUS },
      },
    },
    {
      field: 'roomName',
      title: '会议室名称',
      minWidth: 160,
    },
    {
      field: 'roomLocation',
      title: '会议室位置',
      minWidth: 160,
    },
    {
      field: 'roomType',
      title: '会议室类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_MEETING_ROOM_TYPE },
      },
    },
    {
      field: 'title',
      title: '会议主题',
      minWidth: 180,
    },
    {
      field: 'startTime',
      title: '会议开始时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '会议结束时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'moderatorName',
      title: '主持人',
      minWidth: 120,
    },
    {
      field: 'creatorName',
      title: '申请人',
      minWidth: 120,
    },
    {
      field: 'deptName',
      title: '申请部门',
      minWidth: 140,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 会议室预定详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'no',
      label: '预定单号',
    },
    {
      field: 'roomName',
      label: '会议室',
    },
    {
      field: 'roomLocation',
      label: '位置',
    },
    {
      field: 'roomType',
      label: '会议室类型',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_MEETING_ROOM_TYPE, value }),
    },
    {
      field: 'title',
      label: '会议主题',
    },
    {
      field: 'creatorName',
      label: '申请人',
    },
    {
      field: 'deptName',
      label: '申请部门',
    },
    {
      field: 'moderatorName',
      label: '主持人',
    },
    {
      field: 'startTime',
      label: '开始时间',
      render: (value) => formatDateTime(value) || '-',
    },
    {
      field: 'endTime',
      label: '结束时间',
      render: (value) => formatDateTime(value) || '-',
    },
    {
      field: 'attendeeNames',
      label: '参会人',
      render: (value) => (value || []).join('、') || '-',
    },
    {
      field: 'reminderType',
      label: '提醒方式',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_MEETING_ROOM_REMINDER_TYPE, value }),
    },
    {
      field: 'status',
      label: '审批状态',
      slot: 'status',
    },
    {
      field: 'useStatus',
      label: '使用状态',
      render: (value) =>
        h(DictTag, {
          type: DICT_TYPE.OA_MEETING_ROOM_USE_STATUS,
          value,
        }),
    },
    {
      field: 'needApproval',
      label: '需要审批',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.INFRA_BOOLEAN_STRING, value }),
    },
    {
      field: 'createTime',
      label: '创建时间',
      render: (value) => formatDateTime(value) || '-',
    },
    {
      field: 'description',
      label: '会议内容',
    },
    {
      field: 'remark',
      label: '备注',
    },
    {
      field: 'fileUrls',
      label: '附件',
      span: 2,
      slot: 'fileUrls',
    },
  ];
}
