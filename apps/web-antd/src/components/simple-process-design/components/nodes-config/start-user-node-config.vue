<script setup lang="ts">
import type { Ref } from 'vue';

import type { SimpleFlowNode } from '../../consts';

import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemUserApi } from '#/api/system/user';

import { inject, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Divider,
  Input,
  Radio,
  RadioGroup,
  TabPane,
  Tabs,
  Tooltip,
  TypographyText,
} from 'ant-design-vue';

import { BpmModelFormType } from '#/utils';

import {
  FieldPermissionType,
  NodeType,
  START_USER_BUTTON_SETTING,
} from '../../consts';
import {
  useFormFieldsPermission,
  useNodeName,
  useWatchNode,
} from '../../helpers';

defineOptions({ name: 'StartUserNodeConfig' });
const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true,
  },
});
// 可发起流程的用户编号
const startUserIds = inject<Ref<any[]>>('startUserIds');
// 可发起流程的部门编号
const startDeptIds = inject<Ref<any[]>>('startDeptIds');
// 用户列表
const userOptions = inject<Ref<SystemUserApi.User[]>>('userList');
// 部门列表
const deptOptions = inject<Ref<SystemDeptApi.Dept[]>>('deptList');
// 当前节点
const currentNode = useWatchNode(props);
// 节点名称
const { nodeName, showInput, clickIcon, blurEvent } = useNodeName(
  NodeType.COPY_TASK_NODE,
);
// 激活的 Tab 标签页
const activeTabName = ref('user');
// 表单字段权限配置
const { formType, fieldsPermissionConfig, getNodeConfigFormFields } =
  useFormFieldsPermission(FieldPermissionType.WRITE);
const getUserNicknames = (userIds: number[]): string => {
  if (!userIds || userIds.length === 0) {
    return '';
  }
  const nicknames: string[] = [];
  userIds.forEach((userId) => {
    const found = userOptions?.value.find((item) => item.id === userId);
    if (found && found.nickname) {
      nicknames.push(found.nickname);
    }
  });
  return nicknames.join(',');
};

const getDeptNames = (deptIds: number[]): string => {
  if (!deptIds || deptIds.length === 0) {
    return '';
  }
  const deptNames: string[] = [];
  deptIds.forEach((deptId) => {
    const found = deptOptions?.value.find((item) => item.id === deptId);
    if (found && found.name) {
      deptNames.push(found.name);
    }
  });
  return deptNames.join(',');
};

// 使用 VbenDrawer
const [Drawer, drawerApi] = useVbenDrawer({
  header: false,
  closable: false,
  onCancel() {
    drawerApi.close();
  },
  onConfirm() {
    saveConfig();
  },
});

// 保存配置
const saveConfig = async () => {
  activeTabName.value = 'user';
  currentNode.value.name = nodeName.value!;
  currentNode.value.showText = '已设置';
  // 设置表单权限
  currentNode.value.fieldsPermission = fieldsPermissionConfig.value;
  // 设置发起人的按钮权限
  currentNode.value.buttonsSetting = START_USER_BUTTON_SETTING;
  drawerApi.close();
  return true;
};

// 显示发起人节点配置，由父组件传过来
const showStartUserNodeConfig = (node: SimpleFlowNode) => {
  nodeName.value = node.name;
  // 表单字段权限
  getNodeConfigFormFields(node.fieldsPermission);
  drawerApi.open();
};

/** 批量更新权限 */
const updatePermission = (type: string) => {
  fieldsPermissionConfig.value.forEach((field) => {
    if (type === 'READ') {
      field.permission = FieldPermissionType.READ;
    } else if (type === 'WRITE') {
      field.permission = FieldPermissionType.WRITE;
    } else {
      field.permission = FieldPermissionType.NONE;
    }
  });
};

/**
 * 暴露方法给父组件
 */
