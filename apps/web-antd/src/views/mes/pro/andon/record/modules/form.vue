<script lang="ts" setup>
import type { MesProAndonConfigApi } from '#/api/mes/pro/andon/config';
import type { MesProAndonRecordApi } from '#/api/mes/pro/andon/record';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { Button, message } from 'ant-design-vue';

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
const formType = ref<'create' | 'detail' | 'update'>('create'); // 表单当前模式：新增 / 处置 / 详情
const formData = ref<MesProAndonRecordApi.AndonRecord>();
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
    message.success($t('ui.actionMessage.operationSuccess'));
  } finally {
    modalApi.unlock();
  }
}

/** 处置：保存（保持 ACTIVE） */
// TODO @AI：这里写下注释；
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
    message.success('保存成功');
  } finally {
    modalApi.unlock();
  }
}

/** 处置：标记已处置 */
// TODO @AI：这里写下注释；
async function handleFinish() {
  const values =
    (await formApi.getValues()) as MesProAndonRecordApi.AndonRecord;
  if (!values.handleTime) {
    message.warning('标记已处置时，处置时间不能为空');
    return;
  }
  if (!values.handlerUserId) {
    message.warning('标记已处置时，处置人不能为空');
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
    message.success('处置成功');
  } finally {
    modalApi.unlock();
  }
}

// TODO @AI：这里的代码风格？！！
const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
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
    // 重新挂载 schema，以便按 type 切换字段表现
    formApi.setState({ schema: useFormSchema(data.type, handleConfigChange) });
    await formApi.resetForm();

    if (data.type === 'create') {
      // 新增时默认填发起人为当前用户
      const currentUserId = userStore.userInfo?.id;
      formData.value = { userId: currentUserId };
      await formApi.setValues({ userId: currentUserId });
      return;
    }
    // 处置 / 详情：加载详情
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getAndonRecord(data.id);
      const initial: MesProAndonRecordApi.AndonRecord = { ...formData.value };
      // 处置模式下，默认填充处置时间和处置人，方便快速保存
      if (data.type === 'update') {
        if (!initial.handleTime) {
          initial.handleTime = Date.now();
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
        <Button @click="modalApi.close()">取消</Button>
        <Button type="primary" @click="handleCreate">确定</Button>
      </template>
      <template v-else-if="formType === 'update'">
        <Button @click="modalApi.close()">关闭</Button>
        <Button type="primary" @click="handleSave">保存</Button>
        <Button type="primary" danger @click="handleFinish">已处置</Button>
      </template>
      <template v-else>
        <Button @click="modalApi.close()">关闭</Button>
      </template>
    </template>
  </Modal>
</template>
