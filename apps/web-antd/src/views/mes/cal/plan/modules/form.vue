<script lang="ts" setup>
import type { MesCalPlanApi } from '#/api/mes/cal/plan';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message, Popconfirm, Tabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { confirmPlan, createPlan, getPlan, updatePlan } from '#/api/mes/cal/plan';
import { $t } from '#/locales';
import { MesCalPlanStatusEnum } from '#/views/mes/utils/constants';

import { useFormSchema } from '../data';
import ShiftList from './shift-list.vue';
import PlanTeamList from './team-list.vue';

const emit = defineEmits(['success']);
const formMode = ref<'create' | 'detail' | 'update'>('create'); // 表单模式
const subTabsName = ref('shift'); // 当前资源页签
const formData = ref<MesCalPlanApi.Plan>();
const isDetail = computed(() => formMode.value === 'detail'); // 是否查看模式
const canConfirm = computed(
  () => formMode.value === 'update' && formData.value?.status === MesCalPlanStatusEnum.PREPARE,
); // 是否可确认计划
const getTitle = computed(() => {
  if (formMode.value === 'detail') {
    return $t('ui.actionTitle.view', ['排班计划']);
  }
  return formMode.value === 'update'
    ? $t('ui.actionTitle.edit', ['排班计划'])
    : $t('ui.actionTitle.create', ['排班计划']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 100,
  },
  wrapperClass: 'grid-cols-3',
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

/** 表单 schema 需要 formApi 引用，所以通过 setState 设置 schema */
formApi.setState({ schema: useFormSchema(formApi) });

/** 确认排班计划 */
async function handleConfirmPlan() {
  const { valid } = await formApi.validate();
  if (!valid || !formData.value?.id) {
    return;
  }

  modalApi.lock();
  try {
    const data = (await formApi.getValues()) as MesCalPlanApi.Plan;
    await updatePlan(data);
    await confirmPlan(formData.value.id);
    await modalApi.close();
    emit('success');
    message.success('确认成功');
  } finally {
    modalApi.unlock();
  }
}

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
    const data = (await formApi.getValues()) as MesCalPlanApi.Plan;
    try {
      if (formMode.value === 'create') {
        const id = await createPlan(data);
        formData.value = { ...data, id: id as number, status: MesCalPlanStatusEnum.PREPARE };
        await formApi.setFieldValue('id', id);
        formMode.value = 'update';
      } else {
        await updatePlan(data);
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
    await formApi.resetForm();
    subTabsName.value = 'shift';
    const data = modalApi.getData<{ id?: number; type?: 'create' | 'detail' | 'update' }>();
    formMode.value = data?.type || 'create';
    formApi.setDisabled(formMode.value === 'detail');
    modalApi.setState({ showConfirmButton: formMode.value !== 'detail' });
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getPlan(data.id);
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
      v-if="formMode !== 'create' && formData?.id"
      v-model:active-key="subTabsName"
      class="mx-4 mt-4"
    >
      <Tabs.TabPane key="shift" tab="班次">
        <ShiftList :form-type="formMode" :plan-id="formData.id" />
      </Tabs.TabPane>
      <Tabs.TabPane key="team" tab="班组">
        <PlanTeamList :form-type="formMode" :plan-id="formData.id" />
      </Tabs.TabPane>
    </Tabs>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <Popconfirm
          v-if="canConfirm"
          title="确认该排班计划？确认后将不可修改或删除。"
          @confirm="handleConfirmPlan"
        >
          <Button type="primary">确认计划</Button>
        </Popconfirm>
      </div>
    </template>
  </Modal>
</template>
