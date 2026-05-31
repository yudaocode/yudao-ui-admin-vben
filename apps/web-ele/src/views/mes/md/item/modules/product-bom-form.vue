<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdItemApi } from '#/api/mes/md/item';
import type { MesMdProductBomApi } from '#/api/mes/md/item/productBom';

import { computed, ref, watch } from 'vue';

import { ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenForm, z } from '#/adapter/form';
import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createProductBom,
  deleteProductBom,
  getProductBomListByItemId,
  updateProductBom,
} from '#/api/mes/md/item/productBom';
import { $t } from '#/locales';

import { MdItemSelectDialog } from '../components';
import { useProductBomGridColumns } from '../data';

const props = withDefaults(
  defineProps<{
    formType?: FormType;
    itemId: number;
  }>(),
  {
    formType: 'update',
  },
);

const isReadOnly = computed(() => props.formType === 'detail'); // 是否只读
const formOpen = ref(false); // BOM 表单是否打开
const formLoading = ref(false); // BOM 表单提交中
const formData = ref<MesMdProductBomApi.ProductBom>();
const list = ref<MesMdProductBomApi.ProductBom[]>([]); // 产品 BOM 列表
const itemSelectRef = ref<InstanceType<typeof MdItemSelectDialog>>(); // 物料选择弹窗

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'itemId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'bomItemId',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'bomItemCode',
      label: 'BOM 物料编码',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'bomItemName',
      label: 'BOM 物料名称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'bomItemSpecification',
      label: '规格型号',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'unitMeasureName',
      label: '单位',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'quantity',
      label: '用量比例',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 0,
        precision: 4,
        step: 0.1,
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ],
  showDefaultActions: false,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    autoResize: true,
    border: true,
    columns: useProductBomGridColumns(isReadOnly.value),
    data: list.value,
    minHeight: 240,
    pagerConfig: {
      enabled: false,
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    showOverflow: true,
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<MesMdProductBomApi.ProductBom>,
});

/** 加载产品 BOM 列表 */
async function getList() {
  gridApi.setLoading(true);
  try {
    list.value = await getProductBomListByItemId(props.itemId);
    gridApi.setGridOptions({ data: list.value });
  } finally {
    gridApi.setLoading(false);
  }
}

/** 打开 BOM 物料选择弹窗 */
function handleAdd() {
  itemSelectRef.value?.open(undefined, { multiple: true });
}

/** 添加选中的 BOM 物料 */
async function handleItemSelected(rows: MesMdItemApi.Item[]) {
  if (rows.length === 0) {
    return;
  }
  for (const item of rows) {
    await createProductBom({
      bomItemId: item.id,
      itemId: props.itemId,
      quantity: 1,
    });
  }
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  await getList();
}

/** 打开 BOM 编辑弹窗 */
async function openForm(row: MesMdProductBomApi.ProductBom) {
  formOpen.value = true;
  formData.value = row;
  await formApi.resetForm();
  await formApi.setValues({
    ...row,
    itemId: props.itemId,
  });
}

/** 提交 BOM 表单 */
async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  formLoading.value = true;
  try {
    const data = (await formApi.getValues()) as MesMdProductBomApi.ProductBom;
    await (formData.value?.id
      ? updateProductBom(data)
      : createProductBom(data));
    formOpen.value = false;
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    await getList();
  } finally {
    formLoading.value = false;
  }
}

/** 删除 BOM 物料 */
async function handleDelete(id: number) {
  await deleteProductBom(id);
  ElMessage.success($t('ui.actionMessage.deleteSuccess', ['BOM']));
  await getList();
}

watch(
  () => props.itemId,
  (value) => {
    if (value) {
      getList();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div>
    <div v-if="!isReadOnly" class="mb-3 flex items-center justify-start">
      <TableAction
        :actions="[
          {
            label: '添加 BOM 物料',
            type: 'primary',
            onClick: handleAdd,
          },
        ]"
      />
    </div>
    <Grid class="w-full">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'primary',
              link: true,
              onClick: openForm.bind(null, row),
            },
            {
              label: '删除',
              type: 'danger',
              link: true,
              popConfirm: {
                title: '确认删除该 BOM 吗？',
                confirm: handleDelete.bind(null, row.id!),
              },
            },
          ]"
        />
      </template>
    </Grid>

    <ElDialog v-model="formOpen" title="编辑 BOM" width="600px">
      <Form class="mx-4" />
      <template #footer>
        <ElButton @click="formOpen = false">取消</ElButton>
        <ElButton type="primary" :loading="formLoading" @click="submitForm">
          确定
        </ElButton>
      </template>
    </ElDialog>

    <MdItemSelectDialog ref="itemSelectRef" @selected="handleItemSelected" />
  </div>
</template>
