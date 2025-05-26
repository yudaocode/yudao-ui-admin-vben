<script setup lang="ts">
import type { InputProps, TextAreaProps } from 'ant-design-vue';

import type { FileUploadProps } from './typing';

import { computed, ref } from 'vue';

import { Col, Input, Row, Textarea } from 'ant-design-vue';

import FileUpload from './file-upload.vue';

const props = defineProps<{
  fileUploadProps?: FileUploadProps;
  inputProps?: InputProps;
  inputType?: 'input' | 'textarea';
  textareaProps?: TextAreaProps;
}>();

const emit = defineEmits(['change', 'update:value']);

const value = ref('');

function handleReturnText(text: string) {
  value.value = text;
  emit('change', value.value);
  emit('update:value', value.value);
}

const inputProps = computed(() => {
  return {
    ...props.inputProps,
    value: value.value,
  };
});

const textareaProps = computed(() => {
  return {
    ...props.textareaProps,
    value: value.value,
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
