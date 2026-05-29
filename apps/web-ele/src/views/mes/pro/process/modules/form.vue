<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesProProcessApi } from '#/api/mes/pro/process';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElDivider, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createProcess,
  getProcess,
  updateProcess,
} from '#/api/mes/pro/process';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import ContentList from './content-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create'); // 表单模式
const formData = ref<MesProProcessApi.Process>();

const isDetail = computed(() => formType.value === 'detail'); // 是否查看模式
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.detail', ['生产工序']);
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['生产工序'])
    : $t('ui.actionTitle.create', ['生产工序']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-3',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-3',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (isDetail.value) {
      await modalApi.close();
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MesProProcessApi.Process;
    try {
      await (formData.value?.id ? updateProcess(data) : createProcess(data));
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
    formApi.setState({ schema: useFormSchema(formApi) });
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getProcess(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});

/** 用于工序内容子表的工序编号 */
const processId = computed(() => formData.value?.id);
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
    <!-- 编辑/详情模式下展示工序操作步骤子表，新增模式下隐藏 -->
    <template v-if="processId">
      <ElDivider class="!my-3" content-position="left">操作步骤</ElDivider>
      <div class="mx-4">
        <ContentList :form-type="formType" :process-id="processId" />
      </div>
    </template>
  </Modal>
</template>
