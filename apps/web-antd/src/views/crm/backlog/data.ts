import type { Ref } from 'vue';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CrmReceivableApi } from '#/api/crm/receivable';

import { useAccess } from '@vben/access';

import { DICT_TYPE } from '#/utils';

const { hasAccessByCodes } = useAccess();

export interface LeftSideItem {
  name: string;
  menu: string;
  count: Ref<number>;
}

/** 跟进状态 */
export const FOLLOWUP_STATUS = [
  { label: '待跟进', value: false },
  { label: '已跟进', value: true },
];

/** 归属范围 */
export const SCENE_TYPES = [
  { label: '我负责的', value: 1 },
  { label: '我参与的', value: 2 },
  { label: '下属负责的', value: 3 },
];

/** 联系状态 */
export const CONTACT_STATUS = [
  { label: '今日需联系', value: 1 },
  { label: '已逾期', value: 2 },
  { label: '已联系', value: 3 },
];

/** 审批状态 */
export const AUDIT_STATUS = [
  { label: '待审批', value: 10 },
  { label: '审核通过', value: 20 },
  { label: '审核不通过', value: 30 },
];

/** 回款提醒类型 */
export const RECEIVABLE_REMIND_TYPE = [
  { label: '待回款', value: 1 },
  { label: '已逾期', value: 2 },
  { label: '已回款', value: 3 },
];

/** 合同过期状态 */
export const CONTRACT_EXPIRY_TYPE = [
  { label: '即将过期', value: 1 },
  { label: '已过期', value: 2 },
];

export const useLeftSides = (
  customerTodayContactCount: Ref<number>,
  clueFollowCount: Ref<number>,
  customerFollowCount: Ref<number>,
  customerPutPoolRemindCount: Ref<number>,
  contractAuditCount: Ref<number>,
  contractRemindCount: Ref<number>,
  receivableAuditCount: Ref<number>,
  receivablePlanRemindCount: Ref<number>,
): LeftSideItem[] => {
  return [
    {
      name: '今日需联系客户',
      menu: 'customerTodayContact',
      count: customerTodayContactCount,
    },
    {
      name: '分配给我的线索',
      menu: 'clueFollow',
      count: clueFollowCount,
    },
    {
      name: '分配给我的客户',
      menu: 'customerFollow',
      count: customerFollowCount,
    },
    {
      name: '待进入公海的客户',
      menu: 'customerPutPoolRemind',
      count: customerPutPoolRemindCount,
    },
    {
      name: '待审核合同',
      menu: 'contractAudit',
      count: contractAuditCount,
    },
    {
      name: '待审核回款',
      menu: 'receivableAudit',
      count: receivableAuditCount,
    },
    {
      name: '待回款提醒',
      menu: 'receivablePlanRemind',
      count: receivablePlanRemindCount,
    },
    {
      name: '即将到期的合同',
      menu: 'contractRemind',
      count: contractRemindCount,
    },
  ];
};

/** 分配给我的线索 列表的搜索表单 */
export function useClueFollowFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'followUpStatus',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: FOLLOWUP_STATUS,
      },
      defaultValue: false,
    },
  ];
}

/** 分配给我的线索 列表的字段 */
export function useClueFollowColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '线索名称',
      fixed: 'left',
      slots: { default: 'name' },
    },
    {
      field: 'source',
      title: '线索来源',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_SOURCE },
      },
    },
    {
      field: 'mobile',
      title: '手机',
    },
    {
      field: 'telephone',
      title: '电话',
    },
    {
      field: 'email',
      title: '邮箱',
    },
    {
      field: 'detailAddress',
      title: '地址',
    },
    {
      field: 'industryId',
      title: '客户行业',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_INDUSTRY },
      },
    },
    {
      field: 'level',
      title: '客户级别',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_LEVEL },
      },
    },
    {
      field: 'contactNextTime',
      title: '下次联系时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'remark',
      title: '备注',
    },
    {
      field: 'contactLastTime',
      title: '最后跟进时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'contactLastContent',
      title: '最后跟进记录',
    },
    {
      field: 'ownerUserName',
      title: '负责人',
    },
    {
      field: 'ownerUserDeptName',
      title: '所属部门',
    },
    {
      field: 'updateTime',
      title: '更新时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'creatorName',
      title: '创建人',
    },
  ];
}

