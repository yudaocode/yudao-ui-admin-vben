<script lang="ts" setup>
import type { PropertyAndValues } from './type';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallSpuApi } from '#/api/mall/product/spu';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import { message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCategoryList } from '#/api/mall/product/category';
import { getSpu, getSpuPage } from '#/api/mall/product/spu';

import { getPropertyList } from './property-util';
import SkuList from './sku-list.vue';
import { useGridColumns, useGridFormSchema } from './spu-select-data';

defineOptions({ name: 'SpuSelect' });

const props = withDefaults(defineProps<SpuSelectProps>(), {
  isSelectSku: false,
  radio: false,
});

const emit = defineEmits<{
  (e: 'confirm', spuId: number, skuIds?: number[]): void;
}>();

interface SpuSelectProps {
  // 默认不需要（不需要的情况下只返回 spu，需要的情况下返回 选中的 spu 和 sku 列表）
  // 其它活动需要选择商品和商品属性导入此组件即可，需添加组件属性 :isSelectSku='true'
  isSelectSku?: boolean; // 是否需要选择 sku 属性
  radio?: boolean; // 是否单选 sku
}

// ============ 数据状态 ============
const categoryList = ref<Array<{ id: number; name: string; parentId: number }>>(
  [],
); // 分类列表
const categoryTreeList = ref<
  Array<{ id: number; name: string; parentId: number }>
>([]); // 分类树
const propertyList = ref<PropertyAndValues[]>([]); // 商品属性列表
const spuData = ref<MallSpuApi.Spu>(); // 当前展开的商品详情
const isExpand = ref(false); // 控制 SKU 列表显示

// ============ 商品选择相关 ============
const selectedSpuId = ref<number>(0); // 选中的商品 spuId
const selectedSkuIds = ref<number[]>([]); // 选中的商品 skuIds
const skuListRef = ref<InstanceType<typeof SkuList>>(); // 商品属性选择 Ref

/** 处理 SKU 选择变化 */
function selectSku(val: MallSpuApi.Sku[]) {
  const skuTable = skuListRef.value?.getSkuTableRef();
  if (selectedSpuId.value === 0) {
    message.warning('请先选择商品再选择相应的规格！！！');
    skuTable?.clearSelection();
    return;
  }
  if (val.length === 0) {
    selectedSkuIds.value = [];
    return;
  }
  if (props.radio) {
    // 只选择一个
    selectedSkuIds.value = [val.map((sku) => sku.id!)[0]];
    // 如果大于1个
    if (val.length > 1) {
      // 清空选择
      skuTable?.clearSelection();
      // 变更为最后一次选择的
      skuTable?.toggleRowSelection(val.pop(), true);
    }
  } else {
    selectedSkuIds.value = val.map((sku) => sku.id!);
  }
}

/** 处理 SPU 选择变化 */
function selectSpu(val: MallSpuApi.Spu[]) {
  if (val.length === 0) {
    selectedSpuId.value = 0;
    return;
  }
  // 只选择一个
  selectedSpuId.value = val.map((spu) => spu.id!)[0];
  // 切换选择 spu 如果有选择的 sku 则清空,确保选择的 sku 是对应的 spu 下面的
  if (selectedSkuIds.value.length > 0) {
    selectedSkuIds.value = [];
  }
  // 如果大于1个
  if (val.length > 1) {
    // 清空选择
    gridApi.grid.clearCheckboxRow();
    // 变更为最后一次选择的
    const lastRow = val.pop();
    if (lastRow) {
      gridApi.grid.setCheckboxRow(lastRow, true);
    }
    return;
  }
  // 自动展开选中的 SPU
  if (props.isSelectSku && val[0]) {
    expandChange(val[0], [val[0]]);
  }
}

