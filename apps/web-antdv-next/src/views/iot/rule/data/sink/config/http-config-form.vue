<!--suppress HttpUrlsUsage -->
<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { FormItem, Input, Select, SelectOption, TextArea } from 'antdv-next';

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
  <FormItem
    :name="['config', 'url']"
    :rules="[{ required: true, message: '请求地址不能为空', trigger: 'blur' }]"
    label="请求地址"
  >
    <Input v-model:value="urlPath" placeholder="请输入请求地址">
      <template #addonBefore>
        <Select v-model:value="urlPrefix" class="w-[100px]">
          <SelectOption value="http://">http://</SelectOption>
          <SelectOption value="https://">https://</SelectOption>
        </Select>
      </template>
    </Input>
  </FormItem>
  <FormItem
    :name="['config', 'method']"
    :rules="[
      { required: true, message: '请求方法不能为空', trigger: 'change' },
    ]"
    label="请求方法"
  >
    <Select v-model:value="config.method" placeholder="请选择请求方法">
      <SelectOption value="GET">GET</SelectOption>
      <SelectOption value="POST">POST</SelectOption>
      <SelectOption value="PUT">PUT</SelectOption>
      <SelectOption value="DELETE">DELETE</SelectOption>
    </Select>
  </FormItem>
  <FormItem label="请求头">
    <KeyValueEditor v-model="config.headers" add-button-text="添加请求头" />
  </FormItem>
  <FormItem label="请求参数">
    <KeyValueEditor v-model="config.query" add-button-text="添加参数" />
  </FormItem>
  <FormItem label="请求体">
    <TextArea v-model:value="config.body" placeholder="请输入内容" :rows="4" />
  </FormItem>
</template>
