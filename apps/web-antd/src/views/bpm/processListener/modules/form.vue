<script lang="ts" setup>
import type { BpmProcessListenerApi } from '#/api/bpm/processListener';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createProcessListener,
  getProcessListener,
  updateProcessListener,
} from '#/api/bpm/processListener';
import { $t } from '#/locales';

import { EVENT_EXECUTION_OPTIONS, EVENT_OPTIONS, useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<BpmProcessListenerApi.ProcessListenerVO>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['流程监听器'])
    : $t('ui.actionTitle.create', ['流程监听器']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 110,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data =
      (await formApi.getValues()) as BpmProcessListenerApi.ProcessListenerVO;
    try {
      await (formData.value?.id
        ? updateProcessListener(data)
        : createProcessListener(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
      });
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }

    // 设置事件
    formApi.updateSchema([
      {
        fieldName: 'type',
        componentProps: {
          onChange: (value: string) => {
            formApi.setFieldValue('event', undefined);
            formApi.updateSchema([
              {
                fieldName: 'event',
                componentProps: {
                  options:
                    value === 'execution'
                      ? EVENT_EXECUTION_OPTIONS
                      : EVENT_OPTIONS,
                },
              },
            ]);
          },
        },
      },

      {
        fieldName: 'valueType',
        componentProps: {
          onChange: (value: string) => {
            formApi.setFieldValue('value', undefined);
            formApi.updateSchema([
              {
                fieldName: 'value',
                label: value === 'class' ? '类路径' : '表达式',
                componentProps: {
                  placeholder:
                    value === 'class' ? '请输入类路径' : '请输入表达式',
                },
              },
            ]);
          },
        },
      },
    ]);

    // 加载数据
    const data = modalApi.getData<BpmProcessListenerApi.ProcessListenerVO>();
    if (!data || !data.id) {
      return;
    }

    modalApi.lock();
    try {
      formData.value = await getProcessListener(data.id as number);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[600px]">
    <Form class="mx-4" />
  </Modal>
</template>
