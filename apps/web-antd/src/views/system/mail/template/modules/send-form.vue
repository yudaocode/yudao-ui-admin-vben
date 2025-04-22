<script lang="ts" setup>
import type { SystemMailTemplateApi } from '#/api/system/mail/template';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { sendMail } from '#/api/system/mail/template';

import { useSendMailFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemMailTemplateApi.SystemMailTemplate>();

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 构建发送请求
    const values = await formApi.getValues();
    const paramsObj: Record<string, string> = {};
    if (formData.value?.params) {
      formData.value.params.forEach((param: string) => {
        paramsObj[param] = values[`param_${param}`];
      });
    }
    const data: SystemMailTemplateApi.MailSendReqVO = {
      mail: values.mail,
      templateCode: formData.value?.code || '',
      templateParams: paramsObj,
    };

    // 提交表单
    try {
      await sendMail(data);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success({
        content: '邮件发送成功',
        key: 'action_process_msg',
      });
    } catch (error) {
      console.error('发送邮件失败', error);
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 获取数据
    const data = modalApi.getData<SystemMailTemplateApi.SystemMailTemplate>();
    if (!data) {
      return;
    }
    formData.value = data;
    // 更新 form schema
    const schema = buildFormSchema();
    formApi.setState({ schema });
    // 设置到 values
    await formApi.setValues({
      content: data.content,
    });
  },
});

/** 动态构建表单 schema */
const buildFormSchema = () => {
  const schema = useSendMailFormSchema();
  if (formData.value?.params) {
    formData.value.params?.forEach((param: string) => {
      schema.push({
        fieldName: `param_${param}`,
        label: `参数 ${param}`,
        component: 'Input',
        componentProps: {
          placeholder: `请输入参数 ${param}`,
        },
        rules: 'required',
      });
    });
  }
  return schema;
};
</script>

<template>
  <Modal title="测试发送邮件">
    <Form class="mx-4" />
  </Modal>
</template>
