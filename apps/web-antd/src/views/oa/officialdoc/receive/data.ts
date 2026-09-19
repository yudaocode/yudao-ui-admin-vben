import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaOfficialDocReceiveApi } from '#/api/oa/officialdoc/receive';
import type { DescriptionItemSchema } from '#/components/description';

import { h, markRaw } from 'vue';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate, formatDateTime, handleTree } from '@vben/utils';

import { Tag } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { getSimpleDeptList } from '#/api/system/dept';
import { DictTag } from '#/components/dict-tag';
import { UserSelect } from '#/views/system/user/components';

/** 收文部门 ApiTreeSelect 配置 */
function useDeptTreeSelectProps() {
  return {
    api: async () => handleTree(await getSimpleDeptList()),
    labelField: 'name',
    valueField: 'id',
    childrenField: 'children',
    placeholder: '请选择收文部门',
    allowClear: true,
    treeDefaultExpandAll: true,
  };
}

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
      fieldName: 'sendId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'receiveType',
      label: '收文类型',
      component: 'Select',
      rules: z.number().default(0),
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_OFFICIAL_DOC_RECEIVE_TYPE, 'number'),
        placeholder: '请选择收文类型',
        disabled: true,
      },
    },
    {
      fieldName: 'sendDeptName',
      label: '发文单位',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      dependencies: {
        triggerFields: ['sendId'],
        show: (values) => !!values.sendId,
      },
    },
    {
      fieldName: 'issueTimeText',
      label: '发文日期',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      dependencies: {
        triggerFields: ['sendId'],
        show: (values) => !!values.sendId,
      },
    },
    {
      fieldName: 'signerName',
      label: '签发人',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      dependencies: {
        triggerFields: ['sendId'],
        show: (values) => !!values.sendId,
      },
    },
    {
      fieldName: 'disclosureType',
      label: '公开类别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.OA_OFFICIAL_DOC_PUBLIC_CATEGORY,
          'number',
        ),
        disabled: true,
      },
      dependencies: {
        triggerFields: ['sendId'],
        show: (values) => !!values.sendId,
      },
    },
    {
      fieldName: 'documentNo',
      label: '来文字号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入来文字号',
      },
    },
    {
      fieldName: 'title',
      label: '公文标题',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入公文标题',
      },
    },
    {
      fieldName: 'secrecyLevel',
      label: '密级',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_OFFICIAL_DOC_SECRET_LEVEL, 'number'),
      },
    },
    {
      fieldName: 'urgencyLevel',
      label: '紧急程度',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.OA_OFFICIAL_DOC_URGENCY_LEVEL,
          'number',
        ),
      },
    },
    {
      fieldName: 'receiveTime',
      label: '收文日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择收文日期',
        class: 'w-full',
      },
    },
    {
      fieldName: 'receiveDeptId',
      label: '收文部门',
      component: 'ApiTreeSelect',
      rules: 'required',
      dependencies: {
        triggerFields: ['sendId'],
        componentProps: (values) => ({
          ...useDeptTreeSelectProps(),
          disabled: !values.sendId,
        }),
      },
    },
    {
      fieldName: 'handlerUserId',
      label: '主办人',
      component: markRaw(UserSelect),
      modelPropName: 'modelValue',
      componentProps: {
        placeholder: '请选择主办人',
      },
    },
    {
      fieldName: 'instruction',
      label: '领导批示',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        rows: 3,
        placeholder: '请输入领导批示',
      },
    },
    {
      fieldName: 'result',
      label: '办理结果',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        rows: 3,
        placeholder: '请输入办理结果',
      },
    },
    {
      fieldName: 'deadlineTime',
      label: '办理期限',
      component: 'DatePicker',
      componentProps: {
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择办理期限',
        class: 'w-full',
      },
    },
    {
      fieldName: 'summary',
      label: '内容摘要',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        rows: 3,
        placeholder: '请输入内容摘要',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        rows: 3,
        placeholder: '请输入备注',
      },
    },
    {
      fieldName: 'fileUrls',
      label: '附件',
      component: 'FileUpload',
      formItemClass: 'col-span-2',
      dependencies: {
        triggerFields: ['sendId'],
        componentProps: (values) => ({
          maxNumber: 10,
          disabled: !!values.sendId,
        }),
      },
    },
    {
      fieldName: 'formalFileUrl',
      label: '正式公文',
      component: 'FileUpload',
      formItemClass: 'col-span-2',
      dependencies: {
        triggerFields: ['sendId'],
        componentProps: (values) => ({
          maxNumber: 1,
          disabled: !!values.sendId,
        }),
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'title',
      label: '公文标题',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入公文标题',
      },
    },
    {
      fieldName: 'documentNo',
      label: '来文字号',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入来文字号',
      },
    },
    {
      fieldName: 'status',
      label: '流程状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '未提交', value: BpmProcessInstanceStatus.NOT_START },
          ...getDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, 'number'),
        ],
        allowClear: true,
        placeholder: '请选择流程状态',
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions<OaOfficialDocReceiveApi.OfficialDocReceive>['columns'] {
  return [
    {
      field: 'no',
      title: '单据编号',
      minWidth: 190,
      slots: { default: 'no' },
    },
    {
      field: 'title',
      title: '公文标题',
      minWidth: 190,
    },
    {
      field: 'documentNo',
      title: '来文字号',
      minWidth: 190,
    },
    {
      field: 'secrecyLevel',
      title: '密级',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_OFFICIAL_DOC_SECRET_LEVEL },
      },
    },
    {
      field: 'urgencyLevel',
      title: '紧急程度',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_OFFICIAL_DOC_URGENCY_LEVEL },
      },
    },
    {
      field: 'receiveType',
      title: '收文类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_OFFICIAL_DOC_RECEIVE_TYPE },
      },
    },
    {
      field: 'receiveDeptName',
      title: '收文部门',
      minWidth: 120,
    },
    {
      field: 'handlerName',
      title: '主办人',
      minWidth: 120,
    },
    {
      field: 'handleStatus',
      title: '办理状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_OFFICIAL_DOC_HANDLE_STATUS },
      },
    },
    {
      field: 'status',
      title: '流程状态',
      minWidth: 120,
      slots: { default: 'statusTag' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 190,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 260,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 公文收文详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'receiveType',
      label: '收文类型',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_OFFICIAL_DOC_RECEIVE_TYPE, value }),
    },
    {
      field: 'receiveTime',
      label: '收文时间',
      render: (value) => (value ? formatDateTime(value) : ''),
    },
    {
      field: 'sendDeptName',
      label: '发文单位',
      show: (data) => !!data?.sendId,
    },
    {
      field: 'issueTime',
      label: '发文日期',
      show: (data) => !!data?.sendId,
      render: (value) => (value ? formatDate(value, 'YYYY-MM-DD') : ''),
    },
    {
      field: 'signerName',
      label: '签发人',
      show: (data) => !!data?.sendId,
    },
    {
      field: 'disclosureType',
      label: '公开类别',
      show: (data) => !!data?.sendId,
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_OFFICIAL_DOC_PUBLIC_CATEGORY, value }),
    },
    {
      field: 'instruction',
      label: '领导批示',
    },
    {
      field: 'result',
      label: '办理结果',
    },
    {
      field: 'deadlineTime',
      label: '办理期限',
      render: (value) => (value ? formatDateTime(value) : ''),
    },
    {
      field: 'summary',
      label: '内容摘要',
    },
    {
      field: 'remark',
      label: '备注',
    },
    {
      field: 'no',
      label: '单据编号',
    },
    {
      field: 'title',
      label: '公文标题',
    },
    {
      field: 'documentNo',
      label: '来文字号',
    },
    {
      field: 'secrecyLevel',
      label: '密级',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_OFFICIAL_DOC_SECRET_LEVEL, value }),
    },
    {
      field: 'urgencyLevel',
      label: '紧急程度',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_OFFICIAL_DOC_URGENCY_LEVEL, value }),
    },
    {
      field: 'receiveDeptName',
      label: '收文部门',
    },
    {
      field: 'handlerName',
      label: '主办人',
    },
    {
      field: 'status',
      label: '审批状态',
      render: (value) =>
        value === BpmProcessInstanceStatus.NOT_START
          ? h(Tag, () => '未提交')
          : h(DictTag, { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, value }),
    },
    {
      field: 'handleStatus',
      label: '办理状态',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_OFFICIAL_DOC_HANDLE_STATUS, value }),
    },
    {
      field: 'createTime',
      label: '创建时间',
      render: (value) => (value ? formatDateTime(value) : ''),
    },
    {
      field: 'fileUrls',
      label: '附件',
      slot: 'fileUrls',
      span: 2,
    },
    {
      field: 'formalFileUrl',
      label: '正式公文',
      slot: 'formalFileUrl',
      span: 2,
    },
    {
      field: 'sendId',
      label: '关联发文',
      slot: 'sendDoc',
      span: 2,
      show: (data) => !!data?.sendId,
    },
  ];
}
