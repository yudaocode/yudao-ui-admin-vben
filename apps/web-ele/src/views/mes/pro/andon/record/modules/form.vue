<script lang="ts" setup>
import type { MesProAndonConfigApi } from '#/api/mes/pro/andon/config';
import type { MesProAndonRecordApi } from '#/api/mes/pro/andon/record';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';
import { formatDate } from '@vben/utils';

import { ElButton, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createAndonRecord,
  getAndonRecord,
  updateAndonRecord,
} from '#/api/mes/pro/andon/record';
import { $t } from '#/locales';
import { MesProAndonStatusEnum } from '#/views/mes/utils/constants';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formType = ref<'create' | 'detail' | 'update'>('create');
const formData = ref<MesProAndonRecordApi.AndonRecord>({});
const userStore = useUserStore();

const dialogTitle = computed(() => {
  switch (formType.value) {
    case 'create': {
      return '新增安灯呼叫';
    }
    case 'detail': {
      return '安灯呼叫详情';
    }
    case 'update': {
      return '处置安灯呼叫';
    }
    default: {
      return '安灯呼叫';
    }
  }
});

/** 选择呼叫原因后自动填充级别 */
function handleConfigChange(config: MesProAndonConfigApi.AndonConfig | undefined) {
  if (!config) {
    formApi.setValues({ level: undefined, reason: undefined });
    return;
  }
  formApi.setValues({ level: config.level, reason: config.reason });
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-2',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useFormSchema('create', handleConfigChange),
  showDefaultActions: false,
});

/** 提交：新增 */
async function handleCreate() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  modalApi.lock();
  try {
    const data =
      (await formApi.getValues()) as MesProAndonRecordApi.AndonRecord;
    await createAndonRecord(data);
    await modalApi.close();
    emit('success');
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
  } finally {
    modalApi.unlock();
  }
}

/** 处置：保存（保持 ACTIVE） */
async function handleSave() {
  modalApi.lock();
  try {
    const values =
      (await formApi.getValues()) as MesProAndonRecordApi.AndonRecord;
    await updateAndonRecord({
      handlerUserId: values.handlerUserId,
      handleTime: values.handleTime,
      id: formData.value.id,
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

/** 处置：标记已处置 */
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
      id: formData.value.id,
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
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = {};
      return;
    }
    const data = modalApi.getData<{
      id?: number;
      type: 'create' | 'detail' | 'update';
    }>();
    if (!data) {
      return;
    }
    formType.value = data.type;
    formApi.setState({ schema: useFormSchema(data.type, handleConfigChange) });
    await formApi.resetForm();

    if (data.type === 'create') {
      const currentUserId = userStore.userInfo?.id;
      formData.value = { userId: currentUserId };
      await formApi.setValues({ userId: currentUserId });
      return;
    }
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getAndonRecord(data.id);
      const initial: MesProAndonRecordApi.AndonRecord = { ...formData.value };
      if (data.type === 'update') {
        if (!initial.handleTime) {
          initial.handleTime = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss');
        }
        if (!initial.handlerUserId) {
          initial.handlerUserId = userStore.userInfo?.id;
        }
      }
      await formApi.setValues(initial);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="dialogTitle" class="w-1/2">
    <Form />
    <template #footer>
      <template v-if="formType === 'create'">
        <ElButton @click="modalApi.close()">取消</ElButton>
        <ElButton type="primary" @click="handleCreate">确定</ElButton>
      </template>
      <template v-else-if="formType === 'update'">
        <ElButton @click="modalApi.close()">关闭</ElButton>
        <ElButton type="primary" @click="handleSave">保存</ElButton>
        <ElButton type="success" @click="handleFinish">已处置</ElButton>
      </template>
      <template v-else>
        <ElButton @click="modalApi.close()">关闭</ElButton>
      </template>
    </template>
  </Modal>
</template>
