<script lang="ts" setup>
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page, useVbenModal } from '@vben/common-ui';

import { Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import * as OrderApi from '#/api/pay/order';
import { DocAlert } from '#/components/doc-alert';

import { columns, querySchema } from './data';
import detailFrom from './modules/order-detail.vue';

const formOptions: VbenFormProps = {
  commonConfig: {
    labelWidth: 100,
    componentProps: {
      allowClear: true,
    },
  },
  schema: querySchema(),
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  // 处理区间选择器RangePicker时间格式 将一个字段映射为两个字段 搜索/导出会用到
  // 不需要直接删除
  // fieldMappingTime: [
  //  [
  //    'createTime',
  //    ['params[beginTime]', 'params[endTime]'],
  //    ['YYYY-MM-DD 00:00:00', 'YYYY-MM-DD 23:59:59'],
  //  ],
  // ],
};

const gridOptions: VxeGridProps = {
  checkboxConfig: {
    // 高亮
    highlight: true,
    // 翻页时保留选中状态
    reserve: true,
    // 点击行选中
    // trigger: 'row',
  },
  columns,
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues = {}) => {
        return await OrderApi.getOrderPage({
          pageNum: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  // 表格全局唯一表示 保存列配置需要用到
  id: 'pay-order-index',
};

const [BasicTable] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

const [DetailModal, modalDetailApi] = useVbenModal({
  connectedComponent: detailFrom,
});

const openDetail = (id: number) => {
  modalDetailApi.setData({
    id,
  });
  modalDetailApi.open();
};
</script>

<template>
  <Page :auto-content-height="true">
    <DocAlert
      title="支付宝支付接入"
      url="https://doc.iocoder.cn/pay/alipay-pay-demo/"
    />
    <DocAlert
      title="微信公众号支付接入"
      url="https://doc.iocoder.cn/pay/wx-pub-pay-demo/"
    />
    <DocAlert
      title="微信小程序支付接入"
      url="https://doc.iocoder.cn/pay/wx-lite-pay-demo/"
    />
    <BasicTable>
      <template #action="{ row }">
        <a-button
          type="link"
          v-access:code="['pay:order:query']"
          @click="openDetail(row.id)"
        >
          {{ $t('ui.actionTitle.detail') }}
        </a-button>
      </template>
      <template #no="{ row }">
        <p class="order-font">
          <Tag size="small" color="blue"> 商户</Tag> {{ row.merchantOrderId }}
        </p>
        <p class="order-font" v-if="row.no">
          <Tag size="small" color="orange">支付</Tag> {{ row.no }}
        </p>
        <p class="order-font" v-if="row.channelOrderNo">
          <Tag size="small" color="green">渠道</Tag>
          {{ row.channelOrderNo }}
        </p>
      </template>
    </BasicTable>
    <DetailModal />
  </Page>
</template>
