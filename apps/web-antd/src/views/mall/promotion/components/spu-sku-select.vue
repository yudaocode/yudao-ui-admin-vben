<!-- SPU 和 SKU 联合选择弹窗组件 -->
<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { MallSpuApi } from '#/api/mall/product/spu';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import { message, Radio } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCategoryList } from '#/api/mall/product/category';
import { getSpu, getSpuPage } from '#/api/mall/product/spu';
import { getRangePickerDefaultProps } from '#/utils';
import { getPropertyList, SkuList } from '#/views/mall/product/spu/form';

interface SpuSkuSelectProps {
  isSelectSku?: boolean; // 是否选择 SKU
  radio?: boolean; // 是否单选 SKU
}

const props = withDefaults(defineProps<SpuSkuSelectProps>(), {
  isSelectSku: false,
  radio: false,
});

const emit = defineEmits<{
  confirm: [spuId: number, skuIds?: number[]];
}>();

const selectedSpuId = ref<number>(); // 单选：选中的 SPU ID
const selectedSkuIds = ref<number[]>([]); // 选中的 SKU ID 列表
const spuData = ref<MallSpuApi.Spu>();
const propertyList = ref<any[]>([]);
const isExpand = ref(false);
const expandRowKeys = ref<number[]>([]);
const skuListRef = ref<InstanceType<typeof SkuList>>();

const categoryList = ref<any[]>([]); // 分类列表（扁平）
const categoryTreeList = ref<any[]>([]); // 分类树

const formSchema = computed<VbenFormSchema[]>(() => {
  return [
    {
      fieldName: 'name',
      label: '商品名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入商品名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'categoryId',
      label: '商品分类',
      component: 'TreeSelect',
      componentProps: {
        treeData: categoryTreeList.value,
        fieldNames: {
          label: 'name',
          value: 'id',
        },
        treeCheckStrictly: true,
        placeholder: '请选择商品分类',
        allowClear: true,
        showSearch: true,
        treeNodeFilterProp: 'name',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
});

const gridColumns = computed<VxeGridProps['columns']>(() => {
  const columns: VxeGridProps['columns'] = [];
  // 如果需要选择 SKU，添加展开列
  if (props.isSelectSku) {
    columns.push({
      type: 'expand',
      width: 50,
      slots: { content: 'expand-content' },
    });
  }
  // 单选列
  columns.push(
    {
      field: 'radio',
      title: '#',
      width: 55,
      align: 'center',
      slots: { default: 'radio-column' },
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
      minWidth: 200,
    },
    {
      field: 'categoryId',
      title: '商品分类',
      minWidth: 120,
      formatter: ({ cellValue }) => {
        const category = categoryList.value?.find((c) => c.id === cellValue);
        return category?.name || '-';
      },
    },
  );
  return columns;
});

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
    showOverflow: true,
    expandConfig: {
      expandRowKeys: expandRowKeys.value,
    },
    proxyConfig: {
      ajax: {
        async query({ page }: any, formValues: any) {
          try {
            // TODO @puhui999：1）try catch 可以去掉？；2）params 直接放到 getSpuPage 里哇？
            const params = {
              pageNo: page.currentPage,
              pageSize: page.pageSize,
              tabType: 0, // 默认获取上架的商品
              name: formValues.name || undefined,
              categoryId: formValues.categoryId || undefined,
              createTime: formValues.createTime || undefined,
            };

            const data = await getSpuPage(params);

            return {
              items: data.list || [],
              total: data.total || 0,
            };
          } catch (error) {
            console.error('加载商品数据失败:', error);
            return { items: [], total: 0 };
          }
        },
      },
    },
  },
});

/** 单选：处理选中 SPU */
async function handleSingleSelected(row: MallSpuApi.Spu) {
  selectedSpuId.value = row.id;
  // 如果需要选择 SKU，展开行
  if (props.isSelectSku) {
    await expandChange(row, [row]);
  }
}

/** 选择 SKU */
function selectSku(skus: MallSpuApi.Sku[]) {
  if (!selectedSpuId.value) {
    message.warning('请先选择商品再选择相应的规格！');
    return;
  }
  if (skus.length === 0) {
    selectedSkuIds.value = [];
    return;
  }
  props.radio
    ? (selectedSkuIds.value = [skus[0]?.id!])
    : (selectedSkuIds.value = skus.map((sku) => sku.id!));
}

/** 展开行，加载 SKU 列表 */
async function expandChange(
  row: MallSpuApi.Spu,
  expandedRows?: MallSpuApi.Spu[],
) {
  // 检查是否是当前选中的 SPU
  if (selectedSpuId.value && row.id !== selectedSpuId.value) {
    message.warning('你已选择商品，请先取消');
    expandRowKeys.value = [selectedSpuId.value];
    return;
  }
  // 如果已经展开且是同一个 SPU，不重复加载
  if (isExpand.value && spuData.value?.id === row.id) {
    return;
  }

  // 重置数据
  spuData.value = undefined;
  propertyList.value = [];
  isExpand.value = false;
  if (!expandedRows || expandedRows.length === 0) {
    expandRowKeys.value = [];
    return;
  }

  // 加载 SPU 详情
  const res = await getSpu(row.id!);
  propertyList.value = getPropertyList(res);
  spuData.value = res;
  isExpand.value = true;
  expandRowKeys.value = [row.id!];
}

/** 确认选择 */
function handleConfirm() {
  if (!selectedSpuId.value) {
    message.warning('没有选择任何商品');
    return;
  }
  if (props.isSelectSku && selectedSkuIds.value.length === 0) {
    message.warning('没有选择任何商品属性');
    return;
  }

  // 返回选中的数据
  emit(
    'confirm',
    selectedSpuId.value,
    props.isSelectSku ? selectedSkuIds.value : undefined,
  );
  // 关闭弹窗
  modalApi.close();
}

const [Modal, modalApi] = useVbenModal({
  onConfirm: handleConfirm,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      // 关闭时清理状态
      selectedSpuId.value = undefined;
      selectedSkuIds.value = [];
      spuData.value = undefined;
      propertyList.value = [];
      isExpand.value = false;
      expandRowKeys.value = [];
      return;
    }

    // 打开时触发查询
    await gridApi.query();
  },
});
defineExpose({
  open: modalApi.open,
  close: modalApi.close,
});
/** 初始化分类数据 */
onMounted(async () => {
  categoryList.value = await getCategoryList({});
  categoryTreeList.value = handleTree(categoryList.value, 'id', 'parentId');
});
</script>

<template>
  <Modal class="w-[900px]" title="商品选择">
    <Grid>
      <!-- 单选列 -->
      <template #radio-column="{ row }">
        <Radio
          :checked="selectedSpuId === row.id"
          :value="row.id"
          class="cursor-pointer"
          @click="handleSingleSelected(row)"
        />
      </template>

      <!-- SKU 展开内容 -->
      <template v-if="props.isSelectSku" #expand-content>
        <div v-if="isExpand" class="p-4">
          <SkuList
            ref="skuListRef"
            :is-component="true"
            :is-detail="true"
            :prop-form-data="spuData"
            :property-list="propertyList"
            @selection-change="selectSku"
          />
        </div>
      </template>
    </Grid>
  </Modal>
</template>
