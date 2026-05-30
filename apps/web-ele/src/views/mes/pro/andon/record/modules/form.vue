<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesProAndonRecordApi } from '#/api/mes/pro/andon/record';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MesProAndonStatusEnum } from '@vben/constants';
import { useUserStore } from '@vben/stores';

import { ElButton, ElMessage, ElPopconfirm } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createAndonRecord,
  getAndonRecord,
  updateAndonRecord,
} from '#/api/mes/pro/andon/record';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create'); // 表单模式：新增 / 处置 / 详情
const formData = ref<MesProAndonRecordApi.AndonRecord>();
const userStore = useUserStore();

const isUpdate = computed(() => formType.value === 'update'); // 是否处置模式
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['安灯呼叫']);
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['安灯呼叫'])
    : $t('ui.actionTitle.create', ['安灯呼叫']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

/** 处置：保存（保持 ACTIVE 状态） */
async function handleSave() {
  modalApi.lock();
  try {
    const values =
      (await formApi.getValues()) as MesProAndonRecordApi.AndonRecord;
    await updateAndonRecord({
      handlerUserId: values.handlerUserId,
      handleTime: values.handleTime,
      id: formData.value?.id,
      remark: values.remark,
      status: MesProAndonStatusEnum.ACTIVE,
    });
    await modalApi.close();
    emit('success');
    ElMessage.success('保存成功');
  } finally {
    modalApi.unlock();
  }
}

/** 处置：标记已处置（状态变为 HANDLED） */
async function handleFinish() {
  const values =
    (await formApi.getValues()) as MesProAndonRecordApi.AndonRecord;
  if (!values.handleTime) {
    ElMessage.warning('标记已处置时，处置时间不能为空');
    return;
  }
  if (!values.handlerUserId) {
    ElMessage.warning('标记已处置时，处置人不能为空');
    return;
  }
  modalApi.lock();
  try {
    await updateAndonRecord({
      handlerUserId: values.handlerUserId,
      handleTime: values.handleTime,
      id: formData.value?.id,
      remark: values.remark,
      status: MesProAndonStatusEnum.HANDLED,
    });
    await modalApi.close();
    emit('success');
    ElMessage.success('处置成功');
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (formType.value === 'detail') {
      await modalApi.close();
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data =
      (await formApi.getValues()) as MesProAndonRecordApi.AndonRecord;
    try {
      await createAndonRecord(data);
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
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(formType.value, formApi) });
    modalApi.setState({ showConfirmButton: formType.value === 'create' });
    if (formType.value === 'create') {
      // 新增时，发起人默认为当前用户
      await formApi.setValues({ userId: userStore.userInfo?.id });
      return;
    }
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getAndonRecord(data.id);
      const initial: MesProAndonRecordApi.AndonRecord = { ...formData.value };
      // 处置模式下，默认填充处置时间和处置人，方便快速保存
      if (isUpdate.value) {
        if (!initial.handleTime) {
          initial.handleTime = Date.now();
        }
        if (!initial.handlerUserId) {
          initial.handlerUserId = userStore.userInfo?.id;
        }
      }
      // 设置到 values
      await formApi.setValues(initial);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/2">
    <Form class="mx-4" />
    <template #prepend-footer>
      <div v-if="isUpdate" class="flex flex-auto items-center justify-end gap-2">
        <ElPopconfirm title="确认保存当前处置进度？" @confirm="handleSave">
          <template #reference>
            <ElButton type="primary">保存</ElButton>
          </template>
        </ElPopconfirm>
        <ElPopconfirm title="确认标记为已处置？" @confirm="handleFinish">
          <template #reference>
            <ElButton type="success">已处置</ElButton>
          </template>
        </ElPopconfirm>
      </div>
    </template>
  </Modal>
</template>
