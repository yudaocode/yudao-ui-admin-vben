<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesCalTeamApi } from '#/api/mes/cal/team';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage, ElTabPane, ElTabs } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { createTeam, getTeam, updateTeam } from '#/api/mes/cal/team';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import MemberList from './member-list.vue';


const emit = defineEmits(['success']);
const formType = ref<FormType>('create'); // 表单模式
const subTabsName = ref('member'); // 当前资源页签
const formData = ref<MesCalTeamApi.Team>();
const isDetail = computed(() => formType.value === 'detail'); // 是否查看模式
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['班组']);
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['班组'])
    : $t('ui.actionTitle.create', ['班组']);
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
    const data = (await formApi.getValues()) as MesCalTeamApi.Team;
    try {
      if (formType.value === 'create') {
        const id = await createTeam(data);
        formData.value = { ...data, id: id as number };
        await formApi.setFieldValue('id', id);
        formType.value = 'update';
      } else {
        await updateTeam(data);
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
    subTabsName.value = 'member';
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
      formData.value = await getTeam(data.id);
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
      <ElTabPane label="班组成员" name="member">
        <MemberList :form-type="formType" :team-id="formData.id" />
      </ElTabPane>
    </ElTabs>
  </Modal>
</template>
