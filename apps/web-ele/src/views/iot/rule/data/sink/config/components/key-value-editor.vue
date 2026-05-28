<script lang="ts" setup>
import { ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { isEmpty } from '@vben/utils';

import { ElButton, ElInput } from 'element-plus';

defineOptions({ name: 'KeyValueEditor' });

const props = defineProps<{
  addButtonText: string;
  modelValue: Record<string, string>;
}>();

const emit = defineEmits(['update:modelValue']);

interface KeyValueItem {
  _uid: number;
  key: string;
  value: string;
}

let uidCounter = 0;
const items = ref<KeyValueItem[]>([]); // 内部 key-value 项列表

/** 添加项目 */
function addItem() {
  uidCounter += 1;
  items.value.push({ _uid: uidCounter, key: '', value: '' });
  updateModelValue();
}

/** 移除项目 */
function removeItem(index: number) {
  items.value.splice(index, 1);
  updateModelValue();
}

/** 更新 modelValue */
function updateModelValue() {
  const result: Record<string, string> = {};
  items.value.forEach((item) => {
    if (item.key) {
      result[item.key] = item.value;
    }
  });
  emit('update:modelValue', result);
}

/** 监听项目变化 */
watch(items, updateModelValue, { deep: true });
watch(
  () => props.modelValue,
  (val) => {
    // 列表有值后以列表中的值为准
    if (isEmpty(val) || !isEmpty(items.value)) {
      return;
    }
    items.value = Object.entries(props.modelValue).map(([key, value]) => {
      uidCounter += 1;
      return { _uid: uidCounter, key, value };
    });
  },
);
</script>

<template>
  <div v-for="(item, index) in items" :key="item._uid" class="mb-2 flex w-full">
    <ElInput v-model="item.key" class="mr-2" placeholder="键" />
    <ElInput v-model="item.value" placeholder="值" />
    <ElButton class="ml-2" type="danger" link @click="removeItem(index)">
      <IconifyIcon icon="ant-design:delete-outlined" />
      删除
    </ElButton>
  </div>
  <ElButton type="primary" link @click="addItem">
    <IconifyIcon icon="ant-design:plus-outlined" />
    {{ addButtonText }}
  </ElButton>
</template>
