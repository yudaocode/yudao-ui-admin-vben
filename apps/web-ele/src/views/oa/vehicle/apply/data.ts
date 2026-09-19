import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { handleTree } from '@vben/utils';

import { getSimpleDeptList } from '#/api/system/dept';
import { getRangePickerDefaultProps } from '#/utils';

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
      fieldName: 'no',
      label: '申请单号',
      component: 'Input',
      componentProps: {
        placeholder: '保存后自动生成',
        disabled: true,
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'vehicleId',
      label: '车辆',
      component: 'Input',
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'startTime',
      label: '预计出车时间',
      component: 'DatePicker',
      componentProps: {
        type: 'datetime',
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择出车时间',
      },
      rules: 'required',
    },
    {
      fieldName: 'endTime',
      label: '预计回车时间',
      component: 'DatePicker',
      componentProps: {
        type: 'datetime',
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择回车时间',
      },
      rules: 'required',
    },
    {
      fieldName: 'startLocation',
      label: '出车地点',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入出车地点',
      },
      rules: 'required',
    },
    {
      fieldName: 'endLocation',
      label: '预计回车地点',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入回车地点',
      },
      rules: 'required',
    },
    {
      fieldName: 'passenger',
      label: '随行人',
      component: 'Input',
      componentProps: {
        maxlength: 500,
        placeholder: '请输入随行人',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'reason',
      label: '用车事由',
      component: 'Textarea',
      componentProps: {
        rows: 3,
        maxlength: 500,
        showWordLimit: true,
        placeholder: '请输入用车事由',
      },
      formItemClass: 'col-span-2',
      rules: 'required',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        rows: 2,
        maxlength: 500,
        showWordLimit: true,
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
        maxSize: 5,
      },
      formItemClass: 'col-span-2',
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
        clearable: true,
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
        clearable: true,
        placeholder: '请选择单据状态',
      },
    },
    {
      fieldName: 'vehicleNo',
      label: '车辆',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入车牌号',
      },
    },
    {
      fieldName: 'deptId',
      label: '申请部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => {
          const data = await getSimpleDeptList();
          return handleTree(data);
        },
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择申请部门',
        clearable: true,
        defaultExpandAll: true,
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
    {
      fieldName: 'returnStatus',
      label: '还车状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_VEHICLE_RETURN_STATUS, 'number'),
        clearable: true,
        placeholder: '请选择还车状态',
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
      width: 110,
      slots: { default: 'statusTag' },
    },
    {
      field: 'vehicleNo',
      title: '车辆',
      width: 130,
    },
    {
      field: 'reason',
      title: '用车事由',
      minWidth: 180,
    },
    {
      field: 'startTime',
      title: '出车时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '回车时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'startLocation',
      title: '出车地点',
      minWidth: 160,
    },
    {
      field: 'endLocation',
      title: '回车地点',
      minWidth: 160,
    },
    {
      field: 'passenger',
      title: '随行人',
      minWidth: 160,
    },
    {
      field: 'returnStatus',
      title: '还车状态',
      width: 110,
      slots: { default: 'returnStatusTag' },
    },
    {
      field: 'userName',
      title: '申请人',
      width: 120,
    },
    {
      field: 'deptName',
      title: '申请部门',
      width: 160,
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
