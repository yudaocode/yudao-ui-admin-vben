<!-- 部门选择器 - 树形结构显示 -->
<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';
import { handleTree } from '@vben/utils';

import { TreeSelect } from 'ant-design-vue';

import { requestClient } from '#/api/request';

defineOptions({ name: 'DeptSelect' });

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  returnType: 'id',
  defaultCurrentDept: false,
  disabled: false,
  placeholder: '',
});

const emit = defineEmits<{
  (
    e: 'update:modelValue',
    value: number | number[] | string | string[] | undefined,
  ): void;
}>();

// todo @puhui999：是不是可以简化，使用 api 的；
/** 部门数据接口 */
interface DeptVO {
  id: number;
  name: string;
  parentId: number;
  sort?: number;
  leaderUserId?: number;
  phone?: string;
  email?: string;
  status?: number;
}

// TODO @puhui999：linter 报错；
/** 接受父组件参数 */
interface Props {
  modelValue?: number | number[] | string | string[];
  multiple?: boolean;
  returnType?: 'id' | 'name';
  defaultCurrentDept?: boolean;
  disabled?: boolean;
  placeholder?: string;
  formCreateInject?: any;
}

const deptTree = ref<any[]>([]); // 部门树形数据
const deptList = ref<DeptVO[]>([]); // 原始部门列表（用于 returnType='name' 时查找名称）
const selectedValue = ref<number | number[] | undefined>(); // 当前选中值

/** 加载部门树形数据 */
async function loadDeptTree(): Promise<void> {
  try {
    const data = await requestClient.get<DeptVO[]>('/system/dept/simple-list');
    deptList.value = data;
    deptTree.value = handleTree(data);
  } catch (error) {
    console.warn('[DeptSelect] 加载部门数据失败:', error);
    deptTree.value = [];
  }
}

/** 根据 ID 获取部门名称 */
function getDeptNameById(id: number): string | undefined {
  const dept = deptList.value.find((item: DeptVO) => item.id === id);
  if (!dept) {
    console.warn(`[DeptSelect] 未找到 ID 为 ${id} 的部门`);
  }
  return dept?.name;
}

/** 根据名称获取部门 ID */
function getDeptIdByName(name: string): number | undefined {
  const dept = deptList.value.find((item: DeptVO) => item.name === name);
  return dept?.id;
}

/** 处理选中值变化 */
function handleChange(value: number | number[] | undefined): void {
  if (value === undefined || value === null) {
    emit('update:modelValue', props.multiple ? [] : undefined);
    return;
  }

  // 根据 returnType 决定返回值类型
  if (props.returnType === 'name') {
    if (props.multiple && Array.isArray(value)) {
      const names = value
        .map((id) => getDeptNameById(id))
        .filter(Boolean) as string[];
      emit('update:modelValue', names);
    } else if (!props.multiple && typeof value === 'number') {
      const name = getDeptNameById(value);
      emit('update:modelValue', name);
    }
  } else {
    emit('update:modelValue', value);
  }
}

/** 树节点过滤方法（支持搜索过滤） */
function filterTreeNode(inputValue: string, treeNode: any): boolean {
  if (!inputValue) return true;
  return treeNode.name?.toLowerCase().includes(inputValue.toLowerCase());
}

/** 同步 modelValue 到内部选中值 */
function syncSelectedValue(): void {
  const newValue = props.modelValue;
  if (newValue === undefined || newValue === null) {
    selectedValue.value = props.multiple ? [] : undefined;
    return;
  }

  // 如果 returnType 是 'name'，需要将名称转换为 ID 用于树选择器显示
  if (props.returnType === 'name') {
    // 只有在 deptList 加载完成后才能进行转换
    if (deptList.value.length === 0) {
      return;
    }
    if (props.multiple && Array.isArray(newValue)) {
      selectedValue.value = (newValue as string[])
        .map((name) => getDeptIdByName(name))
        .filter(Boolean) as number[];
    } else if (!props.multiple && typeof newValue === 'string') {
      selectedValue.value = getDeptIdByName(newValue);
    }
  } else {
    selectedValue.value = newValue as number | number[];
  }
}

/** 监听 modelValue 变化，同步到内部选中值 */
watch(() => props.modelValue, syncSelectedValue, { immediate: true });

/** 监听 deptList 变化，重新同步选中值（解决数据加载完成后的回显问题） */
watch(() => deptList.value, syncSelectedValue);

/** 检查是否有有效的预设值 */
function hasValidPresetValue(): boolean {
  const value = props.modelValue;
  if (value === undefined || value === null || value === '') {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return true;
}

/** 设置默认值（当前用户部门） */
function setDefaultValue(): void {
  // 仅当 defaultCurrentDept 为 true 时处理
  if (!props.defaultCurrentDept) {
    return;
  }
  // 检查是否已有预设值（预设值优先级高于默认当前部门）
  if (hasValidPresetValue()) {
    return;
  }

  // 获取当前用户的部门 ID
  const userStore = useUserStore();
  const deptId = userStore.userInfo?.deptId as number | undefined;
  // 处理 deptId 为空或 0 的边界情况
  if (!deptId || deptId === 0) {
    return;
  }

  // 根据多选模式决定默认值格式
  const defaultValue = props.multiple ? [deptId] : deptId;
  emit('update:modelValue', defaultValue);
}

/** 组件挂载时加载数据并设置默认值 */
onMounted(async () => {
  await loadDeptTree();
  // 数据加载完成后设置默认值
  setDefaultValue();
});
</script>

<template>
  <TreeSelect
    v-model:value="selectedValue"
    class="w-full"
    :tree-data="deptTree"
    :field-names="{ label: 'name', value: 'id', children: 'children' }"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="placeholder || '请选择部门'"
    :tree-checkable="multiple"
    :show-search="true"
    :filter-tree-node="filterTreeNode"
    :allow-clear="true"
    @change="handleChange"
  />
</template>
