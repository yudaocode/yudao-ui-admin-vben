import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OrderApi } from '#/api/mpr/order';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { useAccess } from '@vben/access';
import { formatDateTime } from '@vben/utils';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

const { hasAccessByRoles } = useAccess();
const isAdmin = hasAccessByRoles(['super_admin']);

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
      fieldName: 'userId',
      label: '用户编号',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户编号',
      },
    },
    {
      fieldName: 'objectType',
      label: '对象类型',
      component: 'Select',
      componentProps: {
        options: [],
        placeholder: '请选择对象类型',
      },
    },
    {
      fieldName: 'objectId',
      label: '对象编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入对象编号',
      },
    },
    {
      fieldName: 'objectName',
      label: '对象名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入对象名称',
      },
    },
    {
      fieldName: 'billingType',
      label: '帐单类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MPR_BILLING_TYPE, 'string'),
        placeholder: '请选择帐单类型',
      },
    },
    {
      fieldName: 'billingMode',
      label: '账单模式',
      component: 'Input',
      componentProps: {
        placeholder: '请输入账单模式',
      },
    },
    {
      fieldName: 'price',
      label: '价格',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入价格',
      },
    },
    {
      fieldName: 'quantity',
      label: '数量',
      component: 'Input',
      componentProps: {
        placeholder: '请输入数量',
      },
    },
    {
      fieldName: 'currency',
      label: '货币',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MPR_ASSISTANT_STATUS, 'string'),
        placeholder: '请选择货币',
      },
    },
    {
      fieldName: 'payStatus',
      label: '是否已支付',
      rules: 'required',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.PAY_ORDER_STATUS, 'boolean'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
    {
      fieldName: 'payOrderId',
      label: '支付订单编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入支付订单编号',
      },
    },
    {
      fieldName: 'payChannelCode',
      label: '支付成功的支付渠道',
      component: 'Input',
      componentProps: {
        placeholder: '请输入支付成功的支付渠道',
      },
    },
    {
      fieldName: 'payTime',
      label: '订单支付时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'payRefundId',
      label: '退款订单编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入退款订单编号',
      },
    },
    {
      fieldName: 'refundPrice',
      label: '退款金额',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入退款金额',
      },
    },
    {
      fieldName: 'refundTime',
      label: '退款时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'transferChannelPackageInfo',
      label: '渠道 package 信息',
      component: 'Input',
      componentProps: {
        placeholder: '请输入渠道 package 信息',
      },
    },
    {
      fieldName: 'sessionId',
      label: '结账会话编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入结账会话编号',
      },
    },
    {
      fieldName: 'synced',
      label: '是否已同步到助手',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MPR_BOOLEAN_NUMBER, 'number'),
        placeholder: '请选择是否已同步到助手',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入用户编号',
      },
      dependencies: {
        triggerFields: [''],
        if(_values, _formApi) {
          return isAdmin;
        },
      },
    },
    {
      fieldName: 'objectId',
      label: '助理编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入助理编号',
      },
    },
    {
      fieldName: 'objectName',
      label: '对象名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入对象名称',
      },
      dependencies: {
        triggerFields: [''],
        if(_values, _formApi) {
          return false;
        },
      },
    },
    {
      fieldName: 'billingType',
      label: '帐单类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MPR_BILLING_TYPE, 'string'),
        placeholder: '请选择帐单类型',
      },
    },
    {
      fieldName: 'billingMode',
      label: '账单模式',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MPR_BILLING_MODE, 'string'),
        placeholder: '请选择账单模式',
      },
    },
    {
      fieldName: 'payStatus',
      label: '是否支付',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
        placeholder: '请选择是否已支付',
      },
    },
    {
      fieldName: 'payTime',
      label: '支付时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'refundTime',
      label: '退款时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'sessionId',
      label: '会话编号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入结账会话编号',
      },
    },
    {
      fieldName: 'synced',
      label: '数据同步',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MPR_BOOLEAN_NUMBER, 'number'),
        placeholder: '请选择是否已同步到助手',
      },
      dependencies: {
        triggerFields: [''],
        if(_values, _formApi) {
          return isAdmin;
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
export function useGridColumns(): VxeTableGridOptions<OrderApi.Order>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '订单编号',
      minWidth: 80,
    },
    {
      field: 'objectId',
      title: '助理编号',
      minWidth: 120,
    },
    {
      field: 'objectName',
      title: '助理名称',
      minWidth: 120,
    },
    {
      field: 'billingType',
      title: '帐单类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MPR_BILLING_TYPE },
      },
    },
    {
      field: 'billingMode',
      title: '账单模式',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MPR_BILLING_MODE },
      },
    },
    {
      field: 'price',
      title: '价格',
      minWidth: 120,
      formatter: ({ row }) => `$${(row.price / 100).toFixed(2)}`,
    },
    {
      field: 'quantity',
      title: '数量',
      minWidth: 120,
      visible: false,
    },
    {
      field: 'currency',
      title: '货币',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MPR_ASSISTANT_STATUS },
      },
      visible: false,
    },
    {
      field: 'payStatus',
      title: '是否已支付',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'payTime',
      title: '订单支付时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'refundPrice',
      title: '退款金额',
      minWidth: 120,
    },
    {
      field: 'refundTime',
      title: '退款时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'sessionId',
      title: '结账会话编号',
      minWidth: 120,
    },
    {
      field: 'synced',
      title: '是否已同步到助手',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MPR_BOOLEAN_NUMBER },
      },
      visible: isAdmin,
    },
    {
      field: 'userId',
      title: '用户编号',
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

/** 详情的配置 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'id',
      label: '订单编号',
    },
    {
      field: 'objectId',
      label: '助理编号',
    },
    {
      field: 'name',
      label: '名称',
    },
    {
      field: 'billingType',
      label: '账单类型',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.MPR_BILLING_TYPE,
          value: data?.billingType,
        }),
    },
    {
      field: 'billingMode',
      label: '账单模式',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.MPR_BILLING_MODE,
          value: data?.billingMode,
        }),
    },
    {
      field: 'price',
      label: '价格',
      content: (data) => `$${(data.price / 100).toFixed(2)}`,
    },
    {
      field: 'payStatus',
      label: '是否支付',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.INFRA_BOOLEAN_STRING,
          value: data?.payStatus,
        }),
    },
    {
      field: 'payTime',
      label: '支付时间',
      content: (data) => formatDateTime(data.payTime),
    },
    {
      field: 'refundPrice',
      label: '退款金额',
    },
    {
      field: 'refundTime',
      label: '退款时间',
      content: (data) => formatDateTime(data.refundTime),
    },
    {
      field: 'sessionId',
      label: '结账会话编号',
    },
    {
      field: 'synced',
      label: '同步到助手',
      hidden: !isAdmin,
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.MPR_BOOLEAN_NUMBER,
          value: data?.synced,
        }),
    },
    {
      field: 'userId',
      label: '用户编号',
      hidden: !isAdmin,
    },
    {
      field: 'createTime',
      label: '创建时间',
      content: (data) => formatDateTime(data.createTime),
    },
    {
      hidden: true,
      field: 'nextTimes',
      label: '后续执行时间',
      content: (data) => {
        if (!data?.nextTimes) {
          return '无后续执行时间';
        }
        if (data.nextTimes.length === 0) {
          return '无后续执行时间';
        }
        return h(Timeline, {}, () =>
          data.nextTimes.map((time: any) =>
            h(Timeline.Item, {}, () => formatDateTime(time)?.toString()),
          ),
        );
      },
    },
  ];
}