/** 合同审核列表的搜索表单 */
export function useContractAuditFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'auditStatus',
      label: '合同状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: AUDIT_STATUS,
      },
      defaultValue: 10,
    },
  ];
}

/** 合同提醒列表的搜索表单 */
export function useContractRemindFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'expiryType',
      label: '到期状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: CONTRACT_EXPIRY_TYPE,
      },
      defaultValue: 1,
    },
  ];
}

/** 合同审核列表的字段 */
export function useContractColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'no',
      title: '合同编号',
      fixed: 'left',
    },
    {
      field: 'name',
      title: '合同名称',
      slots: { default: 'name' },
    },
    {
      field: 'customerName',
      title: '客户名称',
      slots: { default: 'customerName' },
    },
    {
      field: 'businessName',
      title: '商机名称',
      slots: { default: 'businessName' },
    },
    {
      field: 'price',
      title: '合同金额（元）',
      formatter: 'formatNumber',
    },
    {
      field: 'orderDate',
      title: '下单时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'startTime',
      title: '合同开始时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '合同结束时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'contactName',
      title: '客户签约人',
      slots: { default: 'contactName' },
    },
    {
      field: 'signUserName',
      title: '公司签约人',
    },
    {
      field: 'remark',
      title: '备注',
    },
    {
      field: 'totalReceivablePrice',
      title: '已回款金额（元）',
      formatter: 'formatNumber',
    },
    {
      field: 'noReceivablePrice',
      title: '未回款金额（元）',
      formatter: 'formatNumber',
    },
    {
      field: 'contactLastTime',
      title: '最后跟进时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'ownerUserName',
      title: '负责人',
    },
    {
      field: 'ownerUserDeptName',
      title: '所属部门',
    },
    {
      field: 'updateTime',
      title: '更新时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'creatorName',
      title: '创建人',
    },
    {
      field: 'auditStatus',
      title: '合同状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_AUDIT_STATUS },
      },
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 客户跟进列表的搜索表单 */
export function useCustomerFollowFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'followUpStatus',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: FOLLOWUP_STATUS,
      },
      defaultValue: false,
    },
  ];
}

/** 待进入公海客户列表的搜索表单 */
export function useCustomerPutPoolFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'sceneType',
      label: '归属',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: SCENE_TYPES,
      },
      defaultValue: 1,
    },
  ];
}

/** 今日需联系客户列表的搜索表单 */
export function useCustomerTodayContactFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'contactStatus',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: CONTACT_STATUS,
      },
      defaultValue: 1,
    },
    {
      fieldName: 'sceneType',
      label: '归属',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: SCENE_TYPES,
      },
      defaultValue: 1,
    },
  ];
}

/** 客户列表的字段 */
export function useCustomerColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '客户名称',
      slots: { default: 'name' },
    },
    {
      field: 'source',
      title: '客户来源',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_SOURCE },
      },
    },
    {
      field: 'mobile',
      title: '手机',
    },
    {
      field: 'telephone',
      title: '电话',
    },
    {
      field: 'email',
      title: '邮箱',
    },
    {
      field: 'level',
      title: '客户级别',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_LEVEL },
      },
    },
    {
      field: 'industryId',
      title: '客户行业',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_INDUSTRY },
      },
    },
    {
      field: 'contactNextTime',
      title: '下次联系时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'remark',
      title: '备注',
    },
    {
      field: 'lockStatus',
      title: '锁定状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'dealStatus',
      title: '成交状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'contactLastTime',
      title: '最后跟进时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'contactLastContent',
      title: '最后跟进记录',
    },
    {
      field: 'detailAddress',
      title: '地址',
    },
    {
      field: 'poolDay',
      title: '距离进入公海天数',
    },
    {
      field: 'ownerUserName',
      title: '负责人',
    },
    {
      field: 'ownerUserDeptName',
      title: '所属部门',
    },
    {
      field: 'updateTime',
      title: '更新时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'creatorName',
      title: '创建人',
    },
  ];
}

