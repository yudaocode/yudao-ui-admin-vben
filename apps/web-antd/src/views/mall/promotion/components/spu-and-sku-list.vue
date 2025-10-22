<!-- SPU 和 SKU 列表展示组件 -->
<script lang="ts" setup generic="T extends MallSpuApi.Spu">
import type { SpuProperty } from './types';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { MallSpuApi } from '#/api/mall/product/spu';
import type { RuleConfig } from '#/views/mall/product/spu/form';

import { computed, ref, watch } from 'vue';

import { confirm } from '@vben/common-ui';
import { fenToYuan } from '@vben/utils';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { SkuList } from '#/views/mall/product/spu/form';

interface SpuAndSkuListProps {
  /** SPU 列表 */
  spuList: T[];
  /** 规则配置 */
  ruleConfig: RuleConfig[];
  /** SPU 属性列表 */
  spuPropertyList: SpuProperty<T>[];
  /** 是否可删除 */
  deletable?: boolean;
}

const props = withDefaults(defineProps<SpuAndSkuListProps>(), {
  deletable: false,
});

const emit = defineEmits<{
  delete: [spuId: number];
}>();

// 内部数据
const spuData = ref<MallSpuApi.Spu[]>([]);
const spuPropertyListData = ref<SpuProperty<T>[]>([]);
const expandedRowKeys = ref<number[]>([]);
const skuListRef = ref<InstanceType<typeof SkuList>>();

// 列配置（动态计算）
const columns = computed<VxeGridProps['columns']>(() => {
  const cols: VxeGridProps['columns'] = [
    {
      type: 'expand',
      width: 50,
      slots: { content: 'expand-content' },
    },
    {
      field: 'id',
      title: '商品编号',
      minWidth: 100,
      align: 'center',
    },
    {
      field: 'picUrl',
      title: '商品图',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'name',
      title: '商品名称',
      minWidth: 300,
      showOverflow: true,
    },
    {
      field: 'price',
      title: '商品售价',
      minWidth: 120,
      align: 'center',
      formatter: ({ cellValue }) => `¥${fenToYuan(cellValue)}`,
    },
    {
      field: 'salesCount',
      title: '销量',
      minWidth: 100,
      align: 'center',
    },
    {
      field: 'stock',
      title: '库存',
      minWidth: 100,
      align: 'center',
    },
  ];

  // 如果可删除且有多个 SPU，添加操作列
  if (props.deletable && spuData.value.length > 1) {
    cols.push({
      title: '操作',
      width: 100,
      fixed: 'right',
      align: 'center',
      slots: { default: 'actions' },
    });
  }

  return cols;
});

// 初始化表格
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: columns.value,
    data: spuData.value,
    border: true,
    showOverflow: true,
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    expandConfig: {
      trigger: 'row',
      expandRowKeys: expandedRowKeys.value,
    },
  },
});

/**
 * 删除 SPU
 */
async function handleDelete(row: MallSpuApi.Spu) {
  await confirm({
    content: `是否删除商品编号为 ${row.id} 的数据？`,
  });

  const index = spuData.value.findIndex((item) => item.id === row.id);
  if (index !== -1) {
    spuData.value.splice(index, 1);
    emit('delete', row.id!);
  }
}

/**
 * 获取所有 SKU 活动配置
 * @param extendedAttribute 在 SKU 上扩展的属性名称
 */
function getSkuConfigs(extendedAttribute: string) {
  if (skuListRef.value) {
    skuListRef.value.validateSku();
  }

  const configs: any[] = [];
  spuPropertyListData.value.forEach((item) => {
    item.spuDetail.skus?.forEach((sku: any) => {
      if (sku[extendedAttribute]) {
        configs.push(sku[extendedAttribute]);
      }
    });
  });

  return configs;
}

// 暴露方法给父组件
defineExpose({
  getSkuConfigs,
});

// 监听 spuList 变化
watch(
  () => props.spuList,
  (data) => {
    if (!data) return;
    spuData.value = data as MallSpuApi.Spu[];
    // 更新表格列配置和数据
    gridApi.grid.reloadData(spuData.value);
    gridApi.grid.reloadColumn(columns.value);
  },
  { deep: true, immediate: true },
);

// 监听 spuPropertyList 变化
watch(
  () => props.spuPropertyList,
  (data) => {
    if (!data) return;
    spuPropertyListData.value = data as SpuProperty<T>[];

    // 延迟展开所有行，确保 SKU 列表正确渲染
    setTimeout(() => {
      expandedRowKeys.value = data.map((item) => item.spuId);
      // 手动展开每一行
      data.forEach((item) => {
        gridApi.grid.setRowExpand(
          spuData.value.find((spu) => spu.id === item.spuId),
          true,
        );
      });
    }, 200);
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <Grid>
    <!-- 展开内容：SKU 列表 -->
    <template #expand-content="{ row }">
      <div class="p-4">
        <SkuList
          ref="skuListRef"
          :is-activity-component="true"
          :prop-form-data="
            spuPropertyListData.find((item) => item.spuId === row.id)?.spuDetail
          "
          :property-list="
            spuPropertyListData.find((item) => item.spuId === row.id)
              ?.propertyList
          "
          :rule-config="props.ruleConfig"
        >
          <!-- 扩展插槽 -->
          <template #extension>
            <slot></slot>
          </template>
        </SkuList>
      </div>
    </template>

    <!-- 操作列 -->
    <template
      v-if="props.deletable && props.spuList.length > 1"
      #actions="{ row }"
    >
      <TableAction
        :actions="[
          {
            label: '删除',
            type: 'link',
            danger: true,
            onClick: () => handleDelete(row),
          },
        ]"
      />
    </template>
  </Grid>
</template>
