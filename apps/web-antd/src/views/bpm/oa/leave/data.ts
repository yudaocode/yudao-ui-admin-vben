import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BpmCategoryApi } from '#/api/bpm/category';

import { useAccess } from '@vben/access';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

const { hasAccessByCodes } = useAccess();
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
      fieldName: 'type',
      label: '请假类型',
      component: 'Select',
      componentProps: {
        placeholder: '请选择请假类型',
        options: getDictOptions(DICT_TYPE.BPM_OA_LEAVE_TYPE, 'number'),
        allowClear: true,
      },
      rules: 'required',
    },

    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择开始时间',
        showTime: true,
        valueFormat: 'x',
        format: 'YYYY-MM-DD HH:mm:ss',
      },
      rules: 'required',
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择结束时间',
        showTime: true,
        valueFormat: 'x',
        format: 'YYYY-MM-DD HH:mm:ss',
      },
      rules: 'required',
    },
    {
      fieldName: 'reason',
      label: '原因',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入原因',
      },
      rules: 'required',
    },
  ];
}

/** 列表的搜索表单 */
export function GridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'type',
      label: '请假类型',
      component: 'Select',
      componentProps: {
        placeholder: '请选择请假类型',
        options: getDictOptions(DICT_TYPE.BPM_OA_LEAVE_TYPE, 'number'),
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '审批结果',
      component: 'Select',
      componentProps: {
        placeholder: '请选择审批结果',
        options: getDictOptions(
          DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
          'number',
        ),
        allowClear: true,
      },
    },
    {
      fieldName: 'reason',
      label: '原因',
      component: 'Input',
      componentProps: {
        placeholder: '请输入原因',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = BpmCategoryApi.CategoryVO>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '申请编号',
      minWidth: 100,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS },
      },
    },
    {
      field: 'startTime',
      title: '开始时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '结束时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'type',
      title: '请假类型',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BPM_OA_LEAVE_TYPE },
      },
    },
    {
      field: 'reason',
      title: '原因',
      minWidth: 150,
    },
    {
      field: 'createTime',
      title: '申请时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },

    {
      field: 'operation',
      title: '操作',
      minWidth: 180,
      align: 'center',
      fixed: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '请假',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'detail',
            text: '详情',
            show: hasAccessByCodes(['bpm:oa-leave:query']),
          },
          {
            code: 'progress',
            text: '进度',
            show: hasAccessByCodes(['bpm:oa-leave:query']),
          },
          {
            code: 'cancel',
            text: '取消',
            show: (row: any) =>
              row.status === 1 && hasAccessByCodes(['bpm:oa-leave:query']),
          },
        ],
      },
    },
  ];
}
