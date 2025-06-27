import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { useUserStore } from '@vben/stores';

import { getContractSimpleList } from '#/api/crm/contract';
import { getCustomerSimpleList } from '#/api/crm/customer';
import {
  getReceivablePlan,
  getReceivablePlanSimpleList,
} from '#/api/crm/receivable/plan';
import { getSimpleUserList } from '#/api/system/user';
import { DICT_TYPE, getDictOptions } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  const userStore = useUserStore();
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
      label: '回款编号',
      component: 'Input',
      componentProps: {
        placeholder: '保存时自动生成',
        disabled: true,
      },
    },
    {
      fieldName: 'ownerUserId',
      label: '负责人',
      component: 'ApiSelect',
      rules: 'required',
      componentProps: {
        api: () => getSimpleUserList(),
        fieldNames: {
          label: 'nickname',
          value: 'id',
        },
        placeholder: '请选择负责人',
      },
      defaultValue: userStore.userInfo?.id,
    },
    {
      fieldName: 'customerId',
      label: '客户名称',
      component: 'ApiSelect',
      rules: 'required',
      componentProps: {
        api: () => getCustomerSimpleList(),
        fieldNames: {
          label: 'name',
          value: 'id',
        },
        placeholder: '请选择客户',
      },
    },
    {
      fieldName: 'contractId',
      label: '合同名称',
      component: 'Select',
      rules: 'required',
      dependencies: {
        triggerFields: ['customerId'],
        disabled: (values) => !values.customerId,
        async componentProps(values) {
          if (values.customerId) {
            values.contractId = undefined;
            const contracts = await getContractSimpleList(values.customerId);
            return {
              options: contracts.map((item) => ({
                label: item.name,
                value: item.id,
                disabled: item.auditStatus !== 20,
              })),
              placeholder: '请选择合同',
            } as any;
          }
        },
      },
    },
    {
      fieldName: 'planId',
      label: '回款期数',
      component: 'Select',
      rules: 'required',
      dependencies: {
        triggerFields: ['contractId'],
        disabled: (values) => !values.contractId,
        async componentProps(values) {
          if (values.contractId) {
            values.planId = undefined;
            const plans = await getReceivablePlanSimpleList(
              values.customerId,
              values.contractId,
            );
            return {
              options: plans.map((item) => ({
                label: item.period,
                value: item.id,
              })),
              placeholder: '请选择回款期数',
              onChange: async (value: any) => {
                const plan = await getReceivablePlan(value);
                values.returnTime = plan?.returnTime;
                values.price = plan?.price;
                values.returnType = plan?.returnType;
              },
            } as any;
          }
        },
      },
    },
    {
      fieldName: 'returnTime',
      label: '回款日期',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择回款日期',
        showTime: false,
        valueFormat: 'x',
        format: 'YYYY-MM-DD',
      },
    },
    {
      fieldName: 'price',
      label: '回款金额',
      component: 'InputNumber',
      rules: 'required',
      componentProps: {
        placeholder: '请输入回款金额',
        min: 0,
        precision: 2,
      },
    },
    {
      fieldName: 'returnType',
      label: '回款方式',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE, 'number'),
        placeholder: '请选择回款方式',
      },
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

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '回款编号',
      component: 'Input',
    },
    {
      fieldName: 'customerId',
      label: '客户',
      component: 'ApiSelect',
      componentProps: {
        api: () => getCustomerSimpleList(),
        fieldNames: {
          label: 'name',
          value: 'id',
        },
        placeholder: '请选择客户',
      },
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      title: '回款编号',
      field: 'no',
      minWidth: 150,
      fixed: 'left',
      slots: { default: 'no' },
    },
    {
      title: '客户名称',
      field: 'customerName',
      minWidth: 150,
      slots: { default: 'customerName' },
    },
    {
      title: '合同编号',
      field: 'contract',
      minWidth: 150,
      slots: { default: 'contractNo' },
    },
    {
      title: '回款日期',
      field: 'returnTime',
      minWidth: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '回款金额（元）',
      field: 'price',
      minWidth: 150,
      formatter: 'formatAmount2',
    },
    {
      title: '回款方式',
      field: 'returnType',
      minWidth: 150,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE },
      },
    },
    {
      title: '备注',
      field: 'remark',
      minWidth: 150,
    },
    {
      title: '合同金额（元）',
      field: 'contract.totalPrice',
      minWidth: 150,
      formatter: 'formatAmount2',
    },
    {
      title: '负责人',
      field: 'ownerUserName',
      minWidth: 150,
    },
    {
      title: '所属部门',
      field: 'ownerUserDeptName',
      minWidth: 150,
    },
    {
      title: '更新时间',
      field: 'updateTime',
      minWidth: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '创建时间',
      field: 'createTime',
      minWidth: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '创建人',
      field: 'creatorName',
      minWidth: 150,
    },
    {
      title: '回款状态',
      field: 'auditStatus',
      minWidth: 100,
      fixed: 'right',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_AUDIT_STATUS },
      },
    },
    {
      title: '操作',
      field: 'actions',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
