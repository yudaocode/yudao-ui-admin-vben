import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallDeliveryPickUpStoreApi } from '#/api/mall/trade/delivery/pickUpStore';

import { ref } from 'vue';

import { getSimpleDeliveryExpressList } from '#/api/mall/trade/delivery/express';
import { getSimpleDeliveryPickUpStoreList } from '#/api/mall/trade/delivery/pickUpStore';
import {
  DeliveryTypeEnum,
  DICT_TYPE,
  getDictOptions,
  getRangePickerDefaultProps,
} from '#/utils';

const pickUpStoreList = ref<MallDeliveryPickUpStoreApi.PickUpStore[]>([]);

getSimpleDeliveryPickUpStoreList().then((res) => {
  pickUpStoreList.value = res;
});

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'status',
      label: '订单状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.TRADE_ORDER_STATUS, 'number'),
      },
    },
    {
      fieldName: 'payChannelCode',
      label: '支付方式',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.PAY_CHANNEL_CODE, 'number'),
      },
    },
    {
      fieldName: 'name',
      label: '品牌名称',
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
    {
      fieldName: 'terminal',
      label: '订单来源',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.TERMINAL, 'number'),
      },
    },
    {
      fieldName: 'deliveryType',
      label: '配送方式',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.TRADE_DELIVERY_TYPE, 'number'),
      },
    },
    {
      fieldName: 'logisticsId',
      label: '快递公司',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleDeliveryExpressList,
        labelField: 'name',
        valueField: 'id',
      },
      dependencies: {
        triggerFields: ['deliveryType'],
        show: (values) => values.deliveryType === DeliveryTypeEnum.EXPRESS.type,
      },
    },
    {
      fieldName: 'pickUpStoreId',
      label: '自提门店',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleDeliveryPickUpStoreList,
        labelField: 'name',
        valueField: 'id',
      },
      dependencies: {
        triggerFields: ['deliveryType'],
        show: (values) => values.deliveryType === DeliveryTypeEnum.PICK_UP.type,
      },
    },
    {
      fieldName: 'pickUpVerifyCode',
      label: '核销码',
      component: 'Input',
      dependencies: {
        triggerFields: ['deliveryType'],
        show: (values) => values.deliveryType === DeliveryTypeEnum.PICK_UP.type,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'expand',
      width: 80,
      slots: { content: 'expand_content' },
      fixed: 'left',
    },
    {
      field: 'no',
      title: '订单号',
      fixed: 'left',
      minWidth: 180,
    },
    {
      field: 'createTime',
      title: '下单时间',
      formatter: 'formatDateTime',
      minWidth: 160,
    },
    {
      field: 'terminal',
      title: '订单来源',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.TERMINAL },
      },
      minWidth: 120,
    },
    {
      field: 'payChannelCode',
      title: '支付方式',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PAY_CHANNEL_CODE },
      },
      minWidth: 120,
    },
    {
      field: 'payTime',
      title: '支付时间',
      formatter: 'formatDateTime',
      minWidth: 160,
    },
    {
      field: 'type',
      title: '订单类型',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.TRADE_ORDER_TYPE },
      },
      minWidth: 80,
    },

    {
      field: 'payPrice',
      title: '实际支付',
      formatter: 'formatFenToYuanAmount',
      minWidth: 180,
    },
    {
      field: 'user',
      title: '买家/收货人',
      formatter: ({ row }) => {
        if (row.deliveryType === DeliveryTypeEnum.EXPRESS.type) {
          return `买家：${row.user?.nickname} / 收货人： ${row.receiverName} ${row.receiverMobile}${row.receiverAreaName}${row.receiverDetailAddress}`;
        }
        if (row.deliveryType === DeliveryTypeEnum.PICK_UP.type) {
          return `门店名称：${pickUpStoreList.value.find((item) => item.id === row.pickUpStoreId)?.name} /
                  门店手机：${pickUpStoreList.value.find((item) => item.id === row.pickUpStoreId)?.phone} /
                  自提门店：${pickUpStoreList.value.find((item) => item.id === row.pickUpStoreId)?.detailAddress}
                  `;
        }
        return '';
      },
      minWidth: 180,
    },
    {
      field: 'deliveryType',
      title: '配送方式',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.TRADE_DELIVERY_TYPE },
      },
      minWidth: 80,
    },
    {
      field: 'status',
      title: '订单状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.TRADE_ORDER_STATUS },
      },
      minWidth: 80,
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
