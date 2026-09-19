import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { getSimpleUserList } from '#/api/system/user';
import { OA_DISCUSSION_TYPE } from '#/views/oa/utils/constants';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'type',
      label: '讨论类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_DISCUSSION_TYPE, 'number'),
        placeholder: '请选择讨论类型',
      },
      dependencies: {
        triggerFields: ['id'],
        componentProps: (values) => ({
          options: getDictOptions(DICT_TYPE.OA_DISCUSSION_TYPE, 'number'),
          placeholder: '请选择讨论类型',
          disabled: !!values.id,
        }),
      },
      rules: z.number().default(OA_DISCUSSION_TYPE.DISCUSSION),
    },
    {
      fieldName: 'title',
      label: '标题',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        showCount: true,
        placeholder: '请输入讨论标题',
      },
      formItemClass: 'col-span-3',
      rules: 'required',
    },
    {
      fieldName: 'content',
      label: '正文',
      component: 'RichTextarea',
      componentProps: {
        height: 280,
      },
      formItemClass: 'col-span-3',
    },
    {
      fieldName: 'fileUrls',
      label: '附件',
      component: 'FileUpload',
      componentProps: {
        maxNumber: 5,
        multiple: true,
      },
      formItemClass: 'col-span-3',
    },
    {
      fieldName: 'voteMultiple',
      label: '允许多选',
      component: 'Switch',
      dependencies: {
        triggerFields: ['id', 'type'],
        show: (values) => values.type === OA_DISCUSSION_TYPE.VOTE,
        componentProps: (values) => ({
          disabled: !!values.id,
        }),
      },
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'voteStartTime',
      label: '开始时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择投票开始时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
      dependencies: {
        triggerFields: ['id', 'type'],
        show: (values) => values.type === OA_DISCUSSION_TYPE.VOTE,
        componentProps: (values) => ({
          placeholder: '请选择投票开始时间',
          showTime: true,
          format: 'YYYY-MM-DD HH:mm:ss',
          valueFormat: 'x',
          disabled: !!values.id,
        }),
        rules: (values) =>
          values.type === OA_DISCUSSION_TYPE.VOTE ? 'required' : null,
      },
    },
    {
      fieldName: 'voteEndTime',
      label: '结束时间',
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择投票结束时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === OA_DISCUSSION_TYPE.VOTE,
        rules: (values) =>
          values.type === OA_DISCUSSION_TYPE.VOTE ? 'required' : null,
      },
    },
    {
      fieldName: 'voteOptions',
      label: '投票选项',
      component: 'Input',
      formItemClass: 'col-span-3',
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === OA_DISCUSSION_TYPE.VOTE,
      },
      // 选项编辑在插槽中维护，插槽名与 fieldName 一致
    },
    {
      fieldName: 'id',
      label: '编号',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
  ];
}

/** 列表的搜索表单，管理员可以按发布人筛选 */
export function useGridFormSchema(isSuperAdmin: boolean): VbenFormSchema[] {
  const schema: VbenFormSchema[] = [
    {
      fieldName: 'title',
      label: '标题',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入讨论标题',
      },
    },
    {
      fieldName: 'type',
      label: '讨论类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_DISCUSSION_TYPE, 'number'),
        allowClear: true,
        placeholder: '请选择讨论类型',
      },
    },
  ];
  if (isSuperAdmin) {
    schema.push({
      fieldName: 'userId',
      label: '发布人',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        labelField: 'nickname',
        valueField: 'id',
        allowClear: true,
        showSearch: true,
        placeholder: '请选择发布人',
      },
    });
  }
  return schema;
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'title',
      title: '标题',
      minWidth: 220,
      slots: { default: 'title' },
    },
    {
      field: 'type',
      title: '类型',
      width: 90,
      sortable: true,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_DISCUSSION_TYPE },
      },
    },
    {
      field: 'userName',
      title: '发布人',
      width: 120,
    },
    {
      field: 'visitCount',
      title: '浏览',
      width: 80,
      sortable: true,
    },
    {
      field: 'replyCount',
      title: '回复',
      width: 80,
    },
    {
      field: 'likeCount',
      title: '点赞',
      width: 80,
    },
    {
      field: 'fileUrls',
      title: '附件',
      width: 80,
      formatter: ({ row }) => row.fileUrls?.length || 0,
    },
    {
      field: 'createTime',
      title: '发布时间',
      width: 180,
      sortable: true,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
