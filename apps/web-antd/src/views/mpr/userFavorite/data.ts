import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { UserFavoriteApi } from '#/api/mpr/userFavorite';

import { GoodsApi } from '#/api/mpr/goods';
import { getRangePickerDefaultProps } from '#/utils';

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
      fieldName: 'userId',
      label: '用户ID',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户ID',
      },
    },
    {
      fieldName: 'goodsId',
      label: '商品ID',
      component: 'Input',
      componentProps: {
        placeholder: '请输入商品ID',
      },
    },
    {
      fieldName: 'category',
      label: '自定义分类',
      component: 'Input',
      componentProps: {
        placeholder: '请输入自定义分类',
      },
    },
    {
      fieldName: 'tags',
      label: '标签',
      component: 'Input',
      componentProps: {
        placeholder: '请输入标签',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Input',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户ID',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入用户ID',
      },
    },
    {
      fieldName: 'goodsId',
      label: '商品ID',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入商品ID',
      },
    },
    {
      fieldName: 'category',
      label: '自定义分类',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入自定义分类',
      },
    },
    {
      fieldName: 'tags',
      label: '标签',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入标签',
      },
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
export function useGridColumns(): VxeTableGridOptions<UserFavoriteApi.UserFavorite>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: 'ID',
      minWidth: 120,
      visible: false,
    },
    {
      type: null,
      field: 'goods?.details.thumbnail',
      title: '封面图',
      minWidth: 100,
      cellRender: {
        name: 'CellImagePro',
        props: {
          width: 80,
          height: 80,
          src: (row: any) => row.goods?.details.thumbnail,
        },
      },
    },
    {
      field: 'goods?.details.images',
      title: '商品图片',
      minWidth: 100,
      // showOverflow: false,
      visible: false,
      cellRender: {
        name: 'CellImagesPro',
        props: {
          src: (row: any) => row.goods?.details.images,
          width: 80,
          height: 80,
        },
      },
    },
    {
      field: 'goods?.title',
      title: '标题',
      headerAlign: 'center',
      align: 'left',
      minWidth: 180,
      cellRender: {
        name: 'CellLink',
        props: {
          target: '_blank',
          href: (row: any) => GoodsApi.FB_MP_GOODS_URL + row.goodsId,
          text: (row: any) => row.goods?.title,
        },
      },
    },
    {
      field: 'goodsId',
      title: '商品ID',
      minWidth: 120,
      cellRender: {
        name: 'CellLink',
        props: {
          target: '_blank',
          href: (row: any) => GoodsApi.FB_MP_GOODS_URL + row.goodsId,
          text: (row: any) => row.goodsId,
        },
      },
      visible: false,
    },
    {
      field: 'category',
      title: '自定义分类',
      minWidth: 120,
    },
    {
      field: 'tags',
      title: '标签',
      minWidth: 120,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '收藏时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      field: 'goods.details.createTime',
      title: '发布时间',
      minWidth: 155,
      formatter: 'formatDateTime',
      sortable: true,
    },
    {
      field: 'goods.details.pricing.formattedAmount',
      title: '价格',
      minWidth: 120,
    },
    {
      field: 'goods.details.description',
      title: '详情',
      minWidth: 220,
    },
    {
      field: 'goods.details.seller.sellerName',
      title: '卖家',
      minWidth: 180,
      align: 'left',
      headerAlign: 'center',
      slots: {
        default: 'seller_default',
      },
    },
    {
      field: 'goods.details.location.locationDisplayName',
      title: '位置',
      minWidth: 120,
    },
    {
      field: 'goods.details.status',
      title: '商品状态',
      minWidth: 120,
      slots: {
        default: 'goods_status_default',
      },
    },
    {
      field: 'userId',
      title: '用户ID',
      minWidth: 120,
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