defineExpose({ showStartUserNodeConfig });
</script>
<template>
  <Drawer>
    <div class="config-header">
      <!--    TODO v-mountedFocus 自动聚集 需要迁移一下 -->
      <Input
        v-if="showInput"
        type="text"
        class="config-editable-input"
        @blur="blurEvent()"
        v-model:value="nodeName"
        :placeholder="nodeName"
      />
      <div v-else class="node-name">
        {{ nodeName }}
        <IconifyIcon
          class="ml-1"
          icon="ep:edit-pen"
          :size="16"
          @click="clickIcon()"
        />
      </div>
      <Divider />
    </div>

    <Tabs v-model:active-key="activeTabName" type="card">
      <TabPane tab="权限" key="user">
        <TypographyText
          v-if="
            (!startUserIds || startUserIds.length === 0) &&
            (!startDeptIds || startDeptIds.length === 0)
          "
        >
          全部成员可以发起流程
        </TypographyText>
        <div v-else-if="startUserIds && startUserIds.length > 0">
          <TypographyText v-if="startUserIds.length === 1">
            {{ getUserNicknames(startUserIds) }} 可发起流程
          </TypographyText>
          <TypographyText v-else>
            <Tooltip
              class="box-item"
              effect="dark"
              placement="top"
              :content="getUserNicknames(startUserIds)"
            >
              {{ getUserNicknames(startUserIds.slice(0, 2)) }} 等
              {{ startUserIds.length }} 人可发起流程
            </Tooltip>
          </TypographyText>
        </div>
        <div v-else-if="startDeptIds && startDeptIds.length > 0">
          <TypographyText v-if="startDeptIds.length === 1">
            {{ getDeptNames(startDeptIds) }} 可发起流程
          </TypographyText>
          <TypographyText v-else>
            <Tooltip
              class="box-item"
              effect="dark"
              placement="top"
              :content="getDeptNames(startDeptIds)"
            >
              {{ getDeptNames(startDeptIds.slice(0, 2)) }} 等
              {{ startDeptIds.length }} 个部门可发起流程
            </Tooltip>
          </TypographyText>
        </div>
      </TabPane>
      <TabPane
        tab="表单字段权限"
        key="fields"
        v-if="formType === BpmModelFormType.NORMAL"
      >
        <div class="field-setting-pane">
          <div class="field-setting-desc">字段权限</div>
          <div class="field-permit-title">
            <div class="setting-title-label first-title">字段名称</div>
            <div class="other-titles">
              <span
                class="setting-title-label cursor-pointer"
                @click="updatePermission('READ')"
              >
                只读
              </span>
              <span
                class="setting-title-label cursor-pointer"
                @click="updatePermission('WRITE')"
              >
                可编辑
              </span>
              <span
                class="setting-title-label cursor-pointer"
                @click="updatePermission('NONE')"
              >
                隐藏
              </span>
            </div>
          </div>
          <div
            class="field-setting-item"
            v-for="(item, index) in fieldsPermissionConfig"
            :key="index"
          >
            <div class="field-setting-item-label">{{ item.title }}</div>
            <RadioGroup
              class="field-setting-item-group"
              v-model:value="item.permission"
            >
              <div class="item-radio-wrap">
                <Radio
                  :value="FieldPermissionType.READ"
                  size="large"
                  :label="FieldPermissionType.READ"
                >
                  <span></span>
                </Radio>
              </div>
              <div class="item-radio-wrap">
                <Radio
                  :value="FieldPermissionType.WRITE"
                  size="large"
                  :label="FieldPermissionType.WRITE"
                >
                  <span></span>
                </Radio>
              </div>
              <div class="item-radio-wrap">
                <Radio
                  :value="FieldPermissionType.NONE"
                  size="large"
                  :label="FieldPermissionType.NONE"
                >
                  <span></span>
                </Radio>
              </div>
            </RadioGroup>
          </div>
        </div>
      </TabPane>
    </Tabs>
  </Drawer>
</template>
<style lang="scss" scoped></style>
