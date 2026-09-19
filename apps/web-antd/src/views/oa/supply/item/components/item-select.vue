<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaSupplyItemApi } from '#/api/oa/supply/item';

import { nextTick } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSupplyItemSelectPage } from '#/api/oa/supply/item';

defineOptions({ name: 'OaSupplyItemSelect' });

const emit = defineEmits<{ select: [item: OaSupplyItemApi.SupplyItem] }>(); // 选择结果

const formSchema: VbenFormSchema[] = [
  {
    fieldName: 'name',
    label: '物品名称',
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: '请输入物品名称',
    },
  },
];

const columns: VxeTableGridOptions['columns'] = [
  {
    field: 'name',
    title: '物品名称',
    minWidth: 150,
  },
  {
    field: 'model',
    title: '规格型号',
    minWidth: 110,
  },
  {
    field: 'unit',
    title: '计量单位',
    width: 90,
  },
  {
    field: 'manageType',
    title: '管理类型',
    width: 100,
    cellRender: {
      name: 'CellDict',
      props: { type: DICT_TYPE.OA_SUPPLY_MANAGE_TYPE },
    },
  },
  {
    field: 'stockQuantity',
    title: '库存数量',
    width: 95,
  },
  {
    title: '操作',
    width: 80,
    slots: { default: 'actions' },
  },
];

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: formSchema,
    showCollapseButton: false,
    submitButtonOptions: {
      content: '搜索',
    },
    resetButtonOptions: {
      show: false,
    },
  },
  gridOptions: {
    columns,
    border: true,
    height: 480,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSupplyItemSelectPage({
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
      enabled: false,
    },
  } as VxeTableGridOptions<OaSupplyItemApi.SupplyItem>,
});

/** 选择物品 */
function handleSelect(item: OaSupplyItemApi.SupplyItem) {
  emit('select', item);
  modalApi.close();
}

const [Modal, modalApi] = useVbenModal({
  showConfirmButton: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 打开时重置搜索并重新查询
    await nextTick();
    await gridApi.formApi.reset();
    gridApi.query();
  },
});
</script>

<template>
  <Modal title="选择办公用品" class="w-[850px]">
    <Grid>
      <template #actions="{ row }">
        <Button type="link" @click="handleSelect(row)">选择</Button>
      </template>
    </Grid>
  </Modal>
</template>
