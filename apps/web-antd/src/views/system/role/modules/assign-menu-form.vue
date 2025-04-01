<script lang="ts" setup>
import type { SystemRoleApi } from '#/api/system/role';
import type { SystemDeptApi } from '#/api/system/dept';

import { VbenTree } from '@vben/common-ui';
import { useVbenModal } from '@vben/common-ui';
import { message, Checkbox } from 'ant-design-vue';

import { ref } from 'vue';
import { $t } from '#/locales';
import { useVbenForm } from '#/adapter/form';
import { assignRoleMenu, getRoleMenuList } from '#/api/system/permission';
import { getMenuList } from '#/api/system/menu';
import { handleTree } from '#/utils/tree';

import { useAssignMenuFormSchema } from '../data';

const emit = defineEmits(['success']);

const menuTree = ref<SystemDeptApi.SystemDept[]>([]); // 菜单树
const menuLoading = ref(false); // 加载菜单列表
const isAllSelected = ref(false); // 全选状态
const isExpanded = ref(false); // 展开状态
const expandedKeys = ref<number[]>([]); // 展开的节点

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useAssignMenuFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const data = await formApi.getValues();
    try {
      await assignRoleMenu({
        roleId: data.id,
        menuIds: data.menuIds
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
      await formApi.setValues(data);
      // 加载角色菜单
      const menuIds = await getRoleMenuList(data.id as number);
      await formApi.setFieldValue('menuIds', menuIds);
      // 加载菜单列表
      await loadMenuTree();
    } finally {
      modalApi.lock(false);
    }
  },
});

/** 加载菜单树 */
async function loadMenuTree() {
  menuLoading.value = true;
  try {
    const data = await getMenuList();
    menuTree.value = handleTree(data);
  } finally {
    menuLoading.value = false;
  }
}

/** 全选/全不选 */
function toggleSelectAll() {
  isAllSelected.value = !isAllSelected.value;
  if (isAllSelected.value) {
    const allIds = getAllNodeIds(menuTree.value);
    formApi.setFieldValue('menuIds', allIds);
  } else {
    formApi.setFieldValue('menuIds', []);
  }
}

/** 展开/折叠所有节点 */
function toggleExpandAll() {
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value) {
    // 获取所有节点的 ID
    expandedKeys.value = getAllNodeIds(menuTree.value);
  } else {
    expandedKeys.value = [];
  }
}

/** 递归获取所有节点 ID */
function getAllNodeIds(nodes: any[], ids: number[] = []): number[] {
  nodes.forEach((node: any) => {
    ids.push(node.id);
    if (node.children && node.children.length > 0) {
      getAllNodeIds(node.children, ids);
    }
  });
  return ids;
}
</script>

<template>
  <Modal title="数据权限">
    <Form class="mx-4">
      <template #menuIds="slotProps">
        <Spin :spinning="menuLoading" class="w-full">
          <!-- TODO @芋艿：可优化，使用 antd 的 tree？原因是，更原生 -->
          <VbenTree
            :tree-data="menuTree"
            multiple
            bordered
            :expanded="expandedKeys"
            v-bind="slotProps"
            value-field="id"
            label-field="name"
          />
        </Spin>
      </template>
    </Form>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <Checkbox :checked="isAllSelected" @change="toggleSelectAll">
          全选
        </Checkbox>
        <Checkbox :checked="isExpanded" @change="toggleExpandAll">
          全部展开
        </Checkbox>
      </div>
    </template>
  </Modal>
</template>
