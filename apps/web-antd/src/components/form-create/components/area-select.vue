<!-- 省市区选择器 (Ant Design Vue 版本) -->
<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';

import { handleTree } from '@vben/utils';

import { Cascader } from 'ant-design-vue';

import { getAreaTree } from '#/api/system/area';

defineOptions({ name: 'AreaSelect' });

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  value: undefined,
  level: 3,
  disabled: false,
  placeholder: '请选择省市区',
  clearable: true,
  showAllLevels: true,
  separator: '/',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[] | string[] | undefined): void;
  (e: 'update:value', value: number[] | string[] | undefined): void;
}>();

// 地区数据接口
interface AreaVO {
  id: number;
  name: string;
  code: string;
  parentId?: number;
  sort?: number;
  status?: number;
  children?: AreaVO[];
}

// 接受父组件参数
interface Props {
  modelValue?: number[] | string[];
  value?: number[] | string[];
  level?: 1 | 2 | 3; // 1-省 2-市 3-区
  disabled?: boolean;
  placeholder?: string;
  clearable?: boolean;
  showAllLevels?: boolean;
  separator?: string;
  formCreateInject?: any;
}

// Ant Design Vue Cascader 的 fieldNames 配置
const fieldNames = {
  label: 'name',
  value: 'id',
  children: 'children',
};

// 地区树形数据
const areaTree = ref<AreaVO[]>([]);
// 当前选中值
const selectedValue = ref<number[] | undefined>();
// 加载状态
const loading = ref(false);

// 加载地区树形数据
async function loadAreaTree(): Promise<void> {
  try {
    loading.value = true;
    const data = await getAreaTree();
    
    // 根据 level 限制层级
    areaTree.value = filterTreeByLevel(data || [], props.level);
  } catch (error) {
    console.warn('[AreaSelect] 加载地区数据失败:', error);
    areaTree.value = [];
  } finally {
    loading.value = false;
  }
}

// 根据层级过滤树形数据
function filterTreeByLevel(tree: AreaVO[], maxLevel: number): AreaVO[] {
  if (maxLevel <= 0) return [];
  
  return tree.map((node) => {
    const newNode = { ...node };
    
    // 如果当前是最后一层,移除 children
    if (maxLevel === 1) {
      delete newNode.children;
    } else if (node.children && node.children.length > 0) {
      // 递归处理子节点
      newNode.children = filterTreeByLevel(node.children, maxLevel - 1);
    }
    
    return newNode;
  });
}

// 处理选中值变化
function handleChange(value: number[] | undefined): void {
  if (value === undefined || value === null) {
    emit('update:modelValue', undefined);
    emit('update:value', undefined);
    return;
  }
  
  emit('update:modelValue', value);
  emit('update:value', value);
}

// 同步 modelValue 或 value 到内部选中值
function syncSelectedValue(): void {
  const newValue = props.modelValue || props.value;
  
  if (newValue === undefined || newValue === null) {
    selectedValue.value = undefined;
    return;
  }
  
  // 确保是数组格式
  if (Array.isArray(newValue)) {
    selectedValue.value = newValue as number[];
  } else {
    selectedValue.value = [newValue as number];
  }
}

// 监听 modelValue 和 value 变化
watch(() => props.modelValue || props.value, syncSelectedValue, { immediate: true });

// 组件挂载时加载数据
onMounted(async () => {
  await loadAreaTree();
});
</script>

<template>
  <Cascader
    v-model:value="selectedValue"
    class="w-full"
    :options="areaTree"
    :field-names="fieldNames"
    :disabled="disabled"
    :placeholder="placeholder"
    :allow-clear="clearable"
    :show-search="true"
    :change-on-select="true"
    :loading="loading"
    @change="handleChange"
  />
</template>
