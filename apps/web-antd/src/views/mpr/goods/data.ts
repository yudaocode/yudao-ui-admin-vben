import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { formatDateTime } from '@vben/utils';

import { Tag } from 'ant-design-vue';

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
      fieldName: 'goodsId',
      label: 'fb商品ID',
      component: 'Input',
      componentProps: {
        placeholder: '请输入fb商品ID',
      },
    },
    {
      fieldName: 'title',
      label: '标题',
      component: 'Input',
      componentProps: {
        placeholder: '请输入标题',
      },
    },
    {
      fieldName: 'aiCategory',
      label: 'AI标记的分类',
      component: 'Input',
      componentProps: {
        placeholder: '请输入AI标记的分类',
      },
    },
    {
      fieldName: 'details',
      label: '详情',
      component: 'Input',
      componentProps: {
        placeholder: '请输入详情',
      },
    },
    {
      fieldName: 'processingStatus',
      label: '处理状态',
      component: 'RadioGroup',
      componentProps: {
        options: [],
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
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
      fieldName: 'title',
      label: '标题',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入标题',
      },
    },
    {
      fieldName: 'createTime',
      label: '发布时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'location',
      label: '位置',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入位置',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<GoodsApi.Goods>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: 'ID',
      minWidth: 120,
      visible: false,
    },
    {
      field: 'goodsId',
      title: 'fb商品ID',
      minWidth: 120,
      visible: false,
    },
    {
      type: null,
      field: 'details.thumbnail',
      title: '封面图',
      minWidth: 100,
      cellRender: {
        name: 'CellImagePro',
        props: {
          width: 80,
          height: 80,
          src: (row: any) => row.details.thumbnail,
        },
      },
    },
    {
      field: 'details.images',
      title: '商品图片',
      minWidth: 100,
      // showOverflow: false,
      visible: false,
      cellRender: {
        name: 'CellImagesPro',
        props: {
          src: (row: any) => row.details.images,
          width: 80,
          height: 80,
        },
      },
    },
    {
      field: 'title',
      title: '标题',
      headerAlign: 'center',
      align: 'left',
      minWidth: 180,
    },
    {
      field: 'details.createTime',
      title: '发布时间',
      minWidth: 155,
      formatter: 'formatDateTime',
      sortable: true,
    },
    {
      field: 'details.pricing.formattedAmount',
      title: '价格',
      minWidth: 120,
    },
    {
      field: 'details.description',
      title: '详情',
      minWidth: 220,
    },
    {
      field: 'details.seller.sellerName',
      title: '卖家',
      minWidth: 180,
      align: 'left',
      headerAlign: 'center',
      slots: {
        default: 'seller_default',
      },
    },
    {
      field: 'details.location.locationDisplayName',
      title: '位置',
      minWidth: 120,
    },
    {
      field: 'details.status',
      title: '商品状态',
      minWidth: 120,
      slots: {
        default: 'goods_status_default',
      },
    },
    {
      field: 'op',
      title: '操作',
      width: 210,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/**
 * 详情页字段
 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'id',
      label: 'ID',
      hidden: true,
    },
    {
      field: 'goodsId',
      label: '商品ID',
      content: (data) =>
        h(
          'a',
          {
            class: 'text-blue-500',
            href: GoodsApi.FB_MP_GOODS_URL + data.goodsId,
            target: '_blank',
          },
          data?.goodsId,
        ),
    },
    {
      field: 'title',
      label: '标题',
      headerAlign: 'center',
      align: 'left',
    },
    {
      field: 'details.createTime',
      label: '发布时间',
      content: (data) => formatDateTime(data?.details?.createTime),
    },
    {
      field: 'details.pricing.formattedAmount',
      label: '价格',
      content: (data) => data?.details?.pricing?.formattedAmount,
    },
    {
      field: 'priceReference',
      label: '参考价格',
    },
    {
      field: 'details.pricing.formattedAmount',
      label: '新品价格',
      content: (data) =>
        h(
          'a',
          {
            class: 'text-blue-500',
            href: `https://www.google.com/search?q=${data.title}`,
            target: '_blank',
          },
          '去查看',
        ),
    },
    {
      field: 'details.description',
      label: '详情',
      content: (data) => data?.details?.description,
    },
    {
      field: 'details.seller.sellerName',
      label: '卖家',
      content: (data) => data?.details?.seller.sellerName,
      slots: {
        default: 'seller_default',
      },
    },
    {
      field: 'details.location.locationDisplayName',
      label: '位置',
      content: (data) => data?.details?.location?.locationDisplayName,
    },
    {
      field: 'details.status',
      label: '商品状态',
      content: (data) => {
        if (data?.details?.status?.isLive) {
          return h(Tag, {}, () => '在售');
        } else if (data?.details?.status?.isSold) {
          return h(Tag, {}, () => '已售');
        } else if (data?.details?.status?.isHidden) {
          return h(Tag, {}, () => '下架');
        } else {
          return '';
        }
      },
    },
  ];
}
