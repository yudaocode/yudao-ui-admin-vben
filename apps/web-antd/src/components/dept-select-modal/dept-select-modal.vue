// TODO @芋艿：是否有更好的组织形式？！
<script lang="ts" setup>
import type { DataNode } from 'ant-design-vue/es/tree';

import type { SystemDeptApi } from '#/api/system/dept';

import { defineProps, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import { Button, Card, Col, Row, Tree } from 'ant-design-vue';

import { getSimpleDeptList } from '#/api/system/dept';

defineOptions({ name: 'DeptSelectModal' });

const props = withDefaults(
  defineProps<{
    // 取消按钮文本
    cancelText?: string;
    // checkable 状态下节点选择完全受控
    checkStrictly?: boolean;
    // 确认按钮文本
    confirmText?: string;
    // 是否支持多选
    multiple?: boolean;
    // 标题
    title?: string;
  }>(),
  {
    cancelText: '取消',
    checkStrictly: false,
    confirmText: '确认',
    multiple: true,
    title: '部门选择',
  },
);

const emit = defineEmits<{
  confirm: [deptList: SystemDeptApi.Dept[]];
}>();

// 对话框配置
const [Modal, modalApi] = useVbenModal({
  title: props.title,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      resetData();
      return;
    }
    modalApi.setState({ loading: true });
    try {
      deptData.value = await getSimpleDeptList();
      deptTree.value = handleTree(deptData.value) as DataNode[];
    } finally {
      modalApi.setState({ loading: false });
    }
  },
  destroyOnClose: true,
});
type checkedKeys = number[] | { checked: number[]; halfChecked: number[] };
// 部门树形结构
const deptTree = ref<DataNode[]>([]);
// 选中的部门 ID 列表
const selectedDeptIds = ref<checkedKeys>([]);
// 部门数据
const deptData = ref<SystemDeptApi.Dept[]>([]);

/** 打开对话框 */
const open = async (selectedList?: SystemDeptApi.Dept[]) => {
  modalApi.open();
  // // 设置已选择的部门
  if (selectedList?.length) {
    const selectedIds = selectedList
      .map((dept) => dept.id)
      .filter((id): id is number => id !== undefined);
    selectedDeptIds.value = props.checkStrictly
      ? {
          checked: selectedIds,
          halfChecked: [],
        }
      : selectedIds;
  }
};

/** 处理选中状态变化 */
const handleCheck = () => {
  if (!props.multiple) {
    // 单选模式下，只保留最后选择的节点
    if (Array.isArray(selectedDeptIds.value)) {
      const lastSelectedId =
        selectedDeptIds.value[selectedDeptIds.value.length - 1];
      if (lastSelectedId) {
        selectedDeptIds.value = [lastSelectedId];
      }
    } else {
      // checkStrictly 为 true 时，selectedDeptIds 是一个对象
      const checked = selectedDeptIds.value.checked || [];
      if (checked.length > 0) {
        const lastSelectedId = checked[checked.length - 1];
        selectedDeptIds.value = {
          checked: [lastSelectedId!],
          halfChecked: [],
        };
      }
    }
  }
};

/** 提交选择 */
const handleConfirm = async () => {
  // 获取选中的部门ID
  const selectedIds: number[] = Array.isArray(selectedDeptIds.value)
    ? selectedDeptIds.value
    : selectedDeptIds.value.checked || [];
  const deptArray = deptData.value.filter((dept) =>
    selectedIds.includes(dept.id!),
  );
  // 关闭并提示
  await modalApi.close();
  emit('confirm', deptArray);
};

const handleCancel = () => {
  modalApi.close();
};

/** 重置数据 */
const resetData = () => {
  deptTree.value = [];
  selectedDeptIds.value = [];
};

/** 提供 open 方法，用于打开对话框 */
defineExpose({ open });
</script>
<template>
  <Modal>
    <Row class="h-full">
      <Col :span="24">
        <Card class="h-full">
          <Tree
            :tree-data="deptTree"
            v-if="deptTree.length > 0"
            v-model:checked-keys="selectedDeptIds"
            :checkable="true"
            :check-strictly="checkStrictly"
            :field-names="{ title: 'name', key: 'id' }"
            :default-expand-all="true"
            @check="handleCheck"
          />
        </Card>
      </Col>
    </Row>
    <template #footer>
      <Button @click="handleCancel">{{ cancelText }}</Button>
      <Button type="primary" @click="handleConfirm">{{ confirmText }}</Button>
    </template>
  </Modal>
</template>
