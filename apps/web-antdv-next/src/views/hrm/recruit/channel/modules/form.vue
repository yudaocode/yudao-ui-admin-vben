<script lang="ts" setup>
import type { HrmRecruitChannelApi } from '#/api/hrm/recruit/channel';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import {
  createRecruitChannel,
  getRecruitChannel,
  updateRecruitChannel,
} from '#/api/hrm/recruit/channel';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<HrmRecruitChannelApi.RecruitChannel>();
const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['招聘渠道'])
    : $t('ui.actionTitle.create', ['招聘渠道']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 92,
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
    const values = await formApi.getValues();
    const data: HrmRecruitChannelApi.RecruitChannel = {
      id: values.id,
      name: values.name,
      sort: values.sort,
      remark: values.remark,
    };
    try {
      await (formData.value?.id
        ? updateRecruitChannel(data)
        : createRecruitChannel(data));
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
    const data = modalApi.getData<HrmRecruitChannelApi.RecruitChannel>();
    if (!data?.id) {
      await formApi.setValues({
        name: '',
        sort: 0,
        remark: '',
        systemFlag: false,
      });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getRecruitChannel(data.id);
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[620px]">
    <Form class="mx-4" />
  </Modal>
</template>
