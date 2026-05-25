<!--suppress HttpUrlsUsage -->
<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus';

import { IotDataSinkTypeEnum } from '#/api/iot/rule/data/sink';

import KeyValueEditor from './components/key-value-editor.vue';

const props = defineProps<{ modelValue: any }>();
const emit = defineEmits(['update:modelValue']);
const config = useVModel(props, 'modelValue', emit);

const urlPrefix = ref<'http://' | 'https://'>('http://');
const urlPath = ref('');
const fullUrl = computed(() =>
  urlPath.value ? urlPrefix.value + urlPath.value : '',
);

function syncUrlFields(url?: string) {
  if (url?.startsWith('https://')) {
    urlPrefix.value = 'https://';
    urlPath.value = url.slice(8);
  } else if (url?.startsWith('http://')) {
    urlPrefix.value = 'http://';
    urlPath.value = url.slice(7);
  } else {
    urlPath.value = url ?? '';
  }
}

watch([urlPrefix, urlPath], () => {
  config.value.url = fullUrl.value;
});

watch(
  () => config.value?.url,
  (url) => syncUrlFields(url),
  { immediate: true },
);

onMounted(() => {
  if (!isEmpty(config.value)) {
    syncUrlFields(config.value.url);
    return;
  }
  config.value = {
    type: `${IotDataSinkTypeEnum.HTTP}`,
    url: '',
    method: 'POST',
    headers: {},
    query: {},
    body: '',
  };
});
</script>

<template>
  <ElFormItem
    prop="config.url"
    :rules="[{ required: true, message: '请求地址不能为空', trigger: 'blur' }]"
    label="请求地址"
  >
    <ElInput v-model="urlPath" placeholder="请输入请求地址">
      <template #prepend>
        <ElSelect v-model="urlPrefix" class="w-[100px]">
          <ElOption label="http://" value="http://" />
          <ElOption label="https://" value="https://" />
        </ElSelect>
      </template>
    </ElInput>
  </ElFormItem>
  <ElFormItem
    prop="config.method"
    :rules="[
      { required: true, message: '请求方法不能为空', trigger: 'change' },
    ]"
    label="请求方法"
  >
    <ElSelect v-model="config.method" placeholder="请选择请求方法">
      <ElOption label="GET" value="GET" />
      <ElOption label="POST" value="POST" />
      <ElOption label="PUT" value="PUT" />
      <ElOption label="DELETE" value="DELETE" />
    </ElSelect>
  </ElFormItem>
  <ElFormItem label="请求头">
    <KeyValueEditor v-model="config.headers" add-button-text="添加请求头" />
  </ElFormItem>
  <ElFormItem label="请求参数">
    <KeyValueEditor v-model="config.query" add-button-text="添加参数" />
  </ElFormItem>
  <ElFormItem label="请求体">
    <ElInput
      v-model="config.body"
      type="textarea"
      placeholder="请输入内容"
      :rows="4"
    />
  </ElFormItem>
</template>
