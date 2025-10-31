<!-- SPU 商品选择弹窗组件 -->
<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { MallSpuApi } from '#/api/mall/product/spu';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCategoryList } from '#/api/mall/product/category';
import { getSpuPage } from '#/api/mall/product/spu';
import { getRangePickerDefaultProps } from '#/utils';

interface SpuTableSelectProps {
  multiple?: boolean;
}

const props = withDefaults(defineProps<SpuTableSelectProps>(), {
  multiple: false,
});

const emit = defineEmits<{
  change: [spu: MallSpuApi.Spu | MallSpuApi.Spu[]];
}>();

const categoryList = ref<any[]>([]);
const categoryTreeList = ref<any[]>([]);

/** 搜索表单 Schema */
const formSchema = computed<VbenFormSchema[]>(() => [
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
    showOverflow: true,
    checkboxConfig: props.multiple
      ? {
          reserve: true,
        }
      : undefined,
    radioConfig: !props.multiple
      ? {
          reserve: true,
        }
      : undefined,
    proxyConfig: {
      ajax: {
        async query({ page }: any, formValues: any) {
          const data = await getSpuPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            tabType: 0,
            name: formValues.name || undefined,
            categoryId: formValues.categoryId || undefined,
            createTime: formValues.createTime || undefined,
          });

          return {
            items: data.list || [],
            total: data.total || 0,
          };
        },
      },
    },
  },
  gridEvents: props.multiple
    ? {
        checkboxChange: handleCheckboxChange,
        checkboxAll: handleCheckboxChange,
      }
    : {
        radioChange: handleRadioChange,
      },
});

/** 多选：处理选中变化 */
function handleCheckboxChange() {
  // vxe-table 自动管理选中状态，无需手动处理
}

/** 单选：处理选中变化 */
function handleRadioChange() {
  const selectedRow = gridApi.grid.getRadioRecord() as MallSpuApi.Spu;
  if (selectedRow) {
    emit('change', selectedRow);
    modalApi.close();
  }
}

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  onConfirm: props.multiple
    ? () => {
        const selectedRows = gridApi.grid.getCheckboxRecords() as MallSpuApi.Spu[];
        emit('change', selectedRows);
        modalApi.close();
      }
    : undefined,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      gridApi.grid.clearCheckboxRow();
      gridApi.grid.clearRadioRow();
      return;
    }

    const data = modalApi.getData<MallSpuApi.Spu | MallSpuApi.Spu[]>();

    if (props.multiple && Array.isArray(data)) {
      // 等待数据加载完成后再设置选中状态
      setTimeout(() => {
        data.forEach((spu) => {
          gridApi.grid.setCheckboxRow(spu, true);
        });
      }, 100);
    } else if (!props.multiple && data && !Array.isArray(data)) {
      setTimeout(() => {
        gridApi.grid.setRadioRow(data);
      }, 100);
    }
  },
});

/** 初始化分类数据 */
onMounted(async () => {
  categoryList.value = await getCategoryList({});
  categoryTreeList.value = handleTree(categoryList.value, 'id', 'parentId');
});

/** 对外暴露的方法 */
defineExpose({
  open: (data?: MallSpuApi.Spu | MallSpuApi.Spu[]) => {
    modalApi.setData(data).open();
  },
});
</script>

<template>
  <Modal :class="props.multiple ? 'w-[900px]' : 'w-[800px]'" title="选择商品">
    <Grid />
  </Modal>
</template>
