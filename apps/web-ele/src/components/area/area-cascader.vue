<script lang="ts" setup>
import type { CascaderValue } from 'element-plus';

import type { SystemAreaApi } from '#/api/system/area';

import { computed, onMounted, ref, watch } from 'vue';

import { ElCascader } from 'element-plus';

import { getAreaTree } from '#/api/system/area';

defineOptions({ name: 'AreaCascader' });

const props = withDefaults(defineProps<Props>(), {
  checkStrictly: false,
  clearable: false,
  filterable: false,
  maxLevel: undefined,
  modelValue: undefined,
  placeholder: '请选择省市区',
});

const emit = defineEmits<{
  'update:modelValue': [value?: number];
}>();

interface Props {
  checkStrictly?: boolean;
  clearable?: boolean;
  filterable?: boolean;
  maxLevel?: number;
  modelValue?: number;
  placeholder?: string;
}

type AreaTreeNode = SystemAreaApi.Area & {
  children?: AreaTreeNode[];
};

const areaTree = ref<AreaTreeNode[]>([]); // 地区树
const loading = ref(false); // 加载状态
const selectedPath = ref<number[]>(); // 选中的地区路径
const displayTree = computed(() =>
  limitAreaLevel(areaTree.value, props.maxLevel),
);

/**
 * 按层级裁剪地区树（1 省、2 市、3 区）
 *
 * 不使用 disabled 限制层级：级联选择器不会展开被禁用的节点，其下级也就选不到
 */
function limitAreaLevel(
  tree: AreaTreeNode[],
  maxLevel?: number,
  depth = 1,
): AreaTreeNode[] {
  if (!maxLevel) {
    return tree;
  }
  return tree.map((node) => ({
    ...node,
    children:
      depth < maxLevel && node.children?.length
        ? limitAreaLevel(node.children, maxLevel, depth + 1)
        : undefined,
  }));
}

/**
 * 查找地区编号对应的级联路径
 *
 * @param tree 地区树
 * @param areaId 地区编号
 * @returns 省市区编号路径
 */
function findAreaPath(
  tree: AreaTreeNode[],
  areaId?: number,
): number[] | undefined {
  if (areaId === undefined || areaId === null) {
    return undefined;
  }

  for (const area of tree) {
    if (area.id === undefined) {
      continue;
    }
    if (area.id === areaId) {
      return [area.id];
    }

    const childPath = area.children?.length
      ? findAreaPath(area.children, areaId)
      : undefined;
    if (childPath) {
      return [area.id, ...childPath];
    }
  }
}

/** 同步级联选择器展示路径 */
function syncSelectedPath() {
  selectedPath.value = findAreaPath(areaTree.value, props.modelValue);
}

/** 选择地区后回写最后一级地区编号 */
function handleChange(value?: CascaderValue | null) {
  if (!Array.isArray(value) || value.length === 0) {
    emit('update:modelValue', undefined);
    return;
  }

  const path = Array.isArray(value[0]) ? value[0] : value;
  const leafValue = path.at(-1);
  const areaId = typeof leafValue === 'number' ? leafValue : Number(leafValue);
  emit('update:modelValue', Number.isNaN(areaId) ? undefined : areaId);
}

watch(() => props.modelValue, syncSelectedPath);

/** 初始化 */
onMounted(async () => {
  loading.value = true;
  try {
    areaTree.value = (await getAreaTree()) as AreaTreeNode[];
    syncSelectedPath();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <ElCascader
    v-model="selectedPath"
    :clearable="clearable"
    :filterable="filterable"
    :loading="loading"
    :options="displayTree as any"
    :placeholder="placeholder"
    :props="{
      checkStrictly,
      children: 'children',
      emitPath: true,
      label: 'name',
      value: 'id',
    }"
    @change="handleChange"
  />
</template>
