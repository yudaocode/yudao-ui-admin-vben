<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getServiceAreaSimpleList } from '#/api/mpr/serviceArea';
import { updateUserServiceArea } from '#/api/system/user/profile';

defineOptions({
  name: 'FormModelServiceArea',
});

const [Form, formApi] = useVbenForm({
  handleSubmit: onSubmit,
  schema: [
    {
      fieldName: 'address',
      label: '您的地址',
      component: 'Input',
      componentProps: {
        placeholder: '请输入地址',
      },
      rules: 'required',
    },
    {
      fieldName: 'serviceAreaId',
      component: 'ApiSelect',
      componentProps: {
        api: getServiceAreaSimpleList,
        labelField: 'city',
        valueField: 'id',
        placeholder: '请选择地区',
      },
      label: '服务地区',
      rules: 'required',
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    await formApi.validateAndSubmitForm();
    // modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const values = modalApi.getData<Record<string, any>>();
      if (values) {
        formApi.setValues(values);
      }
    }
  },
  title: '设置服务区域',
});

async function onSubmit(_values: Record<string, any>) {
  const loading = message.loading({
    content: '正在提交中...',
    duration: 0,
    key: 'is-form-submitting',
  });
  modalApi.lock();
  try {
    const data = await formApi.getValues();
    await updateUserServiceArea(data.serviceAreaId);
    message.success($t('common.success'));
    loading();
    await modalApi.close();
  } finally {
    modalApi.unlock();
  }
}
</script>
<template>
  <Modal>
    <Form />
  </Modal>
</template>
