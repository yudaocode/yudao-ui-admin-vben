<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { assignUserRole, getUserRoleList } from '#/api/system/permission';
import { getSimpleRoleList } from '#/api/system/role';
import { $t } from '#/locales';

import { pruneSelectableIds, selectableIdSet } from '../../keep-selectable-ids';
import { useAssignRoleFormSchema } from '../data';

const emit = defineEmits(['success']);
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
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
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData() as SystemUserApi.User;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      const [roleIds, roles] = await Promise.all([
        getUserRoleList(data.id),
        getSimpleRoleList(),
      ]);
      const pruned = pruneSelectableIds(
        Array.isArray(roleIds) ? roleIds : [],
        selectableIdSet(roles),
      );
      if (pruned.changed) {
        message.warning('已去掉不存在或已停用的角色，请确认后保存');
      }
      await formApi.setValues({
        ...data,
        roleIds: pruned.kept,
      });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="分配角色">
    <Form class="mx-4" />
  </Modal>
</template>
