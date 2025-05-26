<script setup lang="ts">
import type { Ref } from 'vue';

import type { SimpleFlowNode } from '../consts';

import type { BpmFormApi } from '#/api/bpm/form';
import type { BpmUserGroupApi } from '#/api/bpm/userGroup';
import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemPostApi } from '#/api/system/post';
import type { SystemRoleApi } from '#/api/system/role';
import type { SystemUserApi } from '#/api/system/user';

import { inject, onMounted, provide, ref } from 'vue';

import { handleTree } from '@vben/utils';

import { Button, Modal } from 'ant-design-vue';

import { getFormDetail } from '#/api/bpm/form';
import { getModel } from '#/api/bpm/model';
import { getUserGroupSimpleList } from '#/api/bpm/userGroup';
import { getSimpleDeptList } from '#/api/system/dept';
import { getSimplePostList } from '#/api/system/post';
import { getSimpleRoleList } from '#/api/system/role';
import { getSimpleUserList } from '#/api/system/user';
import { BpmModelFormType } from '#/utils/constants';

import { NODE_DEFAULT_TEXT, NodeId, NodeType } from '../consts';
import SimpleProcessModel from './simple-process-model.vue';

defineOptions({
  name: 'SimpleProcessDesigner',
});

const props = defineProps({
  modelId: {
    type: String,
    required: false,
    default: undefined,
  },
  modelKey: {
    type: String,
    required: false,
    default: undefined,
  },
  modelName: {
    type: String,
    required: false,
    default: undefined,
  },
  // 可发起流程的人员编号
  startUserIds: {
    type: Array,
    required: false,
    default: undefined,
  },
  // 可发起流程的部门编号
  startDeptIds: {
    type: Array,
    required: false,
    default: undefined,
  },
});
// 保存成功事件
const emits = defineEmits(['success']);
const processData = inject('processData') as Ref;
const loading = ref(false);
const formFields = ref<string[]>([]);
const formType = ref(20);
const roleOptions = ref<SystemRoleApi.Role[]>([]); // 角色列表
const postOptions = ref<SystemPostApi.Post[]>([]); // 岗位列表
const userOptions = ref<SystemUserApi.User[]>([]); // 用户列表
const deptOptions = ref<SystemDeptApi.Dept[]>([]); // 部门列表
const deptTreeOptions = ref();
const userGroupOptions = ref<BpmUserGroupApi.UserGroupVO[]>([]); // 用户组列表

provide('formFields', formFields);
provide('formType', formType);
provide('roleList', roleOptions);
provide('postList', postOptions);
provide('userList', userOptions);
provide('deptList', deptOptions);
provide('userGroupList', userGroupOptions);
provide('deptTree', deptTreeOptions);
provide('startUserIds', props.startUserIds);
provide('startDeptIds', props.startDeptIds);
provide('tasks', []);
provide('processInstance', {});
const processNodeTree = ref<SimpleFlowNode | undefined>();
provide('processNodeTree', processNodeTree);
const errorDialogVisible = ref(false);
const errorNodes: SimpleFlowNode[] = [];

// 添加更新模型的方法
const updateModel = () => {
  if (!processNodeTree.value) {
    processNodeTree.value = {
      name: '发起人',
      type: NodeType.START_USER_NODE,
      id: NodeId.START_USER_NODE_ID,
      childNode: {
        id: NodeId.END_EVENT_NODE_ID,
        name: '结束',
        type: NodeType.END_EVENT_NODE,
      },
    };
    // 初始化时也触发一次保存
    saveSimpleFlowModel(processNodeTree.value);
  }
};

const saveSimpleFlowModel = async (
  simpleModelNode: SimpleFlowNode | undefined,
) => {
  if (!simpleModelNode) {
    return;
  }

  try {
    processData.value = simpleModelNode;
    emits('success', simpleModelNode);
  } catch (error) {
    console.error('保存失败:', error);
  }
};

/**
 * 校验节点设置。 暂时以 showText 为空 未节点错误配置
 */
// eslint-disable-next-line unused-imports/no-unused-vars, no-unused-vars
const validateNode = (
  node: SimpleFlowNode | undefined,
  errorNodes: SimpleFlowNode[],
) => {
  if (node) {
    const { type, showText, conditionNodes } = node;
    if (type === NodeType.END_EVENT_NODE) {
      return;
    }
    if (type === NodeType.START_USER_NODE) {
      // 发起人节点暂时不用校验，直接校验孩子节点
      validateNode(node.childNode, errorNodes);
    }

    if (
      type === NodeType.USER_TASK_NODE ||
      type === NodeType.COPY_TASK_NODE ||
      type === NodeType.CONDITION_NODE
    ) {
      if (!showText) {
        errorNodes.push(node);
      }
      validateNode(node.childNode, errorNodes);
    }

    if (
      type === NodeType.CONDITION_BRANCH_NODE ||
      type === NodeType.PARALLEL_BRANCH_NODE ||
      type === NodeType.INCLUSIVE_BRANCH_NODE
    ) {
      // 分支节点
      // 1. 先校验各个分支
      conditionNodes?.forEach((item) => {
        validateNode(item, errorNodes);
      });
      // 2. 校验孩子节点
      validateNode(node.childNode, errorNodes);
    }
  }
};

onMounted(async () => {
  try {
    loading.value = true;
    // 获取表单字段
    if (props.modelId) {
      const bpmnModel = await getModel(props.modelId);
      if (bpmnModel) {
        formType.value = bpmnModel.formType;
        if (formType.value === BpmModelFormType.NORMAL && bpmnModel.formId) {
          const bpmnForm = (await getFormDetail(
            bpmnModel.formId,
          )) as unknown as BpmFormApi.FormVO;
          formFields.value = bpmnForm?.fields;
        }
      }
    }
    // 获得角色列表
    roleOptions.value = await getSimpleRoleList();
    // 获得岗位列表
    postOptions.value = await getSimplePostList();
    // 获得用户列表
    userOptions.value = await getSimpleUserList();
    // 获得部门列表
    const deptList = await getSimpleDeptList();
    deptOptions.value = deptList;
    // 转换成树形结构
    deptTreeOptions.value = handleTree(deptList);
    // 获取用户组列表
    userGroupOptions.value = await getUserGroupSimpleList();
    // 加载流程数据
    if (processData.value) {
      processNodeTree.value = processData?.value;
    } else {
      updateModel();
    }
  } finally {
    loading.value = false;
  }
});

const simpleProcessModelRef = ref();

defineExpose({});
</script>
<template>
  <div v-loading="loading">
    <SimpleProcessModel
      ref="simpleProcessModelRef"
      v-if="processNodeTree"
      :flow-node="processNodeTree"
      :readonly="false"
      @save="saveSimpleFlowModel"
    />
    <Modal
      v-model="errorDialogVisible"
      title="保存失败"
      width="400"
      :fullscreen="false"
    >
      <div class="mb-2">以下节点内容不完善，请修改后保存</div>
      <div
        class="b-rounded-1 line-height-normal mb-3 bg-gray-100 p-2"
        v-for="(item, index) in errorNodes"
        :key="index"
      >
        {{ item.name }} : {{ NODE_DEFAULT_TEXT.get(item.type) }}
      </div>
      <template #footer>
        <Button type="primary" @click="errorDialogVisible = false">
          知道了
        </Button>
      </template>
    </Modal>
  </div>
</template>
