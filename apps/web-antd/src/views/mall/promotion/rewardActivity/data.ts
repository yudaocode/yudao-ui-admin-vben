import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { $t } from '@vben/locales';

import { getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '活动名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入活动名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '活动状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择活动状态',
        allowClear: true,
      },
    },
    {
      fieldName: 'createTime',
      label: '活动时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的表格列 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '活动名称',
      minWidth: 200,
    },
    {
      field: 'productScope',
      title: '活动范围',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PROMOTION_PRODUCT_SCOPE },
      },
    },
    {
      field: 'startTime',
      title: '活动开始时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '活动结束时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '活动名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入活动名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'startAndEndTime',
      label: '活动时间',
      component: 'RangePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: [$t('common.startTimeText'), $t('common.endTimeText')],
      },
      rules: 'required',
    },
    // TODO @puhui999：增加一个 defaultValue
    {
      fieldName: 'conditionType',
      label: '条件类型',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.PROMOTION_CONDITION_TYPE, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      defaultValue: PromotionConditionTypeEnum.PRICE.type,
      rules: 'required',
    },
    {
      fieldName: 'productScope',
      label: '活动范围',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.PROMOTION_PRODUCT_SCOPE, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: 'required',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 4,
      },
    },
  ];
}
