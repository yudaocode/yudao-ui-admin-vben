import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { MallCommentApi } from '#/api/mall/product/comment';

import { getSpuSimpleList } from '#/api/mall/product/spu';
import { getRangePickerDefaultProps } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'spuId',
      label: '商品',
      component: 'ApiSelect',
      componentProps: {
        api: getSpuSimpleList,
        labelField: 'name',
        valueField: 'id',
      },
      rules: 'required',
    },
    {
      fieldName: 'userAvatar',
      label: '用户头像',
      component: 'ImageUpload',
      rules: 'required',
    },
    {
      fieldName: 'userNickname',
      label: '用户名称',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'content',
      label: '评论内容',
      component: 'Textarea',
      rules: 'required',
    },
    {
      fieldName: 'descriptionScores',
      label: '描述星级',
      component: 'Rate',
      rules: 'required',
    },
    {
      fieldName: 'benefitScores',
      label: '服务星级',
      component: 'Rate',
      rules: 'required',
    },
    {
      fieldName: 'picUrls',
      label: '评论图片',
      component: 'ImageUpload',
      componentProps: {
        maxNumber: 9,
      },
      rules: 'required',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'replyStatus',
      label: '回复状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '已回复', value: true },
          { label: '未回复', value: false },
        ],
      },
    },
    {
      fieldName: 'spuName',
      label: '商品名称',
      component: 'Input',
    },
    {
      fieldName: 'userNickname',
      label: '用户名称',
      component: 'Input',
    },
    {
      fieldName: 'orderId',
      label: '订单编号',
      component: 'Input',
    },
    {
      fieldName: 'createTime',
      label: '评论时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns<T = MallCommentApi.Comment>(
  onStatusChange?: (
    newStatus: boolean,
    row: T,
  ) => PromiseLike<boolean | undefined>,
): VxeGridPropTypes.Columns {
  return [
    {
      field: 'id',
      title: '评论编号',
      fixed: 'left',
    },
    {
      field: 'skuPicUrl',
      title: '商品图片',
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'spuName',
      title: '商品名称',
      minWidth: 200,
    },
    {
      field: 'skuProperties',
      title: '商品属性',
      minWidth: 200,
      formatter: ({ cellValue }) => {
        return cellValue && cellValue.length > 0
          ? cellValue
              .map((item: any) => `${item.propertyName} : ${item.valueName}`)
              .join('\n')
          : '-';
      },
    },
    {
      field: 'userNickname',
      title: '用户名称',
    },
    {
      field: 'descriptionScores',
      title: '商品评分',
    },
    {
      field: 'benefitScores',
      title: '服务评分',
    },
    {
      field: 'content',
      title: '评论内容',
    },
    {
      field: 'picUrls',
      title: '评论图片',
      cellRender: {
        name: 'CellImages',
      },
    },
    {
      field: 'replyContent',
      title: '回复内容',
    },
    {
      field: 'createTime',
      title: '评论时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'visible',
      title: '是否展示',
      align: 'center',
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: 'CellSwitch',
        props: {
          activeValue: true,
          inactiveValue: false,
        },
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
