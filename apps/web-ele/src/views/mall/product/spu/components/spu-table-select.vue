<!-- SPU 商品选择弹窗组件 -->
<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { MallCategoryApi } from '#/api/mall/product/category';
import type { MallSpuApi } from '#/api/mall/product/spu';

import { computed, nextTick, onMounted, ref } from 'vue';

import { handleTree } from '@vben/utils';

import { ElDialog } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCategoryList } from '#/api/mall/product/category';
import { getSpuPage } from '#/api/mall/product/spu';
import { getRangePickerDefaultProps } from '#/utils';

interface SpuTableSelectProps {
  multiple?: boolean; // 是否单选：true - checkbox；false - radio
}

const props = withDefaults(defineProps<SpuTableSelectProps>(), {
  multiple: false,
});

const emit = defineEmits<{
  change: [spu: MallSpuApi.Spu | MallSpuApi.Spu[]];
}>();

const categoryList = ref<MallCategoryApi.Category[]>([]); // 分类列表
const categoryTreeList = ref<any[]>([]); // 分类树

/** 弹窗显示状态 */
const visible = ref(false);
const initData = ref<MallSpuApi.Spu | MallSpuApi.Spu[]>();

/** 单选：处理选中变化 */
function handleRadioChange() {
  const selectedRow = gridApi.grid.getRadioRecord() as MallSpuApi.Spu;
  if (selectedRow) {
    emit('change', selectedRow);
    closeModal();
  }
}

/** 搜索表单 Schema */
const formSchema = computed<VbenFormSchema[]>(() => [
  {
    fieldName: 'name',
    label: '商品名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入商品名称',
      clearable: true,
    },
  },
  {
    fieldName: 'categoryId',
    label: '商品分类',
    component: 'ApiTreeSelect',
    componentProps: {
      options: categoryTreeList,
      props: { label: 'name', children: 'children' },
      nodeKey: 'id',
      placeholder: '请选择商品分类',
      clearable: true,
    },
  },
  {
    fieldName: 'createTime',
    label: '创建时间',
    component: 'RangePicker',
    componentProps: {
      ...getRangePickerDefaultProps(),
      clearable: true,
    },
  },
]);

/** 表格列配置 */
const gridColumns = computed<VxeGridProps['columns']>(() => {
  const columns: VxeGridProps['columns'] = [];
  if (props.multiple) {
    columns.push({ type: 'checkbox', width: 55 });
  } else {
    columns.push({ type: 'radio', width: 55 });
  }
  columns.push(
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
    checkboxConfig: {
      reserve: true,
    },
    radioConfig: {
      reserve: true,
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
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
    radioChange: handleRadioChange,
  },
});

/** 打开弹窗 */
async function openModal(data?: MallSpuApi.Spu | MallSpuApi.Spu[]) {
  initData.value = data;
  visible.value = true;
  await nextTick();
  // 1. 查询数据
  await gridApi.query();
  // 2. 设置已选中行
  const tableData = gridApi.grid.getTableData().fullData;
  if (
    props.multiple &&
    Array.isArray(initData.value) &&
    initData.value.length > 0
  ) {
    setTimeout(() => {
      (initData.value as unknown as MallSpuApi.Spu[])!.forEach((spu) => {
        const row = tableData.find(
          (item: MallSpuApi.Spu) => item.id === spu.id,
        );
        if (row) {
          gridApi.grid.setCheckboxRow(row, true);
        }
      });
    }, 300);
  } else if (
    !props.multiple &&
    initData.value &&
    !Array.isArray(initData.value)
  ) {
    setTimeout(() => {
      const row = tableData.find(
        (item: MallSpuApi.Spu) =>
          item.id === (initData.value as MallSpuApi.Spu).id,
      );
      if (row) {
        gridApi.grid.setRadioRow(row);
      }
    }, 300);
  }
}

/** 关闭弹窗 */
async function closeModal() {
  visible.value = false;
  await gridApi.grid.clearCheckboxRow();
  await gridApi.grid.clearRadioRow();
  initData.value = undefined;
}

/** 确认选择（多选模式） */
function handleConfirm() {
  const selectedRows = gridApi.grid.getCheckboxRecords() as MallSpuApi.Spu[];
  emit('change', selectedRows);
  closeModal();
}

/** 对外暴露的方法 */
defineExpose({
  open: openModal,
});

/** 初始化分类数据 */
onMounted(async () => {
  categoryList.value = await getCategoryList({});
  categoryTreeList.value = handleTree(categoryList.value, 'id', 'parentId');
});
</script>

<template>
  <ElDialog
    v-model="visible"
    title="选择商品"
    width="950px"
    :destroy-on-close="true"
    :append-to-body="true"
    @close="closeModal"
  >
    <Grid />
    <template v-if="props.multiple" #footer>
      <el-button @click="closeModal">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </ElDialog>
</template>
