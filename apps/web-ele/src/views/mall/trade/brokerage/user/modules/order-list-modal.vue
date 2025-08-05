<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallBrokerageRecordApi } from '#/api/mall/trade/brokerage/record';
import type { MallBrokerageUserApi } from '#/api/mall/trade/brokerage/user';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { fenToYuan } from '@vben/utils';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBrokerageRecordPage } from '#/api/mall/trade/brokerage/record';
import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';
import { BrokerageRecordBizTypeEnum } from '#/utils/constants';

/** 推广订单列表 */
defineOptions({ name: 'BrokerageOrderListModal' });

const userId = ref<number>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      userId.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<MallBrokerageUserApi.BrokerageUser>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      userId.value = data.id;
      // 等待弹窗打开后再查询
      setTimeout(() => {
        gridApi.query();
      }, 100);
    } finally {
      modalApi.unlock();
    }
  },
});

/** 搜索表单配置 */
function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'sourceUserLevel',
      label: '用户类型',
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '全部', value: 0 },
          { label: '一级推广人', value: 1 },
          { label: '二级推广人', value: 2 },
        ],
        buttonStyle: 'solid',
        optionType: 'button',
      },
      defaultValue: 0,
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        placeholder: '请选择状态',
        clearable: true,
        options: getDictOptions(DICT_TYPE.BROKERAGE_RECORD_STATUS, 'number'),
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 表格列配置 */
function useColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'bizId',
      title: '订单编号',
      minWidth: 80,
    },
    {
      field: 'sourceUserId',
      title: '用户编号',
      minWidth: 80,
    },
    {
      field: 'sourceUserAvatar',
      title: '头像',
      minWidth: 70,
      cellRender: {
        name: 'CellImage',
        props: {
          width: 24,
          height: 24,
        },
      },
    },
    {
      field: 'sourceUserNickname',
      title: '昵称',
      minWidth: 80,
    },
    {
      field: 'price',
      title: '佣金',
      minWidth: 100,
      formatter: ({ row }) => `￥${fenToYuan(row.price)}`,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 85,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BROKERAGE_RECORD_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
  ];
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useFormSchema(),
  },
  gridOptions: {
    columns: useColumns(),
    height: '600',
    keepSource: true,
    showOverflow: 'tooltip',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          // 处理全部的情况
          const params = {
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            userId: userId.value,
            bizType: BrokerageRecordBizTypeEnum.ORDER.type,
            sourceUserLevel:
              formValues.sourceUserLevel === 0
                ? undefined
                : formValues.sourceUserLevel,
            status: formValues.status,
            createTime: formValues.createTime,
          };
          return await getBrokerageRecordPage(params);
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<MallBrokerageRecordApi.BrokerageRecord>,
});
</script>

<template>
  <Modal title="推广订单列表" class="w-3/5">
    <Grid table-title="推广订单列表" />
  </Modal>
</template>
