<script lang="ts" setup>
import type { SystemNotifyTemplateApi } from '#/api/system/notify/template';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';

import { computed, ref } from 'vue';
import { useVbenForm } from '#/adapter/form';
import { sendNotify } from '#/api/system/notify/template';
import { $t } from '#/locales';

import { useSendNotifyFormSchema } from '../data';

const emit = defineEmits(['success']);
const templateData = ref<SystemNotifyTemplateApi.NotifyTemplate>();
const getTitle = computed(() => {
  return $t('ui.actionTitle.send', ['站内信']);
});

// 动态构建表单
const buildSchema = () => {
  const schema = useSendNotifyFormSchema();

  // 添加参数字段
  if (templateData.value?.params) {
    templateData.value.params.forEach((param) => {
      schema.push({
        fieldName: `param_${param}`,
        label: `参数 ${param}`,
        component: 'Input',
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
  commonConfig: {
    labelWidth: 120,
  },
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

    // 构建发送站内信请求
    const data: SystemNotifyTemplateApi.NotifySendReq = {
      userId: values.userId,
      templateCode: templateData.value?.code || '',
      templateParams: paramsObj,
    };

    try {
      await sendNotify(data);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
        key: 'action_process_msg',
      });
    } catch (error) {
      console.error('发送站内信失败', error);
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 获取数据
    const data = modalApi.getData<SystemNotifyTemplateApi.NotifyTemplate>();
    if (!data || !data.id) {
      return;
    }

    templateData.value = data;
    // 更新表单结构
    const schema = buildSchema();
    formApi.setState({ schema });

    // 设置表单初始值
    await formApi.setValues({
      content: data.content,
      templateCode: data.code,
    });
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
