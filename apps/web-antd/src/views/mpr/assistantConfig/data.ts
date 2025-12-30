import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AssistantConfigApi } from '#/api/mpr/assistantConfig';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(action): VbenFormSchema[] {
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
      fieldName: 'assistantId',
      label: '助理ID',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入助理ID',
      },
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'keywordId',
      label: 'keywordID',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入关键词ID',
      },
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'keyword',
      label: '关键词',
      component: 'Textarea',
      componentProps: {
        rows: 2,
        placeholder: '请输入关键词',
      },
      rules: 'required',
    },
    {
      fieldName: 'isTargetFilter',
      label: 'AI筛选目标商品',
      component: 'RadioGroup',
      componentProps: {
        disabled: true,
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.MPR_BOOLEAN_NUMBER, 'number'),
        placeholder: '请输入是否AI筛选目标商品',
      },
    },
    {
      fieldName: 'aiPrompt',
      label: 'AI提示词',
      component: 'Textarea',
      componentProps: {
        rows: 4,
        placeholder: '请输入AI提示词',
      },
    },
    {
      fieldName: 'isAutoSelectIntended',
      label: '自动选择意向商品',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.MPR_BOOLEAN_NUMBER, 'number'),
        placeholder: '请输入是否自动选择意向商品',
      },
    },
    {
      fieldName: 'autoSelectIntendedRule',
      // label: '意向商品选择规则',
      dependencies: {
        triggerFields: ['isAutoSelectIntended'],
        show: (value) => !!value.isAutoSelectIntended,
      },
      component: 'PrimaryButton',
      componentProps: {
        innerHTML: '自定义意向商品选择规则',
        class: 'w-1/2',
        onClick: () => {
          action('rule');
        },
      },
    },
    {
      fieldName: 'isAutoSendMessage',
      label: '自动联系卖家',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.MPR_BOOLEAN_NUMBER, 'number'),
        placeholder: '请输入是否自动发送消息',
      },
    },
    {
      fieldName: 'messageTemplateId',
      // label: '自定义消息模版',
      dependencies: {
        triggerFields: ['isAutoSendMessage'],
        show: (value) => !!value.isAutoSendMessage,
      },
      component: 'PrimaryButton',
      componentProps: {
        innerHTML: '管理消息模版',
        class: 'w-1/3',
        onClick: () => {
          // 处理提交逻辑
          action('template');
        },
      },
    },
    {
      fieldName: 'sortBy',
      label: '排序',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MPR_FB_SEARCH_SORT_BY, 'string'),
        placeholder: '请选择排序',
      },
    },
    {
      fieldName: 'minPrice',
      label: '最小价格',
      component: 'Input',
      componentProps: {
        placeholder: '请输入最小价格',
      },
    },
    {
      fieldName: 'maxPrice',
      label: '最大价格',
      component: 'Input',
      componentProps: {
        placeholder: '请输入最大价格',
      },
    },
    {
      fieldName: 'itemCondition',
      label: '物品状态',
      component: 'Select',
      componentProps: {
        mode: 'tags',
        allowClear: true,
        options: getDictOptions(
          DICT_TYPE.MPR_FB_SEARCH_ITEM_CONDITION,
          'string',
        ),
        placeholder: '请选择物品状态',
      },
    },
    {
      fieldName: 'daysSinceListed',
      label: '发布时间',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MPR_FB_SEARCH_DATE, 'number'),
        placeholder: '请选择发布时间',
      },
    },
    {
      fieldName: 'availability',
      label: '有效性',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MPR_FB_SEARCH_AVAILABILITY, 'string'),
        placeholder: '请选择有效性',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'assistantId',
      label: '助理ID',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入助理ID',
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

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<AssistantConfigApi.AssistantConfig>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
      minWidth: 120,
    },
    {
      field: 'assistantId',
      title: '助理ID',
      minWidth: 120,
    },
    {
      field: 'sortBy',
      title: '排序',
      minWidth: 120,
    },
    {
      field: 'minPrice',
      title: '最小价格',
      minWidth: 120,
    },
    {
      field: 'maxPrice',
      title: '最大价格',
      minWidth: 120,
    },
    {
      field: 'itemCondition',
      title: 'Condition',
      minWidth: 120,
    },
    {
      field: 'daysSinceListed',
      title: '发布时间',
      minWidth: 120,
    },
    {
      field: 'availability',
      title: '有效性',
      minWidth: 120,
    },
    {
      field: 'isTargetFilter',
      title: '是否AI筛选目标商品',
      minWidth: 120,
    },
    {
      field: 'aiPrompt',
      title: 'AI提示词',
      minWidth: 120,
    },
    {
      field: 'isAutoSelectIntended',
      title: '是否自动选择意向商品',
      minWidth: 120,
    },
    {
      field: 'autoSelectIntendedRule',
      title: '自动选择意向商品规则',
      minWidth: 120,
    },
    {
      field: 'isAutoSendMessage',
      title: '是否自动发送消息',
      minWidth: 120,
    },
    {
      field: 'messageTemplateId',
      title: '消息模板ID',
      minWidth: 120,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 120,
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
