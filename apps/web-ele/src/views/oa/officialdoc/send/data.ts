import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaOfficialDocSendApi } from '#/api/oa/officialdoc/send';
import type { DescriptionItemSchema } from '#/components/description';

import { h, markRaw } from 'vue';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDateTime, handleTree } from '@vben/utils';

import { ElTag } from 'element-plus';

import { getSimpleDeptList } from '#/api/system/dept';
import { DictTag } from '#/components/dict-tag';

import OaOfficialDocTemplateSelect from '../template/components/template-select.vue';

/** 部门 ApiTreeSelect 配置 */
function useDeptTreeSelectProps(multiple = false) {
  return {
    api: async () => handleTree(await getSimpleDeptList()),
    labelField: 'name',
    valueField: 'id',
    childrenField: 'children',
    multiple,
    placeholder: '请选择部门',
    clearable: true,
    defaultExpandAll: true,
    checkStrictly: true,
  };
}

/** 新增/修改的表单 */
export function useFormSchema(options: {
  onTemplateChange: (templateId?: number) => void;
}): VbenFormSchema[] {
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
      fieldName: 'templateId',
      label: '套红模板',
      component: markRaw(OaOfficialDocTemplateSelect),
      rules: 'required',
      componentProps: {
        onChange: options.onTemplateChange,
      },
    },
    {
      fieldName: 'title',
      label: '标题',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入标题',
      },
    },
    {
      fieldName: 'noPrefix',
      label: '字号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入字号',
      },
    },
    {
      fieldName: 'year',
      label: '年份',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        max: 9999,
        class: '!w-full',
        controlsPosition: 'right',
      },
    },
    {
      fieldName: 'sequence',
      label: '第几号文',
      component: 'InputNumber',
      componentProps: {
        min: 1,
        class: '!w-full',
        controlsPosition: 'right',
      },
    },
    {
      fieldName: 'secrecyLevel',
      label: '密级',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_OFFICIAL_DOC_SECRET_LEVEL, 'number'),
        placeholder: '请选择密级',
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
        placeholder: '请选择紧急程度',
      },
    },
    {
      fieldName: 'disclosureType',
      label: '公开类别',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.OA_OFFICIAL_DOC_PUBLIC_CATEGORY,
          'number',
        ),
        placeholder: '请选择公开类别',
      },
    },
    {
      fieldName: 'issueTime',
      label: '发文日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        type: 'datetime',
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择发文日期',
        class: '!w-full',
      },
    },
    {
      fieldName: 'sendDeptId',
      label: '发文部门',
      component: 'ApiTreeSelect',
      rules: 'required',
      componentProps: useDeptTreeSelectProps(),
    },
    {
      fieldName: 'mainDeptIds',
      label: '主送部门',
      component: 'ApiTreeSelect',
      rules: 'required',
      componentProps: useDeptTreeSelectProps(true),
    },
    {
      fieldName: 'copyDeptIds',
      label: '抄送部门',
      component: 'ApiTreeSelect',
      componentProps: useDeptTreeSelectProps(true),
    },
    {
      fieldName: 'signerName',
      label: '签发人',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'remark',
      label: '附注',
      component: 'Textarea',
      formItemClass: 'col-span-2',
      componentProps: {
        rows: 3,
        placeholder: '请输入附注',
      },
    },
    {
      fieldName: 'content',
      label: '公文内容',
      component: 'RichTextarea',
      formItemClass: 'col-span-2',
      componentProps: {
        height: 320,
      },
    },
    {
      fieldName: 'fileUrls',
      label: '附件',
      component: 'FileUpload',
      formItemClass: 'col-span-2',
      componentProps: {
        maxNumber: 10,
      },
    },
    {
      fieldName: 'formalFileUrl',
      label: '正式公文',
      component: 'FileUpload',
      formItemClass: 'col-span-2',
      componentProps: {
        maxNumber: 1,
        accept: ['pdf'],
        helpText: '支持上传 .pdf 格式的正式公文',
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
        clearable: true,
        placeholder: '请输入公文标题',
      },
    },
    {
      fieldName: 'documentNo',
      label: '发文字号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入发文字号',
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
        clearable: true,
        placeholder: '请选择流程状态',
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions<OaOfficialDocSendApi.OfficialDocSend>['columns'] {
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
      title: '发文字号',
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
      field: 'sendDeptName',
      title: '发文部门',
      minWidth: 120,
    },
    {
      field: 'mainDeptNames',
      title: '主送部门',
      minWidth: 120,
      formatter: ({ row }) => row.mainDeptNames?.join('、') ?? '',
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
      width: 220,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 公文发文详情的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'title',
      label: '公文标题',
    },
    {
      field: 'noPrefix',
      label: '字号',
    },
    {
      field: 'year',
      label: '年份',
    },
    {
      field: 'sequence',
      label: '第几号文',
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
      field: 'disclosureType',
      label: '公开类别',
      render: (value) =>
        h(DictTag, { type: DICT_TYPE.OA_OFFICIAL_DOC_PUBLIC_CATEGORY, value }),
    },
    {
      field: 'issueTime',
      label: '发文日期',
      render: (value) => (value ? formatDateTime(value) : ''),
    },
    {
      field: 'remark',
      label: '附注',
    },
    {
      field: 'no',
      label: '单据编号',
    },
    {
      field: 'documentNo',
      label: '公文文号',
    },
    {
      field: 'signerName',
      label: '签发人',
    },
    {
      field: 'sendDeptName',
      label: '发文部门',
    },
    {
      field: 'mainDeptNames',
      label: '主送部门',
      render: (value) => value?.join('、'),
    },
    {
      field: 'copyDeptNames',
      label: '抄送部门',
      render: (value) => value?.join('、'),
    },
    {
      field: 'status',
      label: '审批状态',
      render: (value) =>
        value === BpmProcessInstanceStatus.NOT_START
          ? h(ElTag, { type: 'info' }, () => '未提交')
          : h(DictTag, { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS, value }),
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
  ];
}