/** 回款审核列表的搜索表单 */
export function useReceivableAuditFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'auditStatus',
      label: '合同状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: AUDIT_STATUS,
      },
      defaultValue: 10,
    },
  ];
}

/** 回款审核列表的字段 */
export function useReceivableAuditColumns<T = CrmReceivableApi.Receivable>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'no',
      title: '回款编号',
      fixed: 'left',
      slots: { default: 'no' },
    },
    {
      field: 'customerName',
      title: '客户名称',
      slots: { default: 'customerName' },
    },
    {
      field: 'contractNo',
      title: '合同编号',
      slots: { default: 'contractNo' },
    },
    {
      field: 'returnTime',
      title: '回款日期',
      formatter: 'formatDateTime',
    },
    {
      field: 'price',
      title: '回款金额(元)',
      formatter: 'formatNumber',
    },
    {
      field: 'returnType',
      title: '回款方式',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE },
      },
    },
    {
      field: 'remark',
      title: '备注',
    },
    {
      field: 'contract.totalPrice',
      title: '合同金额（元）',
      formatter: 'formatNumber',
    },
    {
      field: 'ownerUserName',
      title: '负责人',
    },
    {
      field: 'ownerUserDeptName',
      title: '所属部门',
    },
    {
      field: 'updateTime',
      title: '更新时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'creatorName',
      title: '创建人',
    },
    {
      field: 'auditStatus',
      title: '回款状态',
      fixed: 'right',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_AUDIT_STATUS },
      },
    },
    {
      field: 'operation',
      title: '操作',
      width: 140,
      fixed: 'right',
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '角色',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'processDetail',
            text: '查看审批',
            show: hasAccessByCodes(['crm:receivable:update']),
          },
        ],
      },
    },
  ];
}

/** 回款计划提醒列表的搜索表单 */
export function useReceivablePlanRemindFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'remindType',
      label: '合同状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: RECEIVABLE_REMIND_TYPE,
      },
      defaultValue: 1,
    },
  ];
}

/** 回款计划提醒列表的字段 */
export function useReceivablePlanRemindColumns<T = CrmReceivableApi.Receivable>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'customerName',
      title: '客户名称',
      fixed: 'left',
      slots: { default: 'customerName' },
    },
    {
      field: 'contractNo',
      title: '合同编号',
    },
    {
      field: 'period',
      title: '期数',
      slots: { default: 'period' },
    },
    {
      field: 'price',
      title: '计划回款金额（元）',
      formatter: 'formatNumber',
    },
    {
      field: 'returnTime',
      title: '计划回款日期',
      formatter: 'formatDateTime',
    },
    {
      field: 'remindDays',
      title: '提前几天提醒',
    },
    {
      field: 'remindTime',
      title: '提醒日期',
      formatter: 'formatDateTime',
    },
    {
      field: 'returnType',
      title: '回款方式',
      fixed: 'right',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE },
      },
    },
    {
      field: 'remark',
      title: '备注',
    },
    {
      field: 'ownerUserName',
      title: '负责人',
    },
    {
      field: 'receivable.price',
      title: '实际回款金额（元）',
      formatter: 'formatNumber',
    },
    {
      field: 'receivable.returnTime',
      title: '实际回款日期',
      formatter: 'formatDateTime',
    },
    {
      field: 'updateTime',
      title: '更新时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'creatorName',
      title: '创建人',
    },
    {
      field: 'operation',
      title: '操作',
      width: 140,
      fixed: 'right',
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'customerName',
          nameTitle: '客户名称',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'receivableForm',
            text: '创建回款',
            show: hasAccessByCodes(['crm:receivable:create']),
          },
        ],
      },
    },
  ];
}
