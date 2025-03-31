<script lang="ts" setup>
import type { SystemRoleApi } from '#/api/system/role';
import type { SystemDeptApi } from '#/api/system/dept';

import { VbenTree } from '@vben/common-ui';
import { useVbenModal } from '@vben/common-ui';
import { Button, message } from 'ant-design-vue';

import { ref } from 'vue';
import { $t } from '#/locales';
import { useVbenForm } from '#/adapter/form';
import { getRole } from '#/api/system/role';
import { assignRoleDataScope} from '#/api/system/permission';
import { getDeptList } from '#/api/system/dept';
import { handleTree } from '#/utils/tree';

import { useAssignDataPermissionFormSchema } from '../data';
import { SystemDataScopeEnum } from '#/utils/constants';

const emit = defineEmits(['success']);
const formData = ref<SystemRoleApi.SystemRole>();

const deptTree = ref<SystemDeptApi.SystemDept[]>([]); // 部门树
const deptLoading = ref(false); // 加载部门列表

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
    const data = await formApi.getValues();
    try {
      await assignRoleDataScope({
        roleId: data.id,
        dataScope: data.dataScope,
        dataScopeDeptIds: data.dataScope === SystemDataScopeEnum.DEPT_CUSTOM ? data.dataScopeDeptIds : undefined,
      });
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
      // 加载部门列表
      await loadDeptTree();
    } finally {
      modalApi.lock(false);
    }
  },
});

/** 加载部门树 */
async function loadDeptTree() {
  deptLoading.value = true;
  try {
    const res = await getDeptList();
    deptTree.value = handleTree(res);
  } finally {
    deptLoading.value = false;
  }
}
</script>

<template>
  <Modal title="数据权限">
    <Form class="mx-4">
      <template #dataScopeDeptIds="slotProps">
        <Spin :spinning="deptLoading" class="w-full">
          <VbenTree
            :tree-data="deptTree"
            multiple
            bordered
            :default-expanded-level="2"
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
