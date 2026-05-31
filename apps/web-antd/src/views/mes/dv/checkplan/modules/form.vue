<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesDvCheckPlanApi } from '#/api/mes/dv/checkplan';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MesDvCheckPlanStatusEnum } from '@vben/constants';

import { message, Tabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createCheckPlan, getCheckPlan, updateCheckPlan } from '#/api/mes/dv/checkplan';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import MachineryList from './machinery-list.vue';
import SubjectList from './subject-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const subTabsName = ref('machinery');
const formData = ref<MesDvCheckPlanApi.CheckPlan>();
const isDetail = computed(() => formType.value === 'detail');
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return '查看点检保养方案';
  }
  return formType.value === 'update' ? '修改点检保养方案' : '新增点检保养方案';
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
      if (formType.value === 'create') {
        const id = await createCheckPlan(data);
        formData.value = { ...data, id: id as number, status: MesDvCheckPlanStatusEnum.PREPARE };
        await formApi.setFieldValue('id', id);
        formType.value = 'update';
      } else {
        await updateCheckPlan(data);
        formData.value = { ...formData.value, ...data };
      }
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
    subTabsName.value = 'machinery';
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(data.formType, formApi) });
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
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
    <Tabs
      v-if="formType !== 'create' && formData?.id"
      v-model:active-key="subTabsName"
      class="mx-4 mt-4"
    >
      <Tabs.TabPane key="machinery" tab="设备">
        <MachineryList :form-type="formType" :plan-id="formData.id" />
      </Tabs.TabPane>
      <Tabs.TabPane key="subject" tab="项目">
        <SubjectList :form-type="formType" :plan-id="formData.id" :plan-type="formData.type" />
      </Tabs.TabPane>
    </Tabs>
  </Modal>
</template>
