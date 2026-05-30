<script lang="ts" setup>
import type { MesMdAutoCodePartApi } from '#/api/mes/md/autocode/part';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MesAutoCodePartTypeEnum } from '@vben/constants';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createAutoCodePart,
  getAutoCodePart,
  updateAutoCodePart,
} from '#/api/mes/md/autocode/part';
import { $t } from '#/locales';

import { usePartFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesMdAutoCodePartApi.AutoCodePart>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['规则分段'])
    : $t('ui.actionTitle.create', ['规则分段']);
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
  schema: usePartFormSchema(),
  showDefaultActions: false,
});

/** 清理当前分段类型不需要的字段 */
function normalizePartData(data: MesMdAutoCodePartApi.AutoCodePart) {
  if (data.type !== MesAutoCodePartTypeEnum.DATE) {
    data.dateFormat = undefined;
  }
  if (data.type !== MesAutoCodePartTypeEnum.FIX) {
    data.fixCharacter = undefined;
  }
  if (data.type !== MesAutoCodePartTypeEnum.SERIAL) {
    data.serialStartNo = undefined;
    data.serialStep = undefined;
    data.cycleFlag = false;
    data.cycleMethod = undefined;
  } else if (!data.cycleFlag) {
    data.cycleMethod = undefined;
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
    const data = normalizePartData(
      (await formApi.getValues()) as MesMdAutoCodePartApi.AutoCodePart,
    );
    try {
      await (formData.value?.id
        ? updateAutoCodePart(data)
        : createAutoCodePart(data));
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
    const data = modalApi.getData<{
      id?: number;
      maxSort?: number;
      ruleId: number;
    }>();
    if (!data?.id) {
      await formApi.setValues({
        ruleId: data.ruleId,
        sort: (data.maxSort || 0) + 1,
      });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getAutoCodePart(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/3">
    <Form class="mx-4" />
  </Modal>
</template>
