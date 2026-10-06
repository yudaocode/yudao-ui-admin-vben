<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type { SystemMenuApi } from '#/api/system/menu';
import type { SystemRoleApi } from '#/api/system/role';

import { nextTick, ref } from 'vue';

import { Tree, useVbenModal } from '@vben/common-ui';
import { SystemMenuTypeEnum } from '@vben/constants';
import { getTreeValuesWithAncestors, handleTree } from '@vben/utils';

import { Checkbox, message, Spin } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getSimpleMenusList } from '#/api/system/menu';
import { assignRoleMenu, getRoleMenuList } from '#/api/system/permission';
import { $t } from '#/locales';

import { useAssignMenuFormSchema } from '../data';

const emit = defineEmits(['success']);

const menuTree = ref<SystemMenuApi.Menu[]>([]); // 菜单树
const checkedMenuIds = ref<Array<number | string>>([]);
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
    const rawIds = (
      checkedMenuIds.value?.length ? checkedMenuIds.value : (data.menuIds ?? [])
    ) as Array<number | string>;
    const menuIds = getTreeValuesWithAncestors(
      menuTree.value,
      rawIds.map(Number).filter((id) => Number.isFinite(id)),
      (menu) => Number(menu.id),
    );
    if (menuTree.value.length === 0) {
      message.warning(
        '当前租户套餐未开通任何菜单，无法分配。请先切回系统租户，给该租户套餐勾选菜单后再分配。',
      );
      modalApi.unlock();
      return;
    }
    if (menuIds.length === 0) {
      message.warning('未勾选任何菜单，权限不会写入。请勾选或点全选后再确认。');
      modalApi.unlock();
      return;
    }
    try {
      await assignRoleMenu({
        roleId: Number(data.id),
        menuIds,
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
      checkedMenuIds.value = [];
      return;
    }
    // 加载菜单列表
    await loadMenuTree();
    const data = modalApi.getData() as SystemRoleApi.Role;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      // 加载角色菜单
      const menuIds = (
        (await getRoleMenuList(data.id)) as Array<number | string>
      ).map(Number);
      checkedMenuIds.value = menuIds.filter((id) => Number.isFinite(id));
      await formApi.setFieldValue('menuIds', checkedMenuIds.value);

      await formApi.setValues(data);
    } finally {
      await nextTick(); // 菜单过多，渲染较慢，需要等下一次事件循环
      modalApi.unlock();
    }
  },
});

/** 加载菜单树 */
async function loadMenuTree() {
  menuLoading.value = true;
  try {
    const data = await getSimpleMenusList();
    menuTree.value = handleTree(data) as SystemMenuApi.Menu[];
  } finally {
    menuLoading.value = false;
  }
}

/** 全选/全不选 */
function handleSelectAll() {
  isAllSelected.value = !isAllSelected.value;
  if (isAllSelected.value) {
    const allIds = getAllNodeIds(menuTree.value);
    formApi.setFieldValue('menuIds', allIds);
    checkedMenuIds.value = allIds;
  } else {
    formApi.setFieldValue('menuIds', []);
    checkedMenuIds.value = [];
  }
}

/** 展开/折叠所有节点 */
function handleExpandAll() {
  isExpanded.value = !isExpanded.value;
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
  <Modal title="菜单权限" class="w-2/5">
    <Form class="mx-4">
      <template #menuIds>
        <Spin :spinning="menuLoading" wrapper-class-name="w-full">
          <Tree
            :tree-data="menuTree"
            multiple
            bordered
            v-model="checkedMenuIds"
            :default-expanded-keys="expandedKeys"
            :get-node-class="getNodeClass"
            value-field="id"
            label-field="name"
          />
        </Spin>
      </template>
    </Form>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <Checkbox :checked="isAllSelected" @change="handleSelectAll">
          全选
        </Checkbox>
        <Checkbox :checked="isExpanded" @change="handleExpandAll">
          全部展开
        </Checkbox>
      </div>
    </template>
  </Modal>
</template>
