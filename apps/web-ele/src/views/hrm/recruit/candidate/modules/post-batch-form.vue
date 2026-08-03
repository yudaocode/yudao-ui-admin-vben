<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { updateRecruitCandidatePost } from '#/api/hrm/recruit/candidate';
import { executeBatch } from '#/views/hrm/utils/batch';

import { usePostBatchFormSchema } from '../data';

const emit = defineEmits(['success']);
const candidateIds = ref<number[]>([]);
const getTitle = computed(() => '批量修改应聘职位');

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: usePostBatchFormSchema(),
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
    const values = await formApi.getValues();
    try {
      const hasSuccess = await executeBatch(
        candidateIds.value.map((id) =>
          updateRecruitCandidatePost({ id, postId: values.postId }),
        ),
      );
      if (!hasSuccess) {
        return;
      }
      // 关闭并提示
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      candidateIds.value = [];
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ ids: number[] }>();
    if (!data) {
      return;
    }
    candidateIds.value = [...data.ids];
    await formApi.setValues({
      candidateCount: `${candidateIds.value.length} 人`,
      postId: undefined,
    });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
