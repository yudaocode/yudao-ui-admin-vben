<script lang="ts" setup>
import type { SystemRoleApi } from '#/api/system/role';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Button, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createRole, updateRole, getRole } from '#/api/system/role';
import { $t } from '#/locales';

import { useAssignDataPermissionFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemRoleApi.SystemRole>();

// TODO @待处理
import { getDeptList, type SystemDeptApi } from '#/api/system/dept';
import { handleTree } from '#/utils/tree';
import type { Recordable } from '@vben-core/typings';

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useAssignDataPermissionFormSchema(),
  showDefaultActions: false,
});

function resetForm() {
  formApi.resetForm();
  formApi.setValues(formData.value || {});
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const data = (await formApi.getValues()) as SystemRoleApi.SystemRole;
    try {
      await (formData.value?.id
        ? updateRole(data)
        : createRole(data));
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
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData<SystemRoleApi.SystemRole>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getRole(data.id as number);
      await formApi.setValues(formData.value);
      await loadPermissions();
    } finally {
      modalApi.lock(false);
    }
  },
});

// TODO 待处理
const permissions = ref<SystemDeptApi.SystemDept[]>([]);
const loadingPermissions = ref(false);

// TODO 待处理
async function loadPermissions() {
  loadingPermissions.value = true;
  try {
    debugger
    const res = await getDeptList();
    permissions.value = handleTree(res);
  } finally {
    loadingPermissions.value = false;
  }
}

// TODO 待处理
function getNodeClass(node: Recordable<any>) {
  const classes: string[] = [];
  if (node.value?.type === 'button') {
    classes.push('inline-flex');
    if (node.index % 3 >= 1) {
      classes.push('!pl-0');
    }
  }

  return classes.join(' ');
}
</script>

<template>
  <Modal title="数据权限">
    <Form class="mx-4">
      <template #dataScopeDeptIds="slotProps">
        <Spin :spinning="loadingPermissions" wrapper-class-name="w-full">
          <VbenTree
            :tree-data="permissions"
            multiple
            bordered
            :default-expanded-level="2"
            :get-node-class="getNodeClass"
            v-bind="slotProps"
            value-field="id"
            label-field="name"
          />
        </Spin>
      </template>
    </Form>
    <template #prepend-footer>
      <div class="flex-auto">
        <Button type="primary" danger @click="resetForm">
          {{ $t('common.reset') }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
<!-- TODO @芋艿：测试 -->
<style lang="css" scoped>
:deep(.ant-tree-title) {
  .tree-actions {
    display: none;
    margin-left: 20px;
  }
}

:deep(.ant-tree-title:hover) {
  .tree-actions {
    display: flex;
    flex: auto;
    justify-content: flex-end;
    margin-left: 20px;
  }
}
</style>