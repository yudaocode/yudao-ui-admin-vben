<script lang="ts" setup>
// TODO @AI：改成 El 标签风格，而不是 el-
// TODO @AI：一些 modal 是否使用 Modal 组件，而不是 el-modal？
import { ref, watch } from 'vue';

import AppLinkSelectDialog from './app-link-select-dialog.vue';

/** APP 链接输入框 */
defineOptions({ name: 'AppLinkInput' });

// 定义属性
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  }, // 当前选中的链接
});

const emit = defineEmits<{
  'update:modelValue': [link: string];
}>();

const dialogRef = ref(); // 选择对话框

const appLink = ref(''); // 当前的链接
const handleOpenDialog = () => dialogRef.value?.open(appLink.value); // 处理打开对话框
const handleLinkSelected = (link: string) => (appLink.value = link); // 处理 APP 链接选中

watch(
  () => props.modelValue,
  () => (appLink.value = props.modelValue),
  { immediate: true },
);

watch(
  () => appLink.value,
  () => emit('update:modelValue', appLink.value),
);
</script>
<template>
  <el-input v-model="appLink" placeholder="输入或选择链接">
    <template #append>
      <el-button @click="handleOpenDialog">选择</el-button>
    </template>
  </el-input>

  <AppLinkSelectDialog ref="dialogRef" @change="handleLinkSelected" />
</template>
