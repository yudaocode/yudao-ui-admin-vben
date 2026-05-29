<script lang="ts" setup>
import type { MesMdAutoCodeRuleApi } from '#/api/mes/md/autocode/rule';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createAutoCodeRule,
  getAutoCodeRule,
  updateAutoCodeRule,
} from '#/api/mes/md/autocode/rule';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import PartList from './part-list.vue';

const emit = defineEmits(['success']);
const formData = ref<MesMdAutoCodeRuleApi.AutoCodeRule>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['编码规则'])
    : $t('ui.actionTitle.create', ['编码规则']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

/** 清理未启用补齐时的补齐字段 */
function normalizeRuleData(data: MesMdAutoCodeRuleApi.AutoCodeRule) {
  if (!data.padded) {
    data.paddedChar = undefined;
    data.paddedMethod = undefined;
  }
  return data;
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = normalizeRuleData(
      (await formApi.getValues()) as MesMdAutoCodeRuleApi.AutoCodeRule,
    );
    try {
      await (formData.value?.id
        ? updateAutoCodeRule(data)
        : createAutoCodeRule(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
    const data = modalApi.getData<MesMdAutoCodeRuleApi.AutoCodeRule>();
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getAutoCodeRule(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
    <template v-if="formData?.id">
      <div class="mx-4 mt-4">
        <PartList :rule-id="formData.id" />
      </div>
    </template>
  </Modal>
</template>
