<script lang="ts" setup>
import type { MesDvMachineryTypeApi } from '#/api/mes/dv/machinery/type';

import { computed, onMounted, ref, watch } from 'vue';

import { handleTree } from '@vben/utils';

import { Tooltip, TreeSelect } from 'ant-design-vue';

import { getMachineryTypeSimpleList } from '#/api/mes/dv/machinery/type';

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    allowClear: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择设备类型',
  },
);

const emit = defineEmits<{
  change: [item: MesDvMachineryTypeApi.MachineryType | undefined];
  'update:modelValue': [value: number | undefined];
}>();

type MachineryTypeNode = MesDvMachineryTypeApi.MachineryType & {
  children?: MachineryTypeNode[];
  disabled?: boolean;
};

const allList = ref<MesDvMachineryTypeApi.MachineryType[]>([]); // 设备类型列表
const machineryTypeTree = ref<MachineryTypeNode[]>([]); // 设备类型树
const selectedItem = ref<MesDvMachineryTypeApi.MachineryType>(); // 选中设备类型

const selectValue = computed({
  // 选择器绑定值
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value);
  },
});

/** 递归将有子节点的分支节点标记为 disabled */
function markParentsDisabled(nodes: MesDvMachineryTypeApi.MachineryType[]): MachineryTypeNode[] {
  return nodes.map((node) => {
    const children = node.children?.length ? markParentsDisabled(node.children) : undefined;
    return { ...node, children, disabled: Boolean(children?.length) };
  });
}

/** 根据当前值同步 tooltip 展示的设备类型详情 */
function syncSelectedItem(value: number | undefined) {
  selectedItem.value =
    value === undefined ? undefined : allList.value.find((item) => item.id === value);
}

/** 除 v-model 外，额外抛出完整设备类型对象给业务表单使用 */
function handleChange(value: number | undefined) {
  syncSelectedItem(value);
  emit('change', selectedItem.value);
}

/** 查询设备类型树 */
async function getMachineryTypeTree() {
  allList.value = await getMachineryTypeSimpleList();
  machineryTypeTree.value = markParentsDisabled(handleTree(allList.value));
  syncSelectedItem(props.modelValue);
}

watch(
  () => props.modelValue,
  (value) => {
    syncSelectedItem(value);
  },
);

onMounted(() => {
  getMachineryTypeTree();
});
</script>

<template>
  <Tooltip :mouse-enter-delay="0.5" :open="selectedItem ? undefined : false">
    <template #title>
      <div v-if="selectedItem" class="leading-6">
        <div>编码：{{ selectedItem.code || '-' }}</div>
        <div>名称：{{ selectedItem.name || '-' }}</div>
        <div>备注：{{ selectedItem.remark || '-' }}</div>
      </div>
    </template>
    <TreeSelect
      v-bind="$attrs"
      v-model:value="selectValue"
      :allow-clear="allowClear"
      :disabled="disabled"
      :field-names="{ children: 'children', label: 'name', value: 'id' }"
      :placeholder="placeholder"
      :tree-data="machineryTypeTree"
      class="w-full"
      show-search
      tree-default-expand-all
      tree-node-filter-prop="name"
      @change="handleChange"
    />
  </Tooltip>
</template>
