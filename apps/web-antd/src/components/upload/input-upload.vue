<script setup lang="ts">
// TODO @xingyu：这个组件，只有 pay 在用，和现有的 file-upload 和 image-upload 有点不一致。是不是可以考虑移除，只在 pay 那搞个复用的组件；
import type { InputProps, TextAreaProps } from 'ant-design-vue';

import type { FileUploadProps } from './typing';

import { computed } from 'vue';

import { useVModel } from '@vueuse/core';
import { Col, Input, Row, Textarea } from 'ant-design-vue';

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

function handleReturnText(text: string) {
  modelValue.value = text;
  emits('change', modelValue.value);
  emits('update:value', modelValue.value);
  emits('update:modelValue', modelValue.value);
}

const inputProps = computed(() => {
  return {
    ...props.inputProps,
    value: modelValue.value,
  };
});

const textareaProps = computed(() => {
  return {
    ...props.textareaProps,
    value: modelValue.value,
  };
});

const fileUploadProps = computed(() => {
  return {
    ...props.fileUploadProps,
  };
});
</script>
<template>
  <Row>
    <Col :span="18">
      <Input v-if="inputType === 'input'" v-bind="inputProps" />
      <Textarea v-else :row="4" v-bind="textareaProps" />
    </Col>
    <Col :span="6">
      <FileUpload
        class="ml-4"
        v-bind="fileUploadProps"
        @return-text="handleReturnText"
      />
    </Col>
  </Row>
</template>
