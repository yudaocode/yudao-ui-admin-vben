<script lang="ts" setup>
import type { FmsAccountSetApi } from '#/api/fms/config/account-set';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import {
  createAccountSet,
  getAccountSet,
  updateAccountSet,
} from '#/api/fms/config/account-set';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<FmsAccountSetApi.AccountSet>();
const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['账套'])
    : $t('ui.actionTitle.create', ['账套']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 112,
  },
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
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
    const values = await formApi.getValues();
    const data: FmsAccountSetApi.AccountSet = {
      id: formData.value?.id,
      companyCode: values.companyCode,
      companyName: values.companyName,
      companyProfile: values.companyProfile,
      industry: values.industry,
      location: values.location,
      legalRepresentative: values.legalRepresentative,
      legalRepresentativeIdNumber: values.legalRepresentativeIdNumber,
      businessLicenseNumber: values.businessLicenseNumber,
      organizationCode: values.organizationCode,
      remark: values.remark,
      contactName: values.contactName,
      officeTelephone: values.officeTelephone,
      mobile: values.mobile,
      faxNumber: values.faxNumber,
      qqNumber: values.qqNumber,
      email: values.email,
      otherContact: values.otherContact,
      address: values.address,
    };
    try {
      await (formData.value?.id
        ? updateAccountSet(data)
        : createAccountSet(data));
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    const data = modalApi.getData<FmsAccountSetApi.AccountSet>();
    if (!data?.id) {
      await formApi.setValues({
        companyCode: '',
        companyName: '',
        companyProfile: '',
        industry: '',
        location: '',
        legalRepresentative: '',
        legalRepresentativeIdNumber: '',
        businessLicenseNumber: '',
        organizationCode: '',
        remark: '',
        contactName: '',
        officeTelephone: '',
        mobile: '',
        faxNumber: '',
        qqNumber: '',
        email: '',
        otherContact: '',
        address: '',
      });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getAccountSet(data.id);
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[920px]">
    <Form class="mx-4" />
  </Modal>
</template>
