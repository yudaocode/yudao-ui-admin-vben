<script lang="ts" setup>
import type { MesMdItemTypeApi } from '#/api/mes/md/item/type';

import { computed, onMounted, ref, watch } from 'vue';

import { handleTree } from '@vben/utils';

import { ElTooltip, ElTreeSelect } from 'element-plus';

import { getItemTypeSimpleList } from '#/api/mes/md/item/type';

defineOptions({ name: 'MdItemTypeSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择物料分类',
  },
);

const emit = defineEmits<{
  change: [item: MesMdItemTypeApi.ItemType | undefined];
  'update:modelValue': [value: number | undefined];
}>();

type ItemTypeNode = MesMdItemTypeApi.ItemType & {
  children?: ItemTypeNode[];
  disabled?: boolean;
};

const allList = ref<MesMdItemTypeApi.ItemType[]>([]); // 物料分类列表
const itemTypeTree = ref<ItemTypeNode[]>([]); // 物料分类树
const selectedItem = ref<MesMdItemTypeApi.ItemType>(); // 当前选中分类

const selectValue = computed({
  // 选择器绑定值
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value);
  },
});

/** 递归将有子节点的分支节点标记为 disabled */
function markParentsDisabled(
  nodes: MesMdItemTypeApi.ItemType[],
): ItemTypeNode[] {
  return nodes.map((node) => {
    const children = node.children?.length
      ? markParentsDisabled(node.children)
      : undefined;
    return {
      ...node,
      children,
      disabled: Boolean(children?.length),
    };
  });
}

/** 根据当前值同步 tooltip 展示的分类详情 */
function syncSelectedItem(value: number | undefined) {
  selectedItem.value =
    value === undefined
      ? undefined
      : allList.value.find((item) => item.id === value);
}

/** 除 v-model 外，额外抛出完整分类对象给业务表单使用 */
function handleChange(value: number | undefined) {
  syncSelectedItem(value);
  emit('change', selectedItem.value);
}

/** 查询物料分类树 */
async function getItemTypeTree() {
  allList.value = await getItemTypeSimpleList();
  itemTypeTree.value = markParentsDisabled(handleTree(allList.value));
  syncSelectedItem(props.modelValue);
}

watch(
  () => props.modelValue,
  (value) => {
    syncSelectedItem(value);
  },
);

onMounted(() => {
  getItemTypeTree();
});
</script>

<template>
  <ElTooltip :disabled="!selectedItem" placement="top" :show-after="500">
    <template #content>
      <div v-if="selectedItem" class="leading-6">
        <div>编码：{{ selectedItem.code || '-' }}</div>
        <div>名称：{{ selectedItem.name || '-' }}</div>
        <div>备注：{{ selectedItem.remark || '-' }}</div>
      </div>
    </template>
    <ElTreeSelect
      v-bind="$attrs"
      v-model="selectValue"
      :clearable="clearable"
      :data="itemTypeTree"
      :disabled="disabled"
      :placeholder="placeholder"
      :props="{ children: 'children', label: 'name' }"
      check-strictly
      class="w-full"
      default-expand-all
      filterable
      node-key="id"
      @change="handleChange"
    />
  </ElTooltip>
</template>
