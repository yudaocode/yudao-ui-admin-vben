<script lang="ts" setup>
import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemRoleApi } from '#/api/system/role';

import { ref } from 'vue';

import { useVbenModal, VbenTree } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import { NCheckbox } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { getDeptList } from '#/api/system/dept';
import { assignRoleDataScope } from '#/api/system/permission';
import { getRole } from '#/api/system/role';
import { $t } from '#/locales';
import { SystemDataScopeEnum } from '#/utils';

import { useAssignDataPermissionFormSchema } from '../data';

const emit = defineEmits(['success']);

const deptTree = ref<SystemDeptApi.Dept[]>([]); // 部门树
const deptLoading = ref(false); // 加载部门列表
const isAllSelected = ref(false); // 全选状态
const isExpanded = ref(false); // 展开状态
const isCheckStrictly = ref(true); // 父子联动状态
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
  schema: useAssignDataPermissionFormSchema(),
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
      await assignRoleDataScope({
        roleId: data.id,
        dataScope: data.dataScope,
        dataScopeDeptIds:
          data.dataScope === SystemDataScopeEnum.DEPT_CUSTOM
            ? data.dataScopeDeptIds
            : undefined,
      });
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
    const data = modalApi.getData<SystemRoleApi.Role>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      // 加载部门列表
      await loadDeptTree();
      toggleExpandAll();
      // 设置表单值, 一定要在加载树之后
      await formApi.setValues(await getRole(data.id as number));
    } finally {
      modalApi.unlock();
    }
  },
});

/** 加载部门树 */
async function loadDeptTree() {
  deptLoading.value = true;
  try {
    const data = await getDeptList();
    deptTree.value = handleTree(data) as SystemDeptApi.Dept[];
  } finally {
    deptLoading.value = false;
  }
}

/** 全选/全不选 */
function toggleSelectAll() {
  isAllSelected.value = !isAllSelected.value;
  if (isAllSelected.value) {
    const allIds = getAllNodeIds(deptTree.value);
    formApi.setFieldValue('dataScopeDeptIds', allIds);
  } else {
    formApi.setFieldValue('dataScopeDeptIds', []);
  }
}

/** 展开/折叠所有节点 */
function toggleExpandAll() {
  isExpanded.value = !isExpanded.value;
  // 获取所有节点的 ID
  expandedKeys.value = isExpanded.value ? getAllNodeIds(deptTree.value) : [];
}

/** 切换父子联动 */
function toggleCheckStrictly() {
  isCheckStrictly.value = !isCheckStrictly.value;
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
  <Modal title="数据权限" class="w-[40%]">
    <Form class="mx-4">
      <template #dataScopeDeptIds="slotProps">
        <!-- <Spin :spinning="deptLoading"> -->
        <!-- TODO @芋艿：可优化，使用 antd 的 tree？原因是，更原生 -->
        <VbenTree
          :tree-data="deptTree"
          multiple
          bordered
          :expanded="expandedKeys"
          v-bind="slotProps"
          value-field="id"
          label-field="name"
          :auto-check-parent="false"
          :check-strictly="!isCheckStrictly"
        />
        <!-- </Spin> -->
      </template>
    </Form>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <NCheckbox :checked="isAllSelected" @change="toggleSelectAll">
          全选
        </NCheckbox>
        <NCheckbox :checked="isExpanded" @change="toggleExpandAll">
          全部展开
        </NCheckbox>
        <NCheckbox :checked="isCheckStrictly" @change="toggleCheckStrictly">
          父子联动
        </NCheckbox>
      </div>
    </template>
  </Modal>
</template>
