import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AlertConfigApi } from '#/api/iot/alert/config';

import { markRaw } from 'vue';

import {
  CommonStatusEnum,
  DICT_TYPE,
  IotAlertReceiveTypeEnum,
} from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getSimpleRuleSceneList } from '#/api/iot/rule/scene';
import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';
import { MailTemplateSelect } from '#/views/system/mail/template/components';
import { NotifyTemplateSelect } from '#/views/system/notify/template/components';
import { SmsTemplateSelect } from '#/views/system/sms/template/components';

function hasReceiveType(values: Partial<Record<string, any>>, type: number) {
  return Array.isArray(values.receiveTypes) && values.receiveTypes.includes(type);
}

/** 新增/修改告警配置的表单 */
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
      label: '配置名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入配置名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'description',
      label: '配置描述',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入配置描述',
        rows: 3,
      },
    },
    {
      fieldName: 'level',
      label: '告警级别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_ALERT_LEVEL, 'number'),
        placeholder: '请选择告警级别',
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '配置状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      defaultValue: CommonStatusEnum.ENABLE,
      rules: 'required',
    },
    {
      fieldName: 'sceneRuleIds',
      label: '关联场景联动规则',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleRuleSceneList,
        labelField: 'name',
        valueField: 'id',
        multiple: true,
        placeholder: '请选择关联的场景联动规则',
      },
      defaultValue: [],
      rules: 'required',
    },
    {
      fieldName: 'receiveUserIds',
      label: '接收的用户',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        labelField: 'nickname',
        valueField: 'id',
        multiple: true,
        placeholder: '请选择接收的用户',
      },
      defaultValue: [],
      rules: 'required',
    },
    {
      fieldName: 'receiveTypes',
      label: '接收类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.IOT_ALERT_RECEIVE_TYPE, 'number'),
        multiple: true,
        placeholder: '请选择接收类型',
      },
      defaultValue: [],
      rules: 'required',
    },
    {
      fieldName: 'smsTemplateCode',
      label: '短信模板',
      component: markRaw(SmsTemplateSelect),
      dependencies: {
        triggerFields: ['receiveTypes'],
        show: (values) => hasReceiveType(values, IotAlertReceiveTypeEnum.SMS),
        trigger: async (values, formApi) => {
          if (
            !hasReceiveType(values, IotAlertReceiveTypeEnum.SMS) &&
            values.smsTemplateCode
          ) {
            formApi.setFieldValue('smsTemplateCode', undefined);
          }
        },
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'mailTemplateCode',
      label: '邮件模板',
      component: markRaw(MailTemplateSelect),
      dependencies: {
        triggerFields: ['receiveTypes'],
        show: (values) => hasReceiveType(values, IotAlertReceiveTypeEnum.MAIL),
        trigger: async (values, formApi) => {
          if (
            !hasReceiveType(values, IotAlertReceiveTypeEnum.MAIL) &&
            values.mailTemplateCode
          ) {
            formApi.setFieldValue('mailTemplateCode', undefined);
          }
        },
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'notifyTemplateCode',
      label: '站内信模板',
      component: markRaw(NotifyTemplateSelect),
      dependencies: {
        triggerFields: ['receiveTypes'],
        show: (values) => hasReceiveType(values, IotAlertReceiveTypeEnum.NOTIFY),
        trigger: async (values, formApi) => {
          if (
            !hasReceiveType(values, IotAlertReceiveTypeEnum.NOTIFY) &&
            values.notifyTemplateCode
          ) {
            formApi.setFieldValue('notifyTemplateCode', undefined);
          }
        },
      },
      rules: 'selectRequired',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '配置名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入配置名称',
        clearable: true,
      },
    },
    {
      fieldName: 'status',
      label: '配置状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择配置状态',
        clearable: true,
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
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<AlertConfigApi.AlertConfig>['columns'] {
  return [
    {
      field: 'id',
      title: '配置编号',
      minWidth: 80,
    },
    {
      field: 'name',
      title: '配置名称',
      minWidth: 150,
    },
    {
      field: 'description',
      title: '配置描述',
      minWidth: 200,
    },
    {
      field: 'level',
      title: '告警级别',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.IOT_ALERT_LEVEL },
      },
    },
    {
      field: 'status',
      title: '配置状态',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'sceneRuleIds',
      title: '关联场景联动规则',
      minWidth: 150,
      formatter: ({ cellValue }) => `${cellValue?.length || 0} 条`,
    },
    {
      field: 'receiveUserNames',
      title: '接收人',
      minWidth: 150,
    },
    {
      field: 'receiveTypes',
      title: '接收类型',
      minWidth: 150,
      slots: { default: 'receiveTypes' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