/** 处理行展开变化 */
async function expandChange(
  row: MallSpuApi.Spu,
  expandedRows?: MallSpuApi.Spu[],
) {
  // 判断需要展开的 spuId === 选择的 spuId。如果选择了 A 就展开 A 的 skuList。如果选择了 A 手动展开 B 则阻断
  // 目的防止误选 sku
  if (selectedSpuId.value !== 0) {
    if (row.id !== selectedSpuId.value) {
      message.warning('你已选择商品请先取消');
      // 阻止展开，保持当前选中行的展开状态
      await gridApi.grid.setExpandRowKeys([selectedSpuId.value]);
      return;
    }
    // 如果已展开 skuList 则选择此对应的 spu 不需要重新获取渲染 skuList
    if (isExpand.value && spuData.value?.id === row.id) {
      return;
    }
  }
  spuData.value = undefined;
  propertyList.value = [];
  isExpand.value = false;
  if (expandedRows?.length === 0) {
    // 如果展开个数为 0
    expandRowKeys.value = [];
    return;
  }
  // 获取 SPU 详情
  const res = (await getSpu(row.id as number)) as MallSpuApi.Spu;
  // 注意：API 返回的价格应该已经是分为单位，无需转换
  // 如果 API 返回的是元，则需要转换为分：
  res.skus?.forEach((item) => {
    if (item.price) item.price = Math.round(item.price * 100);
    if (item.marketPrice) item.marketPrice = Math.round(item.marketPrice * 100);
    if (item.costPrice) item.costPrice = Math.round(item.costPrice * 100);
    if (item.firstBrokeragePrice)
      item.firstBrokeragePrice = Math.round(item.firstBrokeragePrice * 100);
    if (item.secondBrokeragePrice)
      item.secondBrokeragePrice = Math.round(item.secondBrokeragePrice * 100);
  });
  propertyList.value = getPropertyList(res);
  spuData.value = res;
  isExpand.value = true;
  // 设置展开行（通过 grid API）
  await gridApi.grid.setExpandRowKeys([row.id!]);
}

/** 确认选择时的触发事件 */
function confirm() {
  if (selectedSpuId.value === 0) {
    message.warning('没有选择任何商品');
    return;
  }
  if (props.isSelectSku && selectedSkuIds.value.length === 0) {
    message.warning('没有选择任何商品属性');
    return;
  }
  // 返回各自 id 列表
  props.isSelectSku
    ? emit('confirm', selectedSpuId.value, selectedSkuIds.value)
    : emit('confirm', selectedSpuId.value);
  // 关闭弹窗
  modalApi.close();
  selectedSpuId.value = 0;
  selectedSkuIds.value = [];
}

/** 搜索表单 Schema */
const formSchema = computed(() => useGridFormSchema(categoryTreeList));

/** 表格列配置 */
const gridColumns = computed<VxeTableGridOptions['columns']>(() =>
  useGridColumns(props.isSelectSku),
);

/** 初始化列表 */
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: formSchema.value,
    layout: 'horizontal',
    collapsed: false,
  },
  gridOptions: {
    columns: gridColumns.value,
    height: 500,
    border: true,
    checkboxConfig: {
      reserve: true,
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    expandConfig: props.isSelectSku
      ? {
          trigger: 'row',
          reserve: true,
        }
      : undefined,
    proxyConfig: {
      ajax: {
        async query({ page }: any, formValues: any) {
          return await getSpuPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            tabType: 0,
            ...formValues,
          });
        },
      },
    },
  },
  gridEvents: {
    checkboxChange: ({ records }) => {
      selectSpu(records as MallSpuApi.Spu[]);
    },
    expandChange: ({ row, expandedRows }) => {
      expandChange(row as MallSpuApi.Spu, expandedRows as MallSpuApi.Spu[]);
    },
  },
});

/** 初始化弹窗 */
const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  onConfirm: confirm,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      await gridApi.grid.clearCheckboxRow();
      await gridApi.grid.setExpandRowKeys([]);
      selectedSpuId.value = 0;
      selectedSkuIds.value = [];
      spuData.value = undefined;
      propertyList.value = [];
      isExpand.value = false;
      return;
    }
    // 打开时查询数据
    await gridApi.query();
  },
});

/** 对外暴露的方法 */
defineExpose({
  open: () => {
    modalApi.open();
  },
});

/** 初始化分类数据 */
onMounted(async () => {
  categoryList.value = await getCategoryList({});
  categoryTreeList.value = handleTree(categoryList.value, 'id', 'parentId');
});
</script>

<template>
  <Modal title="商品选择" class="w-[70%]">
    <Grid>
      <!-- 展开列内容（SKU 列表） -->
      <template v-if="isSelectSku" #expand_content="{ row }">
        <SkuList
          v-if="isExpand && spuData?.id === row.id"
          ref="skuListRef"
          :is-component="true"
          :is-detail="true"
          :prop-form-data="spuData"
          :property-list="propertyList"
          @selection-change="selectSku"
        />
      </template>
    </Grid>
  </Modal>
</template>
