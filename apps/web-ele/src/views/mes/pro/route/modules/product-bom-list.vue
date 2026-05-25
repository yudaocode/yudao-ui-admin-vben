<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProRouteProductBomApi } from '#/api/mes/pro/route/productbom';

import { computed, reactive, ref, watch } from 'vue';

import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getRouteProcessListByRoute } from '#/api/mes/pro/route/process';
import {
  createRouteProductBom,
  deleteRouteProductBom,
  getRouteProductBomList,
  updateRouteProductBom,
} from '#/api/mes/pro/route/productbom';
import { $t } from '#/locales';
import { MdProductBomSelect } from '#/views/mes/md/item/components';

import { useRouteProductBomGridColumns } from '../data';

const props = defineProps<{
  productId: number;
  productName?: string;
  routeId: number;
}>();

const processOptions = ref<
  Array<{ processId: number; processName?: string }>
>([]);
const activeProcessId = ref<string>('');
const list = ref<MesProRouteProductBomApi.RouteProductBom[]>([]);

const formVisible = ref(false);
const formRef = ref<FormInstance>();
const isUpdate = ref(false);
const formData = reactive<MesProRouteProductBomApi.RouteProductBom>({
  quantity: 1,
});
const formRules: FormRules = {
  itemId: [{ message: 'BOM 物料不能为空', required: true }],
  quantity: [{ message: '用料比例不能为空', required: true }],
};
const formTitle = computed(() =>
  isUpdate.value
    ? $t('ui.actionTitle.edit', ['BOM 物料'])
    : $t('ui.actionTitle.create', ['BOM 物料']),
);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    autoResize: true,
    border: true,
    columns: useRouteProductBomGridColumns(),
    data: list.value,
    minHeight: 200,
    pagerConfig: { enabled: false },
    rowConfig: { isHover: true, keyField: 'id' },
    showOverflow: true,
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<MesProRouteProductBomApi.RouteProductBom>,
});

async function loadProcessList() {
  const data = await getRouteProcessListByRoute(props.routeId);
  processOptions.value = (data || []).map((item) => ({
    processId: item.processId!,
    processName: item.processName,
  }));
  if (processOptions.value.length > 0) {
    activeProcessId.value = String(processOptions.value[0]!.processId);
    await getList();
  } else {
    activeProcessId.value = '';
    list.value = [];
    gridApi.setGridOptions({ data: list.value });
  }
}

async function getList() {
  if (!activeProcessId.value) {
    return;
  }
  gridApi.setLoading(true);
  try {
    list.value = await getRouteProductBomList({
      processId: Number(activeProcessId.value),
      productId: props.productId,
      routeId: props.routeId,
    });
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

function resetForm() {
  Object.assign(formData, {
    id: undefined,
    itemCode: undefined,
    itemId: undefined,
    itemName: undefined,
    processId: Number(activeProcessId.value),
    productId: props.productId,
    quantity: 1,
    remark: undefined,
    routeId: props.routeId,
    specification: undefined,
    unitName: undefined,
  });
  formRef.value?.clearValidate();
}

function handleCreate() {
  if (!activeProcessId.value) {
    ElMessage.warning('请先选择工序');
    return;
  }
  resetForm();
  isUpdate.value = false;
  formVisible.value = true;
}

function handleEdit(row: MesProRouteProductBomApi.RouteProductBom) {
  Object.assign(formData, row);
  isUpdate.value = true;
  formVisible.value = true;
}

async function handleDelete(row: MesProRouteProductBomApi.RouteProductBom) {
  await deleteRouteProductBom(row.id!);
  ElMessage.success($t('ui.actionMessage.deleteSuccess', ['BOM 物料']));
  await getList();
}

async function submitForm() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  await (isUpdate.value
    ? updateRouteProductBom(formData)
    : createRouteProductBom(formData));
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  formVisible.value = false;
  await getList();
}

function handleBomChange(bom?: any) {
  if (bom) {
    formData.quantity = bom.quantity ?? 1;
    formData.itemCode = bom.bomItemCode;
    formData.itemName = bom.bomItemName;
    formData.specification = bom.specification;
    formData.unitName = bom.unitName;
  }
}

watch(
  () => [props.routeId, props.productId],
  () => {
    if (props.routeId && props.productId) {
      loadProcessList();
    }
  },
  { immediate: true },
);
</script>

<template>
  <ElTabs v-model="activeProcessId" @tab-change="getList">
    <ElTabPane
      v-for="item in processOptions"
      :key="String(item.processId)"
      :label="item.processName"
      :name="String(item.processId)"
    />
  </ElTabs>
  <div class="mb-3 flex items-center justify-start">
    <TableAction
      :actions="[
        {
          label: $t('ui.actionTitle.create', ['BOM 物料']),
          type: 'primary',
          disabled: !activeProcessId,
          onClick: handleCreate,
        },
      ]"
    />
  </div>
  <Grid class="w-full" table-title="产品 BOM">
    <template #actions="{ row }">
      <TableAction
        :actions="[
          {
            label: $t('common.edit'),
            type: 'primary',
            link: true,
            onClick: handleEdit.bind(null, row),
          },
          {
            label: $t('common.delete'),
            type: 'danger',
            link: true,
            popConfirm: {
              title: $t('ui.actionMessage.deleteConfirm', ['BOM 物料']),
              confirm: handleDelete.bind(null, row),
            },
          },
        ]"
      />
    </template>
  </Grid>

  <ElDialog v-model="formVisible" :title="formTitle" width="500px">
    <ElForm
      ref="formRef"
      label-width="100px"
      :model="formData"
      :rules="formRules"
    >
      <ElFormItem label="BOM 物料" prop="itemId">
        <MdProductBomSelect
          v-model="formData.itemId"
          :item-id="productId"
          placeholder="请选择 BOM 物料"
          @change="handleBomChange"
        />
      </ElFormItem>
      <ElFormItem label="用料比例" prop="quantity">
        <ElInputNumber
          v-model="formData.quantity"
          class="!w-full"
          controls-position="right"
          :min="0"
          :precision="2"
        />
      </ElFormItem>
      <ElFormItem label="备注" prop="remark">
        <ElInput
          v-model="formData.remark"
          :maxlength="250"
          placeholder="请输入备注"
          :rows="2"
          type="textarea"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <TableAction
        :actions="[
          {
            label: $t('common.cancel'),
            type: 'default',
            onClick: () => (formVisible = false),
          },
          {
            label: $t('common.confirm'),
            type: 'primary',
            onClick: submitForm,
          },
        ]"
      />
    </template>
  </ElDialog>
</template>
