import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ContactApi } from '#/api/member/contact';

import { pinyin } from 'pinyin-pro';

import { z } from '#/adapter/form';
import { DICT_TYPE, getDictOptions } from '#/utils';

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
      fieldName: 'name',
      label: '姓名',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入姓名',
      },
    },
    {
      fieldName: 'index',
      label: '索引',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.ALPHABETICAL_INDEX, 'string'),
      },
      dependencies: {
        triggerFields: ['name'],
        trigger(values, form) {
          if (values.name) {
            const capital = pinyin(values.name.slice(0, 1), {
              pattern: 'first',
            }).toUpperCase();
            form.setFieldValue('index', capital);
          } else {
            form.setFieldValue('index', undefined);
          }
        },
      },
    },
    {
      fieldName: 'mobile',
      label: '手机号码',
      rules: 'mobileRequired',
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号码',
      },
    },
    {
      fieldName: 'email',
      label: '电子邮件',
      component: 'Input',
      componentProps: {
        placeholder: '请输入电子邮件',
      },
      rules: z.string().email('请输入正确的邮箱').optional(),
    },
    {
      fieldName: 'emergency',
      label: '紧急联系人',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
      },
      defaultValue: false,
    },
    {
      fieldName: 'relationship',
      label: '与本人关系',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.MEMBER_CONTACT_RELATIONSHIP,
          'number',
        ),
      },
      dependencies: {
        triggerFields: ['emergency'],
        required: (values) => values.emergency,
        show: (values) => values.emergency,
      },
    },
    {
      fieldName: 'userId',
      label: '用户编号',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '姓名',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入姓名',
      },
    },
    {
      fieldName: 'index',
      label: '索引',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.ALPHABETICAL_INDEX, 'string'),
        allowClear: true,
      },
    },
    {
      fieldName: 'mobile',
      label: '手机号码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入手机号码',
      },
    },
    {
      fieldName: 'email',
      label: '电子邮件',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入电子邮件',
      },
    },
    {
      fieldName: 'emergency',
      label: '紧急联系人',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
        allowClear: true,
      },
    },
    {
      fieldName: 'relationship',
      label: '与本人关系',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.MEMBER_CONTACT_RELATIONSHIP,
          'number',
        ),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<ContactApi.Contact>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
      minWidth: 120,
    },
    {
      field: 'name',
      title: '姓名',
      minWidth: 120,
    },
    {
      field: 'index',
      title: '索引',
      minWidth: 120,
    },
    {
      field: 'mobile',
      title: '手机号码',
      minWidth: 120,
    },
    {
      field: 'email',
      title: '电子邮件',
      minWidth: 120,
    },
    {
      field: 'emergency',
      title: '紧急联系人',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'relationship',
      title: '与本人关系',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MEMBER_CONTACT_RELATIONSHIP },
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
