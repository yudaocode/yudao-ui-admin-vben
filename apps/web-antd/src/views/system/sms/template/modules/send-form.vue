<script lang="ts" setup>
import type { SystemSmsTemplateApi } from '#/api/system/sms/template';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { sendSms } from '#/api/system/sms/template';

import { useSendSmsFormSchema } from '../data';

const emit = defineEmits(['success']);
const templateData = ref<SystemSmsTemplateApi.SmsTemplate>();

// 动态构建表单
const buildSchema = () => {
  const schema = useSendSmsFormSchema();

  // 添加参数字段
  if (templateData.value?.params && templateData.value.params.length > 0) {
    templateData.value.params.forEach((param) => {
      schema.push({
        fieldName: `param_${param}`,
        label: `参数 ${param}`,
        component: 'Input',
        componentProps: {
          placeholder: '请输入',
        },
        rules: 'required',
      });
    });
  }

  return schema;
};

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: buildSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 获取表单数据
    const values = await formApi.getValues();

    // 提取参数
    const paramsObj: Record<string, string> = {};
    if (templateData.value?.params) {
      templateData.value.params.forEach((param) => {
        paramsObj[param] = values[`param_${param}`];
      });
    }

    // 构建发送短信请求
    const data: SystemSmsTemplateApi.SmsSendReq = {
      mobile: values.mobile,
      templateCode: templateData.value?.code || '',
      templateParams: paramsObj,
    };

    try {
      await sendSms(data);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success({
        content: '短信发送成功',
        key: 'action_process_msg',
      });
    } catch (error) {
      console.error('发送短信失败', error);
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 获取数据
    const data = modalApi.getData<SystemSmsTemplateApi.SmsTemplate>();
    if (!data) {
      return;
    }

    templateData.value = data;
    // 更新表单结构
    const schema = buildSchema();
    formApi.setState({ schema });

    // 设置表单初始值，包括模板内容
    await formApi.setValues({
      content: data.content,
    });
  },
});
</script>

<template>
  <Modal title="发送短信">
    <Form class="mx-4" />
  </Modal>
</template>
