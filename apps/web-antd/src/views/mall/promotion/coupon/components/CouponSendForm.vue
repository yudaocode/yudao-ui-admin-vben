<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { MallCouponTemplateApi } from '#/api/mall/promotion/coupon/couponTemplate';

import { useVbenModal } from '@vben/common-ui';
import { CouponTemplateTakeTypeEnum } from '@vben/constants';

import { message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { sendCoupon } from '#/api/mall/promotion/coupon/coupon';
import { getCouponTemplatePage } from '#/api/mall/promotion/coupon/couponTemplate';

import {
  discountFormat,
  remainedCountFormat,
  usePriceFormat,
  validityTypeFormat,
} from '../formatter';

/** 发送优惠券 */
async function handleSendCoupon(row: MallCouponTemplateApi.CouponTemplate) {
  modalApi.lock();
  try {
    await sendCoupon({
      templateId: row.id,
      userIds: modalApi.getData().userIds,
    });
    message.success('发送成功');
    await modalApi.close();
  } finally {
    modalApi.unlock();
  }
}

const [Grid] = useVbenVxeGrid({
  formOptions: {
    // TODO @AI：挪到 data.ts
    schema: [
      {
        component: 'Input',
        fieldName: 'name',
        label: '优惠券名称',
        componentProps: {
          placeholder: '请输入优惠券名称',
          allowClear: true,
        },
      },
    ],
  },
  gridOptions: {
    // TODO @AI：挪到 data.ts
    columns: [
      {
        title: '优惠券名称',
        field: 'name',
        minWidth: 120,
      },
      {
        title: '优惠金额 / 折扣',
        field: 'discount',
        minWidth: 120,
        formatter: ({ row }) => discountFormat(row),
      },
      {
        title: '最低消费',
        field: 'usePrice',
        minWidth: 100,
        formatter: ({ row }) => usePriceFormat(row),
      },
      {
        title: '有效期限',
        field: 'validityType',
        minWidth: 140,
        formatter: ({ row }) => validityTypeFormat(row),
      },
      {
        title: '剩余数量',
        minWidth: 100,
        formatter: ({ row }) => remainedCountFormat(row),
      },
      {
        title: '操作',
        width: 100,
        fixed: 'right',
        slots: { default: 'actions' },
      },
    ],
    height: 500,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getCouponTemplatePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            canTakeTypes: [CouponTemplateTakeTypeEnum.ADMIN.type],
          });
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
  } as VxeGridProps<MallCouponTemplateApi.CouponTemplate>,
});

const [Modal, modalApi] = useVbenModal({});
</script>

<template>
  <Modal title="发送优惠劵" class="w-1/2">
    <Grid>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '发送',
              type: 'link',
              auth: ['promotion:coupon:send'],
              onClick: () => handleSendCoupon(row),
            },
          ]"
        />
      </template>
    </Grid>
  </Modal>
</template>
