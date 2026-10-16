import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getSimpleUserList } from '#/api/system/user';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
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
    {
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
    },
  ];
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
  ];
}
