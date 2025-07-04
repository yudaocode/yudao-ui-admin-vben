import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { h } from 'vue';

import { ElTag } from 'element-plus';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'nickname',
      label: '用户',
      component: 'Input',
    },
    {
      fieldName: 'bizType',
      label: '业务类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MEMBER_POINT_BIZ_TYPE, 'number'),
      },
    },
    {
      fieldName: 'title',
      label: '积分标题',
      component: 'Input',
    },
    {
      fieldName: 'createDate',
      label: '获得时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
    },
    {
      field: 'createTime',
      title: '获得时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'nickname',
      title: '用户',
    },
    {
      field: 'point',
      title: '获得积分',
      slots: {
        default: ({ row }) => {
          return h(
            ElTag,
            {
              class: 'mr-1',
              color: row.point > 0 ? 'blue' : 'red',
            },
            () => (row.point > 0 ? `+${row.point}` : row.point),
          );
        },
      },
    },
    {
      field: 'totalPoint',
      title: '总积分',
    },
    {
      field: 'title',
      title: '标题',
    },
    {
      field: 'description',
      title: '描述',
    },
    {
      field: 'bizId',
      title: '业务编码',
    },
    {
      field: 'bizType',
      title: '业务类型',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MEMBER_POINT_BIZ_TYPE },
      },
    },
  ];
}
