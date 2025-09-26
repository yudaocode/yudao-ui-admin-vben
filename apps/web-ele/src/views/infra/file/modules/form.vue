<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';
import { isEmpty } from '@vben/utils';

import { useVbenForm } from '#/adapter/form';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Modal, modalApi] = useVbenModal({
  showConfirmButton: false,
  showCancelButton: false,
});

const [Form] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
    hideLabel: true,
  },
  layout: 'horizontal',
  schema: useFormSchema().map((item) => ({ ...item, label: '' })), // 去除label
  showDefaultActions: false,
  handleValuesChange: (values) => {
    if (isEmpty(values)) {
      return;
    }
    // 上传成功关闭 modal
    modalApi.close();
    emit('success');
  },
});
</script>

<template>
  <Modal title="上传文件">
    <Form class="mx-4" />
  </Modal>
</template>
