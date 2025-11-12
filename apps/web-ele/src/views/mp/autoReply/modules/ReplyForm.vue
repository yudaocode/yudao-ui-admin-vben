<script lang="ts" setup>
import type { FormInstance } from 'element-plus';

import type { Reply } from '#/views/mp/modules/wx-reply';

import { computed, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElForm, ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus';

import WxReplySelect from '#/views/mp/modules/wx-reply';

import { MsgType } from './types';

defineOptions({ name: 'ReplyForm' });

const props = defineProps<{
  modelValue: any;
  msgType: MsgType;
  reply: Reply;
}>();

const emit = defineEmits<{
  (e: 'update:reply', v: Reply): void;
  (e: 'update:modelValue', v: any): void;
}>();

const reply = computed<Reply>({
  get: () => props.reply,
  set: (val) => emit('update:reply', val),
});

const replyForm = computed<any>({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const formRef = ref<FormInstance | null>(null); // 表单 ref

const RequestMessageTypes = [
  'text',
  'image',
  'voice',
  'video',
  'shortvideo',
  'location',
  'link',
]; // 允许选择的请求消息类型

// 表单校验
const rules = {
  requestKeyword: [
    { required: true, message: '请求的关键字不能为空', trigger: 'blur' },
  ],
  requestMatch: [
    { required: true, message: '请求的关键字的匹配不能为空', trigger: 'blur' },
  ],
};

defineExpose({
  resetFields: () => formRef.value?.resetFields(),
  validate: async () => formRef.value?.validate(),
});
</script>

<template>
  <div>
    <ElForm ref="formRef" :model="replyForm" :rules="rules" label-width="80px">
      <ElFormItem
        label="消息类型"
        prop="requestMessageType"
        v-if="msgType === MsgType.Message"
      >
        <ElSelect v-model="replyForm.requestMessageType" placeholder="请选择">
          <template
            v-for="dict in getDictOptions(DICT_TYPE.MP_MESSAGE_TYPE)"
            :key="dict.value"
          >
            <ElOption
              v-if="RequestMessageTypes.includes(dict.value as string)"
              :label="dict.label"
              :value="dict.value"
            />
          </template>
        </ElSelect>
      </ElFormItem>
      <ElFormItem
        label="匹配类型"
        prop="requestMatch"
        v-if="msgType === MsgType.Keyword"
      >
        <ElSelect
          v-model="replyForm.requestMatch"
          placeholder="请选择匹配类型"
          clearable
        >
          <ElOption
            v-for="dict in getDictOptions(
              DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH,
              'number',
            )"
            :key="String(dict.value)"
            :label="dict.label"
            :value="dict.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem
        label="关键词"
        prop="requestKeyword"
        v-if="msgType === MsgType.Keyword"
      >
        <ElInput
          v-model="replyForm.requestKeyword"
          placeholder="请输入内容"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="回复消息">
        <WxReplySelect v-model="reply" />
      </ElFormItem>
    </ElForm>
  </div>
</template>

<style scoped></style>
