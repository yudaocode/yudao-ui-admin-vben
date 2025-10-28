<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Button, Input, InputGroup } from 'ant-design-vue';

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
  <InputGroup compact>
    <Input
      v-model:value="appLink"
      placeholder="输入或选择链接"
      class="flex-1"
    />
    <Button @click="handleOpenDialog">选择</Button>
  </InputGroup>

  <AppLinkSelectDialog ref="dialogRef" @change="handleLinkSelected" />
</template>
