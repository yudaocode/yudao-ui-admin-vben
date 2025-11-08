<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { Reply } from '#/views/mp/modules/wx-reply';

import { computed, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Form, FormItem, Input, Select, SelectOption } from 'ant-design-vue';

import { WxReplySelect } from '#/views/mp/modules/wx-reply';

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

const formRef = ref(); // 表单 ref

const RequestMessageTypes = [
  'text',
  'image',
  'voice',
  'video',
  'shortvideo',
  'location',
  'link',
]; // 允许选择的请求消息类型

// 表单校验规则
const rules = {
  requestKeyword: [
    { required: true, message: '请求的关键字不能为空', trigger: 'blur' },
  ] as Rule[],
  requestMatch: [
    { required: true, message: '请求的关键字的匹配不能为空', trigger: 'blur' },
  ] as Rule[],
} as Record<string, Rule[]>;

defineExpose({
  resetFields: () => formRef.value?.resetFields(),
  validate: async () => {
    await formRef.value?.validate();
  },
});
</script>

<template>
  <div>
    <Form
      ref="formRef"
      :model="replyForm"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
    >
      <FormItem
        label="消息类型"
        name="requestMessageType"
        v-if="msgType === MsgType.Message"
      >
        <Select
          v-model:value="replyForm.requestMessageType"
          placeholder="请选择"
        >
          <SelectOption
            v-for="dict in getDictOptions(DICT_TYPE.MP_MESSAGE_TYPE).filter(
              (d) => RequestMessageTypes.includes(d.value as string),
            )"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </SelectOption>
        </Select>
      </FormItem>
      <FormItem
        label="匹配类型"
        name="requestMatch"
        v-if="msgType === MsgType.Keyword"
      >
        <Select
          v-model:value="replyForm.requestMatch"
          placeholder="请选择匹配类型"
          allow-clear
        >
          <SelectOption
            v-for="dict in getDictOptions(
              DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH,
              'number',
            )"
            :key="String(dict.value)"
            :value="dict.value"
          >
            {{ dict.label }}
          </SelectOption>
        </Select>
      </FormItem>
      <FormItem
        label="关键词"
        name="requestKeyword"
        v-if="msgType === MsgType.Keyword"
      >
        <Input
          v-model:value="replyForm.requestKeyword"
          placeholder="请输入内容"
          allow-clear
        />
      </FormItem>
      <FormItem label="回复消息">
        <WxReplySelect v-model="reply" />
      </FormItem>
    </Form>
  </div>
</template>

<style scoped></style>
