<script setup lang="ts">
import type { HttpRequestParam } from '../../../consts';

import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElCol,
  ElFormItem,
  ElInput,
  ElOption,
  ElRow,
  ElSelect,
} from 'element-plus';

import {
  BPM_HTTP_REQUEST_PARAM_TYPES,
  BpmHttpRequestParamTypeEnum,
} from '../../../consts';
import { useFormFieldsAndStartUser } from '../../../helpers';

defineOptions({ name: 'HttpRequestParamSetting' });

const props = defineProps({
  header: {
    type: Array as () => HttpRequestParam[],
    required: false,
    default: () => [],
  },
  body: {
    type: Array as () => HttpRequestParam[],
    required: false,
    default: () => [],
  },
  bind: {
    type: String,
    required: true,
  },
});

// 流程表单字段，发起人字段
const formFieldOptions = useFormFieldsAndStartUser();

/** 添加请求配置项 */
function addHttpRequestParam(arr: HttpRequestParam[]) {
  arr.push({
    key: '',
    type: BpmHttpRequestParamTypeEnum.FIXED_VALUE,
    value: '',
  });
}

/** 删除请求配置项 */
function deleteHttpRequestParam(arr: HttpRequestParam[], index: number) {
  arr.splice(index, 1);
}
</script>
<template>
  <ElFormItem label="请求头">
    <ElRow :gutter="8" v-for="(item, index) in props.header" :key="index">
      <ElCol :span="7">
        <ElFormItem
          :name="[bind, 'header', index, 'key']"
          :rules="{
            required: true,
            message: '参数名不能为空',
            trigger: ['blur', 'change'],
          }"
        >
          <ElInput placeholder="参数名不能为空" v-model="item.key" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="5">
        <ElSelect v-model="item.type">
          <ElOption
            v-for="types in BPM_HTTP_REQUEST_PARAM_TYPES"
            :key="types.value"
            :label="types.label"
            :value="types.value"
          >
            {{ types.label }}
          </ElOption>
        </ElSelect>
      </ElCol>
      <ElCol :span="10">
        <ElFormItem
          :name="[bind, 'header', index, 'value']"
          :rules="{
            required: true,
            message: '参数值不能为空',
            trigger: ['blur', 'change'],
          }"
          v-if="item.type === BpmHttpRequestParamTypeEnum.FIXED_VALUE"
        >
          <ElInput placeholder="请求头" v-model="item.value" />
        </ElFormItem>
        <ElFormItem
          :name="[bind, 'header', index, 'value']"
          :rules="{
            required: true,
            message: '参数值不能为空',
            trigger: 'change',
          }"
          v-if="item.type === BpmHttpRequestParamTypeEnum.FROM_FORM"
        >
          <ElSelect v-model="item.value" placeholder="请选择表单字段">
            <ElOption
              v-for="(field, fIdx) in formFieldOptions"
              :key="fIdx"
              :label="field.title"
              :value="field.field"
              :disabled="!field.required"
            >
              {{ field.title }}
            </ElOption>
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="2">
        <div class="flex h-8 items-center">
          <IconifyIcon
            class="size-4 cursor-pointer text-red-500"
            icon="lucide:trash-2"
            @click="deleteHttpRequestParam(props.header, index)"
          />
        </div>
      </ElCol>
    </ElRow>
    <ElButton
      link
      @click="addHttpRequestParam(props.header)"
      class="flex items-center"
    >
      <template #icon>
        <IconifyIcon class="size-4" icon="lucide:plus" />
      </template>
      添加一行
    </ElButton>
  </ElFormItem>
  <ElFormItem label="请求体">
    <ElRow :gutter="8" v-for="(item, index) in props.body" :key="index">
      <ElCol :span="7">
        <ElFormItem
          :name="[bind, 'body', index, 'key']"
          :rules="{
            required: true,
            message: '参数名不能为空',
            trigger: ['blur', 'change'],
          }"
        >
          <ElInput placeholder="参数名" v-model="item.key" />
        </ElFormItem>
      </ElCol>
      <ElCol :span="5">
        <ElSelect v-model="item.type">
          <ElOption
            v-for="types in BPM_HTTP_REQUEST_PARAM_TYPES"
            :key="types.value"
            :label="types.label"
            :value="types.value"
          >
            {{ types.label }}
          </ElOption>
        </ElSelect>
      </ElCol>
      <ElCol :span="10">
        <ElFormItem
          :name="[bind, 'body', index, 'value']"
          :rules="{
            required: true,
            message: '参数值不能为空',
            trigger: ['blur', 'change'],
          }"
          v-if="item.type === BpmHttpRequestParamTypeEnum.FIXED_VALUE"
        >
          <ElInput placeholder="参数值" v-model="item.value" />
        </ElFormItem>
        <ElFormItem
          :name="[bind, 'body', index, 'value']"
          :rules="{
            required: true,
            message: '参数值不能为空',
            trigger: 'change',
          }"
          v-if="item.type === BpmHttpRequestParamTypeEnum.FROM_FORM"
        >
          <ElSelect v-model="item.value" placeholder="请选择表单字段">
            <ElOption
              v-for="(field, fIdx) in formFieldOptions"
              :key="fIdx"
              :label="field.title"
              :value="field.field"
              :disabled="!field.required"
            >
              {{ field.title }}
            </ElOption>
          </ElSelect>
        </ElFormItem>
      </ElCol>
      <ElCol :span="2">
        <div class="flex h-8 items-center">
          <IconifyIcon
            class="size-4 cursor-pointer text-red-500"
            icon="lucide:trash-2"
            @click="deleteHttpRequestParam(props.body, index)"
          />
        </div>
      </ElCol>
    </ElRow>
    <ElButton
      link
      @click="addHttpRequestParam(props.body)"
      class="flex items-center"
    >
      <template #icon>
        <IconifyIcon class="size-4" icon="lucide:plus" />
      </template>
      添加一行
    </ElButton>
  </ElFormItem>
</template>
