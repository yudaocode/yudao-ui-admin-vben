<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallCouponTemplateApi } from '#/api/mall/promotion/coupon/couponTemplate';

import { useVbenModal } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import * as CouponTemplateApi from '#/api/mall/promotion/coupon/couponTemplate';

import { useGridColumns, useGridFormSchema } from './select-data';

defineOptions({ name: 'CouponSelect' });

const props = defineProps<{
  takeType: number; // 领取方式
}>();

const emit = defineEmits(['success']);

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 500,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await CouponTemplateApi.getCouponTemplatePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            canTakeTypes: props.takeType ? [props.takeType] : [],
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
  } as VxeTableGridOptions<MallCouponTemplateApi.CouponTemplate>,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    // 从 gridApi 获取选中的记录
    const selectedRecords = (gridApi.grid?.getCheckboxRecords() ||
      []) as MallCouponTemplateApi.CouponTemplate[];
    await modalApi.close();
    emit('success', selectedRecords);
  },
});
</script>

<template>
  <Modal title="选择优惠劵" class="w-3/5">
    <Grid />
  </Modal>
</template>
