<script lang="ts" setup>
import type { HrmRecruitCandidateApi } from '#/api/hrm/recruit/candidate';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import {
  createRecruitCandidate,
  getRecruitCandidate,
  updateRecruitCandidate,
} from '#/api/hrm/recruit/candidate';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<HrmRecruitCandidateApi.RecruitCandidate>();
const getTitle = computed(() =>
  formData.value?.id ? '编辑候选人' : '新建候选人',
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 110,
  },
  wrapperClass: 'grid-cols-2',
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
      (await formApi.getValues()) as HrmRecruitCandidateApi.RecruitCandidate;
    data.resumeUrls ??= [];
    try {
      await (formData.value?.id
        ? updateRecruitCandidate(data)
        : createRecruitCandidate(data));
      // 关闭并提示
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
    // 加载数据
    const data = modalApi.getData<HrmRecruitCandidateApi.RecruitCandidate>();
    if (!data?.id) {
      await formApi.setValues({ resumeUrls: [], sex: 1 });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getRecruitCandidate(data.id);
      formData.value.resumeUrls ??= [];
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
