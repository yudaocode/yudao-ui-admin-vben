<script lang="ts" setup>
import type { Key } from 'ant-design-vue/es/table/interface';

import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemUserApi } from '#/api/system/user';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import {
  Button,
  Col,
  Input,
  message,
  Row,
  Spin,
  Transfer,
  Tree,
} from 'ant-design-vue';

import { getSimpleDeptList } from '#/api/system/dept';
import { getSimpleUserList } from '#/api/system/user';

// 部门树节点接口
interface DeptTreeNode {
  key: string;
  title: string;
  children?: DeptTreeNode[];
}

defineOptions({ name: 'UserSelectModal' });

const props = withDefaults(
  defineProps<{
    cancelText?: string;
    confirmText?: string;
    multiple?: boolean;
    title?: string;
    value?: number[];
  }>(),
  {
    title: '选择用户',
    multiple: true,
    value: () => [],
    confirmText: '确定',
    cancelText: '取消',
  },
);

const emit = defineEmits<{
  cancel: [];
  confirm: [value: number[]];
  'update:value': [value: number[]];
}>();

// 部门树数据
const deptTree = ref<any[]>([]);
const deptList = ref<SystemDeptApi.Dept[]>([]);
const expandedKeys = ref<Key[]>([]);
const selectedDeptId = ref<number>();
const searchValue = ref('');

// 用户数据
const userList = ref<SystemUserApi.User[]>([]);
const filteredUserList = ref<SystemUserApi.User[]>([]);
const selectedUserIds = ref<string[]>([]);

// 分页数据
const pagination = ref({
  pageSize: 10,
  simple: true,
  showSizeChanger: true,
  onChange: (page: number, pageSize: number) => {
    console.log('🚀 ~ pagination ~ page:', page);
    console.log('🚀 ~ pagination ~ pageSize:', pageSize);
  },
});

// 加载状态
const loading = ref(false);

// 计算属性：合并已选择的用户和当前部门过滤后的用户
const transferUserList = computed(() => {
  // 1. 获取所有已选择的用户
  const selectedUsers = userList.value.filter((user) =>
    selectedUserIds.value.includes(String(user.id)),
  );

  // 2. 获取当前部门过滤后的未选择用户
  const filteredUnselectedUsers = filteredUserList.value.filter(
    (user) => !selectedUserIds.value.includes(String(user.id)),
  );

  // 3. 合并并去重
  return [...selectedUsers, ...filteredUnselectedUsers];
});

