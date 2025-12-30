import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ContactTemplateApi } from '#/api/mpr/contactTemplate';

import { useAccess } from '@vben/access';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

const { hasAccessByRoles } = useAccess();
const isAdmin = hasAccessByRoles(['super_admin']);

/** 新增/修改的表单 */
export function useFormSchema(isModal: boolean = false): VbenFormSchema[] {
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
      fieldName: 'userId',
      label: '用户ID',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户ID',
      },
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
        show: () => !isModal,
      },
    },
    {
      fieldName: 'type',
      label: '消息类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MPR_CONTACT_TEMPLATE_TYPE, 'string'),
        placeholder: '请选择消息类型',
      },
      dependencies: {
        triggerFields: [''],
        show: () => !isModal,
      },
    },
    {
      fieldName: 'title',
      label: '模版标题',
      help: '一个标签，方便识别',
      component: 'Input',
      componentProps: {
        placeholder: '请输入模版标题',
      },
    },
    {
      fieldName: 'content',
      label: '消息内容',
      help: '要发送的消息内容',
      component: 'Textarea',
    },
    {
      fieldName: 'isTellTime',
      label: '告诉对方你的时间',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MPR_BOOLEAN_NUMBER, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      fieldName: 'yourTime',
      label: '你的时间',
      component: 'DatePicker',
      dependencies: {
        triggerFields: ['isTellTime'],
        show: (value) => !!value.isTellTime,
      },
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'isTellLocation',
      label: '告诉对方你的地点',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MPR_BOOLEAN_NUMBER, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      fieldName: 'yourLocation',
      label: '你的地点',
      component: 'Input',
      dependencies: {
        triggerFields: ['isTellLocation'],
        show: (value) => !!value.isTellLocation,
      },
      componentProps: {
        placeholder: '请输入你的地点',
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
      fieldName: 'userId',
      label: '用户ID',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入用户ID',
      },
      dependencies: {
        triggerFields: [''],
        if(_values, _formApi) {
          return isAdmin;
        },
      },
    },
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
      fieldName: 'type',
      label: '消息类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MPR_CONTACT_TEMPLATE_TYPE, 'string'),
        placeholder: '请选择消息类型',
      },
    },
    {
      fieldName: 'isTellTime',
      label: '是否告诉对方你的时间',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MPR_BOOLEAN_NUMBER, 'boolean'),
        placeholder: '请选择是否告诉对方你的时间',
      },
      dependencies: {
        triggerFields: [''],
        if(_values, _formApi) {
          return false;
        },
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
export function useGridColumns(): VxeTableGridOptions<ContactTemplateApi.ContactTemplate>['columns'] {
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
      field: 'type',
      title: '消息类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MPR_CONTACT_TEMPLATE_TYPE },
      },
    },
    {
      field: 'title',
      title: '模版标题',
      minWidth: 120,
    },
    {
      field: 'content',
      title: '内容',
      minWidth: 120,
    },
    {
      field: 'isTellTime',
      title: '是否告诉对方你的时间',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MPR_BOOLEAN_NUMBER },
      },
    },
    {
      field: 'yourTime',
      title: '你的时间',
      minWidth: 120,
    },
    {
      field: 'isTellLocation',
      title: '是否告诉对方你的地点',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MPR_BOOLEAN_NUMBER },
      },
    },
    {
      field: 'yourLocation',
      title: '你的地点',
      minWidth: 120,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 120,
    },
    {
      field: 'userId',
      title: '用户ID',
      minWidth: 120,
      visible: isAdmin,
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

/** 获取状态选项卡配置 */
export function getTemplateTabs() {
  const tabs = [];

  // 添加字典状态选项
  const templateOptions = getDictOptions(DICT_TYPE.MPR_CONTACT_TEMPLATE_TYPE);
  for (const option of templateOptions) {
    tabs.push({
      label: option.label,
      value: String(option.value),
    });
  }

  return tabs;
}

// 转换函数
export function groupTemplateByType(
  messages: ContactTemplateApi.ContactTemplate[],
): Record<string, ContactTemplateApi.ContactTemplate> {
  // 1. 初始化空对象（与原代码的初始累加器一致）
  const result: Record<string, ContactTemplateApi.ContactTemplate> = {};

  // 2. 遍历数组，构建键值对映射
  messages.forEach((message) => {
    result[message.type] = message;
  });

  // 3. 返回构建完成的对象
  return result;
}
