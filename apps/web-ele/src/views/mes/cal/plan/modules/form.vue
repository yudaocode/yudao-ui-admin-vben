<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesCalPlanApi } from '#/api/mes/cal/plan';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MesCalPlanStatusEnum } from '@vben/constants';

import { ElButton, ElMessage, ElPopconfirm, ElTabPane, ElTabs } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { confirmPlan, createPlan, getPlan, updatePlan } from '#/api/mes/cal/plan';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import ShiftList from './shift-list.vue';
import PlanTeamList from './team-list.vue';


const emit = defineEmits(['success']);
const formType = ref<FormType>('create'); // 表单模式
const subTabsName = ref('shift'); // 当前资源页签
const formData = ref<MesCalPlanApi.Plan>();
const isDetail = computed(() => formType.value === 'detail'); // 是否查看模式
const canConfirm = computed(
  () => formType.value === 'update' && formData.value?.status === MesCalPlanStatusEnum.PREPARE,
); // 是否可确认计划
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['排班计划']);
  }
  return formType.value === 'update'
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
    ElMessage.success('确认成功');
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
      if (formType.value === 'create') {
        const id = await createPlan(data);
        formData.value = { ...data, id: id as number, status: MesCalPlanStatusEnum.PREPARE };
        await formApi.setFieldValue('id', id);
        formType.value = 'update';
      } else {
        await updatePlan(data);
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
    subTabsName.value = 'shift';
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
      formData.value = await getPlan(data.id);
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
    <ElTabs v-if="formType !== 'create' && formData?.id" v-model="subTabsName" class="mx-4 mt-4">
      <ElTabPane label="班次" name="shift">
        <ShiftList :form-type="formType" :plan-id="formData.id" />
      </ElTabPane>
      <ElTabPane label="班组" name="team">
        <PlanTeamList :form-type="formType" :plan-id="formData.id" />
      </ElTabPane>
    </ElTabs>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <ElPopconfirm
          v-if="canConfirm"
          title="确认该排班计划？确认后将不可修改或删除。"
          @confirm="handleConfirmPlan"
        >
          <template #reference>
            <ElButton type="primary">确认计划</ElButton>
          </template>
        </ElPopconfirm>
      </div>
    </template>
  </Modal>
</template>
