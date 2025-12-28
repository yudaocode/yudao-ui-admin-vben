<script setup lang="ts">
import type { InputProps, TextAreaProps } from 'ant-design-vue';

import type { FileUploadProps } from './typing';

import { computed } from 'vue';

import { useVModel } from '@vueuse/core';
import { Input, Textarea } from 'ant-design-vue';

import FileUpload from './file-upload.vue';

const props = defineProps<{
  defaultValue?: number | string;
  fileUploadProps?: FileUploadProps;
  inputProps?: InputProps;
  inputType?: 'input' | 'textarea';
  modelValue?: number | string;
  textareaProps?: TextAreaProps;
}>();

const emits = defineEmits<{
  (e: 'change', payload: number | string): void;
  (e: 'update:value', payload: number | string): void;
  (e: 'update:modelValue', payload: number | string): void;
}>();

const modelValue = useVModel(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: true,
});

/** 处理文件内容返回 */
function handleReturnText(text: string) {
  modelValue.value = text;
  emits('change', modelValue.value);
  emits('update:value', modelValue.value);
  emits('update:modelValue', modelValue.value);
}

/** 计算输入框属性 */
const inputProps = computed(() => {
  return {
    ...props.inputProps,
    value: modelValue.value,
  };
});

/** 计算文本域属性 */
const textareaProps = computed(() => {
  return {
    ...props.textareaProps,
    value: modelValue.value,
  };
});

/** 计算文件上传属性 */
const fileUploadProps = computed(() => {
  return {
    ...props.fileUploadProps,
  };
});
</script>
<template>
  <div class="w-full">
    <Input v-if="inputType === 'input'" readonly v-bind="inputProps">
      <template #suffix>
        <FileUpload v-bind="fileUploadProps" @return-text="handleReturnText" />
      </template>
    </Input>
    <div v-else class="relative w-full">
      <Textarea readonly :rows="4" v-bind="textareaProps" />
      <div class="absolute bottom-2 right-2">
        <FileUpload v-bind="fileUploadProps" @return-text="handleReturnText" />
      </div>
    </div>
  </div>
</template>
