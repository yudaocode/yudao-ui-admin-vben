<!--suppress HttpUrlsUsage -->
<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { Form, Input, Select } from 'ant-design-vue';

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
  <Form.Item
    :name="['config', 'url']"
    :rules="[{ required: true, message: '请求地址不能为空', trigger: 'blur' }]"
    label="请求地址"
  >
    <Input v-model:value="urlPath" placeholder="请输入请求地址">
      <template #addonBefore>
        <Select v-model:value="urlPrefix" class="w-[100px]">
          <Select.Option value="http://">http://</Select.Option>
          <Select.Option value="https://">https://</Select.Option>
        </Select>
      </template>
    </Input>
  </Form.Item>
  <Form.Item
    :name="['config', 'method']"
    :rules="[
      { required: true, message: '请求方法不能为空', trigger: 'change' },
    ]"
    label="请求方法"
  >
    <Select v-model:value="config.method" placeholder="请选择请求方法">
      <Select.Option value="GET">GET</Select.Option>
      <Select.Option value="POST">POST</Select.Option>
      <Select.Option value="PUT">PUT</Select.Option>
      <Select.Option value="DELETE">DELETE</Select.Option>
    </Select>
  </Form.Item>
  <Form.Item label="请求头">
    <KeyValueEditor v-model="config.headers" add-button-text="添加请求头" />
  </Form.Item>
  <Form.Item label="请求参数">
    <KeyValueEditor v-model="config.query" add-button-text="添加参数" />
  </Form.Item>
  <Form.Item label="请求体">
    <Input.TextArea
      v-model:value="config.body"
      placeholder="请输入内容"
      :rows="4"
    />
  </Form.Item>
</template>
