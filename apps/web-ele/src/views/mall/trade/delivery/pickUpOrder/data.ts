import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { MallDeliveryPickUpStoreApi } from '#/api/mall/trade/delivery/pickUpStore';

import { ref } from 'vue';

import { getSimpleDeliveryPickUpStoreList } from '#/api/mall/trade/delivery/pickUpStore';
import {
  DeliveryTypeEnum,
  DICT_TYPE,
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
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
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
        trigger: (values) =>
          values.deliveryType === DeliveryTypeEnum.PICK_UP.type,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeGridPropTypes.Columns {
  return [
    {
      field: 'no',
      title: '订单号',
      fixed: 'left',
      minWidth: 180,
    },
    {
      field: 'user.nickname',
      title: '用户信息',
      minWidth: 100,
    },
    {
      field: 'brokerageUser.nickname',
      title: '推荐人信息',
      minWidth: 100,
    },
    {
      field: 'spuName',
      title: '商品信息',
      minWidth: 100,
      formatter: ({ row }) => {
        if (row.items.length > 1) {
          return row.items.map((item: any) => item.spuName).join(',');
        }
      },
    },
    {
      field: 'payPrice',
      title: '实付金额(元)',
      formatter: 'formatFenToYuanAmount',
      minWidth: 180,
    },
    {
      field: 'storeStaffName',
      title: '核销员',
      minWidth: 160,
    },
    {
      field: 'pickUpStoreId',
      title: '核销门店',
      minWidth: 160,
      formatter: ({ row }) => {
        return pickUpStoreList.value.find(
          (item) => item.id === row.pickUpStoreId,
        )?.name;
      },
    },
    {
      field: 'payStatus',
      title: '支付状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
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
      field: 'createTime',
      title: '下单时间',
      formatter: 'formatDateTime',
      minWidth: 160,
    },
  ];
}