// 过滤部门树数据
const filteredDeptTree = computed(() => {
  if (!searchValue.value) return deptTree.value;

  const filterNode = (node: any): any => {
    const title = node?.title?.toLowerCase();
    const search = searchValue.value.toLowerCase();

    // 如果当前节点匹配
    if (title.includes(search)) {
      return {
        ...node,
        children: node.children?.map((child: any) => filterNode(child)),
      };
    }

    // 如果当前节点不匹配，检查子节点
    if (node.children) {
      const filteredChildren = node.children
        .map((child: any) => filterNode(child))
        .filter(Boolean);

      if (filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
    }

    return null;
  };

  return deptTree.value.map((node: any) => filterNode(node)).filter(Boolean);
});

// 获取指定部门及其所有子部门的ID列表
const getChildDeptIds = (
  deptId: number | undefined,
  deptList: SystemDeptApi.Dept[],
): number[] => {
  if (!deptId) return [];
  const ids = [deptId];
  const children = deptList.filter((dept) => dept.parentId === deptId);
  children.forEach((child) => {
    ids.push(...getChildDeptIds(child.id, deptList));
  });
  return ids;
};

// 获取部门过滤后的用户列表
const filterUserList = async (deptId: number) => {
  loading.value = true;
  try {
    // 获取部门及其子部门的所有用户
    const deptIds = getChildDeptIds(deptId, deptList.value);
    filteredUserList.value = userList.value.filter((user) =>
      deptIds.includes(user.deptId),
    );
  } finally {
    loading.value = false;
  }
};

// 处理部门选择
const handleDeptSelect = (selectedKeys: Key[], _info: any) => {
  if (selectedKeys.length === 0) return;
  const deptId = Number(selectedKeys[0]);
  selectedDeptId.value = deptId;
  filterUserList(deptId);
};

// 处理用户选择
const handleUserChange = (targetKeys: string[]) => {
  selectedUserIds.value = targetKeys;
  emit('update:value', targetKeys.map(Number));
};

// 确认选择
const handleConfirm = () => {
  if (selectedUserIds.value.length === 0) {
    message.warning('请选择用户');
    return;
  }
  emit('confirm', selectedUserIds.value.map(Number));
  modalApi.close();
};

// 取消选择
const handleCancel = () => {
  emit('cancel');
  modalApi.close();
};

// 重置数据
const resetData = () => {
  deptTree.value = [];
  deptList.value = [];
  userList.value = [];
  filteredUserList.value = [];
  selectedUserIds.value = [];
  selectedDeptId.value = undefined;
  expandedKeys.value = [];
  searchValue.value = '';
  pagination.value = {
    pageSize: 10,
    simple: false,
    showSizeChanger: true,
  };
};

// 递归处理部门树节点
const processDeptNode = (node: any): DeptTreeNode => {
  return {
    key: String(node.id),
    title: `${node.name} (${node.id})`,
    children: node.children?.map((child: any) => processDeptNode(child)),
  };
};

// 打开弹窗
const open = async () => {
  resetData();
  loading.value = true;
  try {
    // 加载部门数据
    const deptData = await getSimpleDeptList();
    deptList.value = deptData;
    const treeData = handleTree(deptData);
    deptTree.value = treeData.map((node) => processDeptNode(node));
    expandedKeys.value = deptTree.value.map((node) => node.key);

    // 加载用户数据
    userList.value = await getSimpleUserList();
    filteredUserList.value = [...userList.value];

    // 设置已选用户
    if (props.value?.length) {
      selectedUserIds.value = props.value.map(String);
    }

    modalApi.open();
  } finally {
    loading.value = false;
  }
};

// 弹窗配置
const [ModalComponent, modalApi] = useVbenModal({
  title: props.title,
  onCancel: handleCancel,
});

// 处理部门树展开/折叠
const handleExpand = (keys: Key[]) => {
  expandedKeys.value = keys;
};

// 处理部门搜索
const handleDeptSearch = (value: string) => {
  searchValue.value = value;

  // 如果有搜索结果，自动展开所有节点
  if (value) {
    const getAllKeys = (nodes: any[]): string[] => {
      const keys: string[] = [];
      for (const node of nodes) {
        keys.push(node.key);
        if (node.children) {
          keys.push(...getAllKeys(node.children));
        }
      }
      return keys;
    };
    expandedKeys.value = getAllKeys(deptTree.value);
  } else {
    // 清空搜索时，只展开第一级节点
    expandedKeys.value = deptTree.value.map((node) => node.key);
  }
};

defineExpose({
  open,
});
</script>

<template>
  <ModalComponent class="w-[900px]">
    <Spin :spinning="loading">
      <Row :gutter="[16, 16]">
        <Col :span="6">
          <div class="h-[500px] overflow-auto rounded border border-gray-200">
            <div class="border-b border-gray-200 p-2">
              <Input
                v-model:value="searchValue"
                placeholder="搜索部门"
                allow-clear
                @input="(e) => handleDeptSearch(e.target?.value ?? '')"
              />
            </div>
            <Tree
              :tree-data="filteredDeptTree"
              :expanded-keys="expandedKeys"
              :selected-keys="selectedDeptId ? [String(selectedDeptId)] : []"
              @select="handleDeptSelect"
              @expand="handleExpand"
            />
          </div>
        </Col>
        <Col :span="17">
          <Transfer
            :row-key="(record) => String(record.id)"
            v-model:target-keys="selectedUserIds"
            :data-source="transferUserList"
            :titles="['未选', '已选']"
            :show-search="true"
            :filter-option="
              (inputValue, item) =>
                item.nickname.toLowerCase().includes(inputValue.toLowerCase())
            "
            :pagination="pagination"
            @change="handleUserChange"
          >
            <template #render="item">
              <span class="custom-item"
                >{{ item.nickname }} ({{ item.id }})</span
              >
            </template>
          </Transfer>
        </Col>
      </Row>
    </Spin>
    <template #footer>
      <Button
        type="primary"
        :disabled="selectedUserIds.length === 0"
        @click="handleConfirm"
      >
        {{ confirmText }}
      </Button>
      <Button @click="handleCancel">{{ cancelText }}</Button>
    </template>
  </ModalComponent>
</template>

<style lang="scss" scoped>
:deep(.ant-transfer) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

:deep(.ant-transfer-list) {
  flex: 1;
  height: 100%;
}

:deep(.ant-transfer-list-search) {
  padding: 8px;
}

:deep(.ant-transfer-list-body) {
  height: calc(100% - 40px);
}

:deep(.ant-transfer-list-pagination) {
  margin: 8px 0;
  text-align: right;
}
</style>
