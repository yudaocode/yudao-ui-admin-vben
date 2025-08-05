<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type { SystemMenuApi } from '#/api/system/menu';
import type { SystemRoleApi } from '#/api/system/role';

import { ref } from 'vue';

import { useVbenModal, VbenTree } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import { Checkbox, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getMenuList } from '#/api/system/menu';
import { assignRoleMenu, getRoleMenuList } from '#/api/system/permission';
import { $t } from '#/locales';
import { SystemMenuTypeEnum } from '#/utils';

import { useAssignMenuFormSchema } from '../data';

const emit = defineEmits(['success']);

const menuTree = ref<SystemMenuApi.Menu[]>([]); // 菜单树
const menuLoading = ref(false); // 加载菜单列表
const isAllSelected = ref(false); // 全选状态
const isExpanded = ref(false); // 展开状态
const expandedKeys = ref<number[]>([]); // 展开的节点

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
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
    // 提交表单
    const data = await formApi.getValues();
    try {
      await assignRoleMenu({
        roleId: data.id,
        menuIds: data.menuIds,
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
    // 加载菜单列表
    await loadMenuTree();
    const data = modalApi.getData<SystemRoleApi.Role>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      // 加载角色菜单
      const menuIds = await getRoleMenuList(data.id as number);
      await formApi.setFieldValue('menuIds', menuIds);

      await formApi.setValues(data);
    } finally {
      modalApi.unlock();
    }
  },
});

/** 加载菜单树 */
async function loadMenuTree() {
  menuLoading.value = true;
  try {
    const data = await getMenuList();
    menuTree.value = handleTree(data) as SystemMenuApi.Menu[];
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
  // 获取所有节点的 ID
  expandedKeys.value = isExpanded.value ? getAllNodeIds(menuTree.value) : [];
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

function getNodeClass(node: Recordable<any>) {
  const classes: string[] = [];
  if (node.value?.type === SystemMenuTypeEnum.BUTTON) {
    classes.push('inline-flex');
    if (node.index % 3 >= 1) {
      classes.push('!pl-0');
    }
  }

  return classes.join(' ');
}
</script>

<template>
  <Modal title="数据权限" class="w-2/5">
    <Form class="mx-4">
      <template #menuIds="slotProps">
        <VbenTree
          :spinning="menuLoading"
          :tree-data="menuTree"
          multiple
          bordered
          :expanded="expandedKeys"
          :get-node-class="getNodeClass"
          v-bind="slotProps"
          value-field="id"
          label-field="name"
          icon-field="meta.icon"
        />
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
