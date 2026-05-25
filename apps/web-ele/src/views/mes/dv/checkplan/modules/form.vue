<script lang="ts" setup>
import type { MesDvCheckPlanApi } from '#/api/mes/dv/checkplan';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage, ElTabPane, ElTabs } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { createCheckPlan, getCheckPlan, updateCheckPlan } from '#/api/mes/dv/checkplan';
import { $t } from '#/locales';
import { MesDvCheckPlanStatusEnum } from '#/views/mes/utils/constants';

import { useFormSchema } from '../data';
import MachineryList from './machinery-list.vue';
import SubjectList from './subject-list.vue';

type FormMode = 'create' | 'detail' | 'update';

const emit = defineEmits(['success']);
const formMode = ref<FormMode>('create');
const subTabsName = ref('machinery');
const formData = ref<MesDvCheckPlanApi.CheckPlan>();
const isDetail = computed(() => formMode.value === 'detail');
const getTitle = computed(() => {
  if (formMode.value === 'detail') {
    return '查看点检保养方案';
  }
  return formMode.value === 'update' ? '修改点检保养方案' : '新增点检保养方案';
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 110,
  },
  wrapperClass: 'grid-cols-3',
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

/** 表单 schema 需要 formApi 引用，所以通过 setState 设置 schema */
formApi.setState({ schema: useFormSchema(formApi) });

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
    const data = (await formApi.getValues()) as MesDvCheckPlanApi.CheckPlan;
    try {
      if (formMode.value === 'create') {
        const id = await createCheckPlan(data);
        formData.value = { ...data, id: id as number, status: MesDvCheckPlanStatusEnum.PREPARE };
        await formApi.setFieldValue('id', id);
        formMode.value = 'update';
      } else {
        await updateCheckPlan(data);
        formData.value = { ...formData.value, ...data };
      }
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
    await formApi.resetForm();
    subTabsName.value = 'machinery';
    // 加载数据
    const data = modalApi.getData<{ id?: number; type?: FormMode }>();
    formMode.value = data?.type || 'create';
    formApi.setDisabled(formMode.value === 'detail');
    modalApi.setState({ showConfirmButton: formMode.value !== 'detail' });
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getCheckPlan(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>
<template>
  <Modal :title="getTitle" class="w-4/5">
    <Form class="mx-4" />
    <ElTabs v-if="formMode !== 'create' && formData?.id" v-model="subTabsName" class="mx-4 mt-4">
      <ElTabPane label="设备" name="machinery">
        <MachineryList :form-type="formMode" :plan-id="formData.id" />
      </ElTabPane>
      <ElTabPane label="项目" name="subject">
        <SubjectList :form-type="formMode" :plan-id="formData.id" :plan-type="formData.type" />
      </ElTabPane>
    </ElTabs>
  </Modal>
</template>
