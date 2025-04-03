<script lang="ts" setup>
import type { SystemSmsTemplateApi } from '#/api/system/sms/smsTemplate';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { sendSms } from '#/api/system/sms/smsTemplate';
import { $t } from '#/locales';

import { useSendSmsFormSchema } from '../data';

const emit = defineEmits(['success']);
const templateData = ref<SystemSmsTemplateApi.SmsTemplateVO>();
const getTitle = computed(() => {
  return $t('ui.actionTitle.send', ['短信']);
});

// 动态构建表单
const buildSchema = () => {
  const schema = useSendSmsFormSchema();

  // 添加参数字段
  if (templateData.value?.params && templateData.value.params.length > 0) {
    templateData.value.params.forEach((param) => {
      schema.push({
        component: 'Input',
        fieldName: `param_${param}`,
        label: `参数 ${param}`,
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
    const data: SystemSmsTemplateApi.SendSmsReqVO = {
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
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    // 获取数据
    const data = modalApi.getData<SystemSmsTemplateApi.SmsTemplateVO>();
    if (!data) {
      return;
    }

    templateData.value = data;
    // 更新表单结构
    const schema = buildSchema();
    await formApi.updateSchema(schema);
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
