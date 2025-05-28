import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CrmClueApi } from '#/api/crm/clue';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { useAccess } from '@vben/access';
import { formatDateTime } from '@vben/utils';

import { getAreaTree } from '#/api/system/area';
import { DictTag } from '#/components/dict-tag';
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
      fieldName: 'name',
      label: '线索名称',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'source',
      label: '客户来源',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_CUSTOMER_SOURCE),
      },
      rules: 'required',
    },
    {
      fieldName: 'mobile',
      label: '手机',
      component: 'Input',
    },
    {
      fieldName: 'ownerUserId',
      label: '负责人',
      component: 'Select',
      componentProps: {
        api: 'getSimpleUserList',
      },
      rules: 'required',
    },
    {
      fieldName: 'telephone',
      label: '电话',
      component: 'Input',
    },
    {
      fieldName: 'email',
      label: '邮箱',
      component: 'Input',
    },
    {
      fieldName: 'wechat',
      label: '微信',
      component: 'Input',
    },
    {
      fieldName: 'qq',
      label: 'QQ',
      component: 'Input',
    },
    {
      fieldName: 'industryId',
      label: '客户行业',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_CUSTOMER_INDUSTRY),
      },
    },
    {
      fieldName: 'level',
      label: '客户级别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_CUSTOMER_LEVEL),
      },
    },
    {
      fieldName: 'areaId',
      label: '地址',
      component: 'ApiTreeSelect',
      componentProps: {
        api: () => getAreaTree(),
        fieldNames: { label: 'name', value: 'id', children: 'children' },
      },
    },
    {
      fieldName: 'detailAddress',
      label: '详细地址',
      component: 'Input',
    },
    {
      fieldName: 'contactNextTime',
      label: '下次联系时间',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '线索名称',
      component: 'Input',
    },
    {
      fieldName: 'transformStatus',
      label: '转化状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '未转化', value: false },
          { label: '已转化', value: true },
        ],
      },
    },
    {
      fieldName: 'mobile',
      label: '手机号',
      component: 'Input',
    },
    {
      fieldName: 'telephone',
      label: '电话',
      component: 'Input',
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
export function useGridColumns<T = CrmClueApi.Clue>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'name',
      title: '线索名称',
      minWidth: 160,
      fixed: 'left',
      slots: {
        default: 'name',
      },
    },
    {
      field: 'source',
      title: '线索来源',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_SOURCE },
      },
    },
    {
      field: 'mobile',
      title: '手机',
      minWidth: 120,
    },
    {
      field: 'telephone',
      title: '电话',
      minWidth: 130,
    },
    {
      field: 'email',
      title: '邮箱',
      minWidth: 180,
    },
    {
      field: 'detailAddress',
      title: '地址',
      minWidth: 180,
    },
    {
      field: 'industryId',
      title: '客户行业',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_INDUSTRY },
      },
    },
    {
      field: 'level',
      title: '客户级别',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_CUSTOMER_LEVEL },
      },
    },
    {
      field: 'ownerUserName',
      title: '负责人',
      minWidth: 100,
    },
    {
      field: 'ownerUserDeptName',
      title: '所属部门',
      minWidth: 100,
    },
    {
      field: 'contactNextTime',
      title: '下次联系时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'contactLastTime',
      title: '最后跟进时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'updateTime',
      title: '更新时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'creatorName',
      title: '创建人',
      minWidth: 100,
    },
    {
      field: 'operation',
      title: '操作',
      width: 130,
      fixed: 'right',
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '线索',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: hasAccessByCodes(['crm:clue:update']),
          },
          {
            code: 'delete',
            show: hasAccessByCodes(['crm:clue:delete']),
          },
        ],
      },
    },
  ];
}

/** 详情头部的配置 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'source',
      label: '线索来源',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.CRM_CUSTOMER_SOURCE,
          value: data?.source,
        }),
    },
    {
      field: 'mobile',
      label: '手机',
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

/** 详情基本信息的配置 */
export function useDetailBaseSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'name',
      label: '线索名称',
    },
    {
      field: 'source',
      label: '客户来源',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.CRM_CUSTOMER_SOURCE,
          value: data?.source,
        }),
    },
    {
      field: 'mobile',
      label: '手机',
    },
    {
      field: 'ownerUserName',
      label: '负责人',
    },
    {
      field: 'telephone',
      label: '电话',
    },
    {
      field: 'email',
      label: '邮箱',
    },
    {
      field: 'wechat',
      label: '微信',
    },
    {
      field: 'qq',
      label: 'QQ',
    },
    {
      field: 'industryId',
      label: '客户行业',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.CRM_CUSTOMER_INDUSTRY,
          value: data?.industryId,
        }),
    },
    {
      field: 'level',
      label: '客户级别',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.CRM_CUSTOMER_LEVEL,
          value: data?.level,
        }),
    },
    {
      field: 'areaId',
      label: '地址',
    },
    {
      field: 'detailAddress',
      label: '详细地址',
    },
    {
      field: 'contactNextTime',
      label: '下次联系时间',
      content: (data) => formatDateTime(data?.contactNextTime) as string,
    },
    {
      field: 'remark',
      label: '备注',
    },
  ];
}

/** 详情系统信息的配置 */
export function useDetailSystemSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'ownerUserName',
      label: '负责人',
    },
    {
      field: 'contactLastContent',
      label: '最后跟进记录',
    },
    {
      field: 'contactLastContent',
      label: '最后跟进时间',
      content: (data) => formatDateTime(data?.contactLastContent) as string,
    },
    {
      field: 'creatorName',
      label: '创建人',
    },
    {
      field: 'createTime',
      label: '创建时间',
      content: (data) => formatDateTime(data?.createTime) as string,
    },
    {
      field: 'updateTime',
      label: '更新时间',
      content: (data) => formatDateTime(data?.updateTime) as string,
    },
  ];
}
