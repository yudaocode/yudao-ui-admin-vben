<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallCouponTemplateApi } from '#/api/mall/promotion/coupon/couponTemplate';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCouponTemplatePage } from '#/api/mall/promotion/coupon/couponTemplate';
import { DictTag } from '#/components/dict-tag';

import { discountFormat } from '../formatter';
import { useCouponSelectFormSchema, useCouponSelectGridColumns } from './data';

defineOptions({ name: 'CouponSelect' });

const props = defineProps<{
  takeType?: number; // 领取方式
}>();

const emit = defineEmits<{
  change: [value: MallCouponTemplateApi.CouponTemplate[]];
}>();

const selectedCoupons = ref<MallCouponTemplateApi.CouponTemplate[]>([]);

/** Grid 配置 */
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useCouponSelectFormSchema(),
  },
  gridOptions: {
    columns: useCouponSelectGridColumns(),
    height: '500px',
    keepSource: true,
    proxyConfig: {
      ajax: {
        // TODO @芋艿：要不要 ele 和 antd 统一下；
        query: async ({ page }, formValues) => {
          const params: any = {
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          };

          // 如果有 takeType 参数，添加到查询条件
          if (props.takeType !== undefined) {
            params.canTakeTypes = [props.takeType];
          }

          return await getCouponTemplatePage(params);
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
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

/** 复选框变化处理 */
function handleRowCheckboxChange({
  records,
}: {
  records: MallCouponTemplateApi.CouponTemplate[];
}) {
  selectedCoupons.value = records;
}

/** Modal 配置 */
const [Modal, modalApi] = useVbenModal({
  onConfirm() {
    emit('change', selectedCoupons.value);
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      selectedCoupons.value = [];
      return;
    }
    gridApi.query();
  },
});

/** 打开弹窗 */
function open() {
  modalApi.open();
}

defineExpose({ open });
</script>

<template>
  <Modal title="选择优惠券" class="w-2/3">
    <Grid table-title="优惠券列表">
      <!-- 优惠列自定义渲染 -->
      <template #discount="{ row }">
        <DictTag
          :type="DICT_TYPE.PROMOTION_DISCOUNT_TYPE"
          :value="row.discountType"
        />
        <span class="ml-1">{{ discountFormat(row) }}</span>
      </template>
    </Grid>
  </Modal>
</template>
