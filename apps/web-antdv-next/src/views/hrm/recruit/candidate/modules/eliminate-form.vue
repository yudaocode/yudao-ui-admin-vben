<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { eliminateRecruitCandidate } from '#/api/hrm/recruit/candidate';
import { $t } from '#/locales';
import { executeBatch } from '#/views/hrm/utils/batch';

import { useEliminateFormSchema } from '../data';

const emit = defineEmits(['success']);
const batchMode = ref(false);
const candidateIds = ref<number[]>([]);
const getTitle = computed(() =>
  batchMode.value ? '批量淘汰候选人' : '淘汰候选人',
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useEliminateFormSchema(),
  showDefaultActions: false,
});

/** 归一化淘汰原因（tags 模式可能是数组） */
function normalizeEliminate(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

const [Modal, modalApi] = useVbenModal({
  confirmText: '确认淘汰',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const values = await formApi.getValues();
    const eliminate = normalizeEliminate(values.eliminate);
    if (!eliminate) {
      message.warning('淘汰原因不能为空');
      modalApi.unlock();
      return;
    }
    try {
      if (batchMode.value) {
        const hasSuccess = await executeBatch(
          candidateIds.value.map((id) =>
            eliminateRecruitCandidate({
              id,
              eliminate,
              remark: values.remark,
            }),
          ),
        );
        if (!hasSuccess) {
          return;
        }
      } else {
        await eliminateRecruitCandidate({
          id: candidateIds.value[0]!,
          eliminate,
          remark: values.remark,
        });
        message.success($t('ui.actionMessage.operationSuccess'));
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
      batchMode.value = false;
      candidateIds.value = [];
      return;
    }
    // 加载数据
    const data = modalApi.getData<{
      ids: number | number[];
      name?: string;
    }>();
    if (!data) {
      return;
    }
    const isBatch = Array.isArray(data.ids);
    batchMode.value = isBatch;
    candidateIds.value = Array.isArray(data.ids) ? [...data.ids] : [data.ids];
    await formApi.setValues({
      candidateLabel: isBatch
        ? `已选择 ${candidateIds.value.length} 人`
        : (data.name ?? ''),
      eliminate: undefined,
      remark: '',
    });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[560px]">
    <Form class="mx-4" />
  </Modal>
</template>
