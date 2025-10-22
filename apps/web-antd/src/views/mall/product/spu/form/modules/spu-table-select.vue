<!-- SPU 商品选择弹窗组件 -->
<script lang="ts" setup>
import type { CheckboxChangeEvent } from 'ant-design-vue/es/checkbox/interface';

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { MallSpuApi } from '#/api/mall/product/spu';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import { Checkbox, Radio } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCategoryList } from '#/api/mall/product/category';
import { getSpuPage } from '#/api/mall/product/spu';
import { getRangePickerDefaultProps } from '#/utils';

interface SpuTableSelectProps {
  multiple?: boolean; // 是否多选模式
}

const props = withDefaults(defineProps<SpuTableSelectProps>(), {
  multiple: false,
});

const emit = defineEmits<{
  change: [spu: MallSpuApi.Spu | MallSpuApi.Spu[]];
}>();

// 单选：选中的 SPU ID
const selectedSpuId = ref<number>();
// 多选：选中状态 map
const checkedStatus = ref<Record<number, boolean>>({});
// 多选：选中的 SPU 列表
const checkedSpus = ref<MallSpuApi.Spu[]>([]);
// 多选：全选状态
const isCheckAll = ref(false);
// 多选：半选状态
const isIndeterminate = ref(false);

// 分类列表（扁平）
const categoryList = ref<any[]>([]);
// 分类树
const categoryTreeList = ref<any[]>([]);

// 初始化分类数据
onMounted(async () => {
  try {
    categoryList.value = await getCategoryList({});
    categoryTreeList.value = handleTree(categoryList.value, 'id', 'parentId');
  } catch (error) {
    console.error('加载分类数据失败:', error);
  }
});

// 搜索表单配置
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

// 列配置
const gridColumns = computed<VxeGridProps['columns']>(() => {
  const columns: VxeGridProps['columns'] = [];

  // 多选模式：添加多选列
  if (props.multiple) {
    columns.push({
      field: 'checkbox',
      title: '',
      width: 55,
      align: 'center',
      slots: { default: 'checkbox-column', header: 'checkbox-header' },
    });
  } else {
    // 单选模式：添加单选列
    columns.push({
      field: 'radio',
      title: '#',
      width: 55,
      align: 'center',
      slots: { default: 'radio-column' },
    });
  }

  // 其他列
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

// 初始化表格
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
    proxyConfig: {
      ajax: {
        async query({ page }: any, formValues: any) {
          try {
            const params = {
              pageNo: page.currentPage,
              pageSize: page.pageSize,
              tabType: 0, // 默认获取上架的商品
              name: formValues.name || undefined,
              categoryId: formValues.categoryId || undefined,
              createTime: formValues.createTime || undefined,
            };

            const data = await getSpuPage(params);

            // 初始化多选状态
            if (props.multiple && data.list) {
              data.list.forEach((spu) => {
                if (checkedStatus.value[spu.id!] === undefined) {
                  checkedStatus.value[spu.id!] = false;
                }
              });
              calculateIsCheckAll();
            }

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

// 单选：处理选中
function handleSingleSelected(row: MallSpuApi.Spu) {
  selectedSpuId.value = row.id;
  emit('change', row);
  modalApi.close();
}

// 多选：全选/全不选
function handleCheckAll(e: CheckboxChangeEvent) {
  const checked = e.target.checked;
  isCheckAll.value = checked;
  isIndeterminate.value = false;

  const currentList = gridApi.grid.getData();
  currentList.forEach((spu: MallSpuApi.Spu) => {
    handleCheckOne(checked, spu, false);
  });
  calculateIsCheckAll();
}

// 多选：选中单个
function handleCheckOne(
  checked: boolean,
  spu: MallSpuApi.Spu,
  needCalc = true,
) {
  if (checked) {
    // 避免重复添加
    const exists = checkedSpus.value.some((item) => item.id === spu.id);
    if (!exists) {
      checkedSpus.value.push(spu);
    }
    checkedStatus.value[spu.id!] = true;
  } else {
    const index = checkedSpus.value.findIndex((item) => item.id === spu.id);
    if (index !== -1) {
      checkedSpus.value.splice(index, 1);
    }
    checkedStatus.value[spu.id!] = false;
    isCheckAll.value = false;
  }

  if (needCalc) {
    calculateIsCheckAll();
  }
}

// 多选：计算全选状态
function calculateIsCheckAll() {
  const currentList = gridApi.grid.getData();
  if (currentList.length === 0) {
    isCheckAll.value = false;
    isIndeterminate.value = false;
    return;
  }

  const checkedCount = currentList.filter(
    (spu: MallSpuApi.Spu) => checkedStatus.value[spu.id!],
  ).length;

  isCheckAll.value = checkedCount === currentList.length;
  isIndeterminate.value = checkedCount > 0 && checkedCount < currentList.length;
}

// 初始化弹窗
const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  // 多选模式时显示确认按钮
  onConfirm: props.multiple
    ? () => {
        emit('change', [...checkedSpus.value]);
        modalApi.close();
      }
    : undefined,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      // 关闭时清理状态
      if (!props.multiple) {
        selectedSpuId.value = undefined;
      }
      return;
    }

    // 打开时处理初始数据
    const data = modalApi.getData<MallSpuApi.Spu | MallSpuApi.Spu[]>();

    // 重置多选状态
    if (props.multiple) {
      checkedSpus.value = [];
      checkedStatus.value = {};
      isCheckAll.value = false;
      isIndeterminate.value = false;

      // 恢复已选中的数据
      if (Array.isArray(data) && data.length > 0) {
        checkedSpus.value = [...data];
        checkedStatus.value = Object.fromEntries(
          data.map((spu) => [spu.id!, true]),
        );
      }
    } else {
      // 单选模式：恢复已选中的 ID
      if (data && !Array.isArray(data)) {
        selectedSpuId.value = data.id;
      }
    }

    // 触发查询
    await gridApi.query();
  },
});
</script>

<template>
  <Modal :class="props.multiple ? 'w-[900px]' : 'w-[800px]'" title="选择商品">
    <Grid>
      <!-- 单选列 -->
      <template v-if="!props.multiple" #radio-column="{ row }">
        <Radio
          :checked="selectedSpuId === row.id"
          :value="row.id"
          class="cursor-pointer"
          @click="handleSingleSelected(row)"
        />
      </template>

      <!-- 多选表头 -->
      <template v-if="props.multiple" #checkbox-header>
        <Checkbox
          v-model:checked="isCheckAll"
          :indeterminate="isIndeterminate"
          class="cursor-pointer"
          @change="handleCheckAll"
        />
      </template>

      <!-- 多选列 -->
      <template v-if="props.multiple" #checkbox-column="{ row }">
        <Checkbox
          v-model:checked="checkedStatus[row.id]"
          class="cursor-pointer"
          @change="(e) => handleCheckOne(e.target.checked, row)"
        />
      </template>
    </Grid>
  </Modal>
</template>
