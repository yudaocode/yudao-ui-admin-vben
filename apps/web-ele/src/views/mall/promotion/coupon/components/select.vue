<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallCouponTemplateApi } from '#/api/mall/promotion/coupon/couponTemplate';

import { ref } from 'vue';

import { ElButton, ElDialog } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCouponTemplatePage } from '#/api/mall/promotion/coupon/couponTemplate';

import { useGridColumns, useGridFormSchema } from './select-data';

defineOptions({ name: 'CouponSelect' });

const props = defineProps<{
  takeType?: number; // 领取方式
}>();

const emit = defineEmits<{
  (e: 'change', v: MallCouponTemplateApi.CouponTemplate[]): void;
}>();

const visible = ref(false); // 弹窗显示状态

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
          return await getCouponTemplatePage({
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

/** 打开弹窗 */
async function open() {
  visible.value = true;
  await gridApi.query();
}

/** 确认选择 */
function handleConfirm() {
  const selectedRecords = (gridApi.grid?.getCheckboxRecords() ||
    []) as MallCouponTemplateApi.CouponTemplate[];
  emit('change', selectedRecords);
  closeModal();
}

/** 关闭弹窗 */
function closeModal() {
  visible.value = false;
}

/** 对外暴露的方法 */
defineExpose({
  open,
});
</script>

<template>
  <ElDialog
    v-model="visible"
    title="选择优惠券"
    width="65%"
    :destroy-on-close="true"
    :append-to-body="true"
    @close="closeModal"
  >
    <Grid />
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
