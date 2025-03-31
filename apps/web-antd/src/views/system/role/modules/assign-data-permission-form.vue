<script lang="ts" setup>
import type { SystemRoleApi } from '#/api/system/role';
import type { SystemDeptApi } from '#/api/system/dept';

import { VbenTree } from '@vben/common-ui';
import { useVbenModal } from '@vben/common-ui';
import { message, Checkbox } from 'ant-design-vue';

import { ref } from 'vue';
import { $t } from '#/locales';
import { useVbenForm } from '#/adapter/form';
import { getRole } from '#/api/system/role';
import { assignRoleDataScope } from '#/api/system/permission';
import { getDeptList } from '#/api/system/dept';
import { handleTree } from '#/utils/tree';

import { useAssignDataPermissionFormSchema } from '../data';
import { SystemDataScopeEnum } from '#/utils/constants';

const emit = defineEmits(['success']);
const formData = ref<SystemRoleApi.SystemRole>();

const deptTree = ref<SystemDeptApi.SystemDept[]>([]); // 部门树
const deptLoading = ref(false); // 加载部门列表
const isAllSelected = ref(false); // 全选状态
const isExpanded = ref(true); // 展开状态
const isDeptCheckStrictly = ref(true); // 父子联动状态

const treeRef = ref(); // 树组件引用

const [Form, formApi] = useVbenForm({
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

/** 全选/全不选 */
function toggleSelectAll() {
  isAllSelected.value = !isAllSelected.value;
  if (treeRef.value) {
    // 根据VbenTree组件的API，调用相应方法全选或全不选
    if (isAllSelected.value) {
      // 全选逻辑，可能需要根据实际实现调整
      const allIds = getAllNodeIds(deptTree.value);
      formApi.setFieldValue('dataScopeDeptIds', allIds);
    } else {
      // 全不选
      formApi.setFieldValue('dataScopeDeptIds', []);
    }
  }
}

/** 展开/折叠所有节点 */
function toggleExpandAll() {
  isExpanded.value = !isExpanded.value;
  debugger
  if (treeRef.value) {
    if (isExpanded.value) {
      treeRef.value.expandAll(); // 展开所有节点
    } else {
      treeRef.value.collapseAll(); // 折叠所有节点
    }
  }
}

/** 切换父子联动 */
function toggleCheckStrictly() {
  isDeptCheckStrictly.value = !isDeptCheckStrictly.value;
}

/** 递归获取所有节点ID */
function getAllNodeIds(nodes, ids = []) {
  nodes.forEach((node) => {
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
      <template #dataScopeDeptIds="slotProps">
        <Spin :spinning="deptLoading" class="w-full">
          <VbenTree
            ref="treeRef"
            :tree-data="deptTree"
            multiple
            bordered
            :default-expanded-level="isExpanded ? 100 : 0"
            v-bind="slotProps"
            value-field="id"
            label-field="name"
            :check-strictly="!isDeptCheckStrictly"
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
        <Checkbox :checked="isDeptCheckStrictly" @change="toggleCheckStrictly">
          父子联动
        </Checkbox>
      </div>
    </template>
  </Modal>
</template>
