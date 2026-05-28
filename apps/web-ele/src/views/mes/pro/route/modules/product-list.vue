<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProRouteProductApi } from '#/api/mes/pro/route/product';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { ElMessage } from 'element-plus';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRouteProduct,
  getRouteProductListByRoute,
} from '#/api/mes/pro/route/product';
import { $t } from '#/locales';

import { useRouteProductGridColumns } from '../data';
import ProductForm from './product-form.vue';

const props = defineProps<{
  formType: FormType;
  routeId: number;
}>();

const isEditable = ref(props.formType !== 'detail'); // 是否可编辑
const list = ref<MesProRouteProductApi.RouteProduct[]>([]); // 工艺路线产品列表

const [ProductFormModal, productFormModalApi] = useVbenModal({
  connectedComponent: ProductForm,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    autoResize: true,
    border: true,
    columns: useRouteProductGridColumns(),
    data: list.value,
    minHeight: 240,
    pagerConfig: { enabled: false },
    rowConfig: { isHover: true, keyField: 'id' },
    showOverflow: true,
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<MesProRouteProductApi.RouteProduct>,
});

/** 加载工艺路线产品列表 */
async function getList() {
  gridApi.setLoading(true);
  try {
    list.value = await getRouteProductListByRoute(props.routeId);
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

/** 新增工艺路线产品 */
function handleCreate() {
  productFormModalApi.setData({ routeId: props.routeId }).open();
}

/** 编辑工艺路线产品 */
function handleEdit(row: MesProRouteProductApi.RouteProduct) {
  productFormModalApi.setData({ id: row.id, routeId: props.routeId }).open();
}

/** 删除工艺路线产品 */
async function handleDelete(row: MesProRouteProductApi.RouteProduct) {
  await deleteRouteProduct(row.id!);
  ElMessage.success($t('ui.actionMessage.deleteSuccess', ['工艺路线产品']));
  await getList();
}

watch(
  () => props.routeId,
  (value) => {
    if (value) {
      getList();
    }
  },
  { immediate: true },
);
</script>

<template>
  <ProductFormModal @success="getList" />
  <div v-if="isEditable" class="mb-3 flex items-center justify-start">
    <TableAction
      :actions="[
        {
          label: $t('ui.actionTitle.create', ['关联产品']),
          type: 'primary',
          onClick: handleCreate,
        },
      ]"
    />
  </div>
  <Grid class="w-full" table-title="关联产品">
    <template #productionTime="{ row }">
      <span v-if="row.productionTime">
        {{ row.productionTime }}
        {{ getDictLabel(DICT_TYPE.MES_TIME_UNIT_TYPE, row.timeUnitType) }}
      </span>
    </template>
    <template #actions="{ row }">
      <TableAction
        :actions="[
          {
            label: $t('common.edit'),
            type: 'primary',
            link: true,
            ifShow: () => isEditable,
            onClick: handleEdit.bind(null, row),
          },
          {
            label: $t('common.delete'),
            type: 'danger',
            link: true,
            ifShow: () => isEditable,
            popConfirm: {
              title: $t('ui.actionMessage.deleteConfirm', ['工艺路线产品']),
              confirm: handleDelete.bind(null, row),
            },
          },
        ]"
      />
    </template>
  </Grid>
</template>
