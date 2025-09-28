import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { Ref } from 'vue';
import type { CrmBusinessApi } from '#/api/crm/business';
import type { DescriptionItemSchema } from '#/components/description';

import { erpPriceInputFormatter, formatDateTime } from '@vben/utils';

import { DEFAULT_STATUSES, getBusinessStatusSimpleList } from '#/api/crm/business/status';

/** 详情页的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'customerName',
      label: '客户名称',
    },
    {
      field: 'totalPrice',
      label: '商机金额（元）',
      content: (data) => erpPriceInputFormatter(data.totalPrice),
    },
    {
      field: 'statusTypeName',
      label: '商机组',
    },
    {
      field: 'ownerUserName',
      label: '负责人',
    },
    {
      field: 'createTime',
      label: '创建时间',
      content: (data) => formatDateTime(data?.createTime) as string,
    },
  ];
}

/** 详情页的基础字段 */
export function useDetailBaseSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'name',
      label: '商机名称',
    },
    {
      field: 'customerName',
      label: '客户名称',
    },
    {
      field: 'totalPrice',
      label: '商机金额（元）',
      content: (data) => erpPriceInputFormatter(data.totalPrice),
    },
    {
      field: 'dealTime',
      label: '预计成交日期',
      content: (data) => formatDateTime(data?.dealTime) as string,
    },
    {
      field: 'contactNextTime',
      label: '下次联系时间',
      content: (data) => formatDateTime(data?.contactNextTime) as string,
    },
    {
      field: 'statusTypeName',
      label: '商机状态组',
    },
    {
      field: 'statusName',
      label: '商机阶段',
    },
    {
      field: 'remark',
      label: '备注',
    },
  ];
}

/** 商机状态更新表单 */
export function useStatusFormSchema(
  formData: Ref<CrmBusinessApi.Business | undefined>,
): VbenFormSchema[] {
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
      fieldName: 'statusId',
      label: '商机状态',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'endStatus',
      label: '商机状态',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'status',
      label: '商机阶段',
      component: 'Select',
      dependencies: {
        triggerFields: [''],
        async componentProps() {
          const statusList = await getBusinessStatusSimpleList(
            formData.value?.statusTypeId ?? 0,
          );
          const statusOptions = statusList.map((item) => ({
            label: `${item.name}(赢单率：${item.percent}%)`,
            value: item.id,
          }));
          const options = DEFAULT_STATUSES.map((item) => ({
            label: `${item.name}(赢单率：${item.percent}%)`,
            value: item.endStatus,
          }));
          statusOptions.push(...options);
          return {
            options: statusOptions,
          };
        },
      },
      rules: 'required',
    },
  ];
}

/** 详情列表的字段 */
// TODO @AI：放在 components 的 data.ts 下，更合适
export function useDetailListColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'checkbox',
      width: 50,
      fixed: 'left',
    },
    {
      field: 'name',
      title: '商机名称',
      fixed: 'left',
      slots: { default: 'name' },
    },
    {
      field: 'customerName',
      title: '客户名称',
      fixed: 'left',
      slots: { default: 'customerName' },
    },
    {
      field: 'totalPrice',
      title: '商机金额（元）',
      formatter: 'formatAmount2',
    },
    {
      field: 'dealTime',
      title: '预计成交日期',
      formatter: 'formatDate',
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
      field: 'statusTypeName',
      title: '商机状态组',
      fixed: 'right',
    },
    {
      field: 'statusName',
      title: '商机阶段',
      fixed: 'right',
    },
  ];
}
