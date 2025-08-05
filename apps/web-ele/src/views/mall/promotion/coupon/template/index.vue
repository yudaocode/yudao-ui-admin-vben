<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallCouponTemplateApi } from '#/api/mall/promotion/coupon/couponTemplate';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { ElLoading, ElMessage, ElSwitch } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteCouponTemplate,
  getCouponTemplatePage,
  updateCouponTemplateStatus,
} from '#/api/mall/promotion/coupon/couponTemplate';
import { CommonStatusEnum } from '#/utils';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'PromotionCouponTemplate' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 编辑优惠券模板 */
function handleEdit(row: MallCouponTemplateApi.CouponTemplate) {
  formModalApi.setData(row).open();
}

/** 创建优惠券模板 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 删除优惠券模板 */
async function handleDelete(row: MallCouponTemplateApi.CouponTemplate) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteCouponTemplate(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: MallCouponTemplateApi.CouponTemplate[];
}) {
  checkedIds.value = records.map((item) => item.id as number);
}

/** 优惠券模板状态修改 */
async function handleStatusChange(row: MallCouponTemplateApi.CouponTemplate) {
  const text = row.status === CommonStatusEnum.ENABLE ? '启用' : '停用';
  const loadingInstance = ElLoading.service({
    text: `正在${text}优惠券模板...`,
    fullscreen: true,
  });
  try {
    await updateCouponTemplateStatus(row.id as number, row.status as 0 | 1);
    ElMessage.success(`${text}成功`);
  } catch {
    // 异常时，需要将 row.status 状态重置回之前的
    row.status =
      row.status === CommonStatusEnum.ENABLE
        ? CommonStatusEnum.DISABLE
        : CommonStatusEnum.ENABLE;
  } finally {
    loadingInstance.close();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getCouponTemplatePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
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
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【营销】优惠劵"
        url="https://doc.iocoder.cn/mall/promotion-coupon/"
      />
    </template>

    <FormModal @success="onRefresh" />
    <Grid table-title="优惠券列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['优惠券模板']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['promotion:coupon-template:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #status="{ row }">
        <ElSwitch
          v-model:checked="row.status"
          :checked-value="CommonStatusEnum.ENABLE"
          :un-checked-value="CommonStatusEnum.DISABLE"
          @change="handleStatusChange(row)"
        />
      </template>

      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['promotion:coupon-template:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['promotion:coupon-template:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
