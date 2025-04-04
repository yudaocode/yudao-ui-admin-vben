<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';

import { $t } from '#/locales';
import { useVbenForm } from '#/adapter/form';
import { getUserRoleList, assignUserRole } from '#/api/system/permission';

import { useAssignRoleFormSchema } from '../data';

const emit = defineEmits(['success']);
const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useAssignRoleFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const values = await formApi.getValues();
    try {
      await assignUserRole({
        userId: values.id,
        roleIds: values.roleIds,
      });
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
        key: 'action_process_msg',
      });
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemUserApi.SystemUser>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      const roleIds = await getUserRoleList(data.id as number);
      // 设置到 values
      await formApi.setValues({
        ...data,
        roleIds,
      });
    } finally {
      modalApi.lock(false);
    }
  },
});
</script>

<template>
  <Modal title="分配角色">
    <Form class="mx-4" />
  </Modal>
</template>
