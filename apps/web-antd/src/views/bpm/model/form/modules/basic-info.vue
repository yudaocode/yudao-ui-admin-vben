<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';
import type { SelectValue } from 'ant-design-vue/es/select';

import type { PropType } from 'vue';

import type { BpmCategoryApi } from '#/api/bpm/category';
import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemUserApi } from '#/api/system/user';

import { ref, watch } from 'vue';

import { IconifyIcon, Plus, ShieldQuestion, X } from '@vben/icons';

import {
  Avatar,
  Button,
  Form,
  Input,
  Radio,
  Select,
  Tooltip,
} from 'ant-design-vue';

import { DeptSelectModal } from '#/components/dept-select-modal';
import { ImageUpload } from '#/components/upload';
import { UserSelectModal } from '#/components/user-select-modal';
import { DICT_TYPE, getBoolDictOptions, getIntDictOptions } from '#/utils';

const props = defineProps({
  categoryList: {
    type: Array as PropType<BpmCategoryApi.CategoryVO[]>,
    required: true,
  },
  userList: {
    type: Array as PropType<SystemUserApi.User[]>,
    required: true,
  },
  deptList: {
    type: Array as PropType<SystemDeptApi.Dept[]>,
    required: true,
  },
});

// 表单引用
const formRef = ref();

// 选中的发起人
const selectedStartUsers = ref<SystemUserApi.User[]>([]);

// 选中的发起部门
const selectedStartDepts = ref<SystemDeptApi.Dept[]>([]);

// 选中的流程管理员
const selectedManagerUsers = ref<SystemUserApi.User[]>([]);
const userSelectFormRef = ref();
const deptSelectFormRef = ref();
const currentSelectType = ref<'manager' | 'start'>('start');
// 选中的用户
const selectedUsers = ref<number[]>();

const rules: Record<string, Rule[]> = {
  name: [{ required: true, message: '流程名称不能为空', trigger: 'blur' }],
  key: [{ required: true, message: '流程标识不能为空', trigger: 'blur' }],
  category: [{ required: true, message: '流程分类不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '流程类型不能为空', trigger: 'blur' }],
  visible: [{ required: true, message: '是否可见不能为空', trigger: 'blur' }],
  managerUserIds: [
    { required: true, message: '流程管理员不能为空', trigger: 'blur' },
  ],
};

// 创建本地数据副本
const modelData = defineModel<any>();

// 初始化选中的用户
watch(
  () => modelData.value,
  (newVal) => {
    selectedStartUsers.value = newVal.startUserIds?.length
      ? (props.userList.filter((user: SystemUserApi.User) =>
          newVal.startUserIds.includes(user.id),
        ) as SystemUserApi.User[])
      : [];
    selectedStartDepts.value = newVal.startDeptIds?.length
      ? (props.deptList.filter((dept: SystemDeptApi.Dept) =>
          newVal.startDeptIds.includes(dept.id),
        ) as SystemDeptApi.Dept[])
      : [];
    selectedManagerUsers.value = newVal.managerUserIds?.length
      ? (props.userList.filter((user: SystemUserApi.User) =>
          newVal.managerUserIds.includes(user.id),
        ) as SystemUserApi.User[])
      : [];
  },
  {
    immediate: true,
  },
);

/** 打开发起人选择 */
const openStartUserSelect = () => {
  currentSelectType.value = 'start';
  selectedUsers.value = selectedStartUsers.value.map(
    (user) => user.id,
  ) as number[];
  userSelectFormRef.value.open(selectedUsers.value);
};

/** 打开部门选择 */
const openStartDeptSelect = () => {
  deptSelectFormRef.value.open(selectedStartDepts.value);
};
/** 处理部门选择确认 */
const handleDeptSelectConfirm = (depts: SystemDeptApi.Dept[]) => {
  modelData.value = {
    ...modelData.value,
    startDeptIds: depts.map((d) => d.id),
  };
};

/** 打开管理员选择 */
const openManagerUserSelect = () => {
  currentSelectType.value = 'manager';
  selectedUsers.value = selectedManagerUsers.value.map(
    (user) => user.id,
  ) as number[];
  userSelectFormRef.value.open(selectedUsers.value);
};

/** 处理用户选择确认 */
const handleUserSelectConfirm = (userList: SystemUserApi.User[]) => {
  modelData.value =
    currentSelectType.value === 'start'
      ? {
          ...modelData.value,
          startUserIds: userList.map((u) => u.id),
        }
      : {
          ...modelData.value,
          managerUserIds: userList.map((u) => u.id),
        };
};

/** 用户选择弹窗关闭 */
const handleUserSelectClosed = () => {
  selectedUsers.value = [];
};

/** 用户选择弹窗取消 */
const handleUserSelectCancel = () => {
  selectedUsers.value = [];
};

/** 处理发起人类型变化 */
const handleStartUserTypeChange = (value: SelectValue) => {
  const numValue = Number(value);
  switch (numValue) {
    case 0: {
      modelData.value = {
        ...modelData.value,
        startUserIds: [],
        startDeptIds: [],
      };

      break;
    }
    case 1: {
      modelData.value = {
        ...modelData.value,
        startDeptIds: [],
      };

      break;
    }
    case 2: {
      modelData.value = {
        ...modelData.value,
        startUserIds: [],
      };

      break;
    }
  }
};

/** 移除发起人 */
const handleRemoveStartUser = (user: SystemUserApi.User) => {
  modelData.value = {
    ...modelData.value,
    startUserIds: modelData.value.startUserIds.filter(
      (id: number) => id !== user.id,
    ),
  };
};

/** 移除部门 */
const handleRemoveStartDept = (dept: SystemDeptApi.Dept) => {
  modelData.value = {
    ...modelData.value,
    startDeptIds: modelData.value.startDeptIds.filter(
      (id: number) => id !== dept.id,
    ),
  };
};

/** 移除管理员 */
const handleRemoveManagerUser = (user: SystemUserApi.User) => {
  modelData.value = {
    ...modelData.value,
    managerUserIds: modelData.value.managerUserIds.filter(
      (id: number) => id !== user.id,
    ),
  };
};

/** 表单校验 */
const validate = async () => {
  await formRef.value?.validate();
};

defineExpose({
  validate,
});
</script>

<template>
  <Form
    ref="formRef"
    :model="modelData"
    :rules="rules"
    :label-col="{ span: 6 }"
    :wrapper-col="{ span: 18 }"
    class="mt-5"
  >
    <Form.Item label="流程标识" name="key" class="mb-5">
      <div class="flex items-center">
        <Input
          class="w-full"
          v-model:value="modelData.key"
          :disabled="!!modelData.id"
          placeholder="请输入流程标识，以字母或下划线开头"
        />
        <Tooltip
          :title="
            modelData.id ? '流程标识不可修改！' : '新建后，流程标识不可修改！'
          "
          placement="top"
        >
          <ShieldQuestion class="ml-1 text-gray-500" />
        </Tooltip>
      </div>
    </Form.Item>
    <Form.Item label="流程名称" name="name" class="mb-5">
      <Input
        v-model:value="modelData.name"
        :disabled="!!modelData.id"
        allow-clear
        placeholder="请输入流程名称"
      />
    </Form.Item>
    <Form.Item label="流程分类" name="category" class="mb-5">
      <Select
        class="w-full"
        v-model:value="modelData.category"
        allow-clear
        placeholder="请选择流程分类"
      >
        <Select.Option
          v-for="category in categoryList"
          :key="category.code"
          :value="category.code"
        >
          {{ category.name }}
        </Select.Option>
      </Select>
    </Form.Item>
    <Form.Item label="流程图标" class="mb-5">
      <ImageUpload v-model:value="modelData.icon" />
    </Form.Item>
    <Form.Item label="流程描述" name="description" class="mb-5">
      <Input.TextArea v-model:value="modelData.description" allow-clear />
    </Form.Item>
    <Form.Item label="流程类型" name="type" class="mb-5">
      <Radio.Group v-model:value="modelData.type">
        <Radio
          v-for="dict in getIntDictOptions(DICT_TYPE.BPM_MODEL_TYPE)"
          :key="dict.value"
          :value="dict.value"
        >
          {{ dict.label }}
        </Radio>
      </Radio.Group>
    </Form.Item>
    <Form.Item label="是否可见" name="visible" class="mb-5">
      <Radio.Group v-model:value="modelData.visible">
        <Radio
          v-for="(dict, index) in getBoolDictOptions(
            DICT_TYPE.INFRA_BOOLEAN_STRING,
          )"
          :key="index"
          :value="dict.value"
        >
          {{ dict.label }}
        </Radio>
      </Radio.Group>
    </Form.Item>
    <Form.Item label="谁可以发起" name="startUserType" class="mb-5">
      <Select
        v-model:value="modelData.startUserType"
        placeholder="请选择谁可以发起"
        @change="handleStartUserTypeChange"
      >
        <Select.Option :value="0">全员</Select.Option>
        <Select.Option :value="1">指定人员</Select.Option>
        <Select.Option :value="2">指定部门</Select.Option>
      </Select>
      <div
        v-if="modelData.startUserType === 1"
        class="mt-2 flex flex-wrap gap-2"
      >
        <div
          v-for="user in selectedStartUsers"
          :key="user.id"
          class="relative flex h-9 items-center rounded-full bg-gray-100 pr-2"
        >
          <Avatar
            class="m-1"
            :size="28"
            v-if="user.avatar"
            :src="user.avatar"
          />
          <Avatar class="m-1" :size="28" v-else>
            {{ user.nickname?.substring(0, 1) }}
          </Avatar>
          {{ user.nickname }}
          <X
            class="ml-2 size-4 cursor-pointer text-gray-400 hover:text-red-500"
            @click="handleRemoveStartUser(user)"
          />
        </div>
        <Button
          type="link"
          @click="openStartUserSelect"
          class="flex items-center"
        >
          <template #icon>
            <IconifyIcon icon="mdi:account-plus-outline" class="size-[18px]" />
          </template>
          选择人员
        </Button>
      </div>
      <div
        v-if="modelData.startUserType === 2"
        class="mt-2 flex flex-wrap gap-2"
      >
        <div
          v-for="dept in selectedStartDepts"
          :key="dept.id"
          class="relative flex h-9 items-center rounded-full bg-gray-100 pr-2"
        >
          <IconifyIcon icon="ep:office-building" class="size-6 px-1" />
          {{ dept.name }}
          <X
            class="ml-2 size-4 cursor-pointer text-gray-400 hover:text-red-500"
            @click="handleRemoveStartDept(dept)"
          />
        </div>
        <Button
          type="link"
          @click="openStartDeptSelect"
          class="flex items-center"
        >
          <template #icon>
            <Plus class="size-[18px]" />
          </template>
          选择部门
        </Button>
      </div>
    </Form.Item>
    <Form.Item label="流程管理员" name="managerUserIds" class="mb-5">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="user in selectedManagerUsers"
          :key="user.id"
          class="relative flex h-9 items-center rounded-full bg-gray-100 pr-2"
        >
          <Avatar
            class="m-1"
            :size="28"
            v-if="user.avatar"
            :src="user.avatar"
          />
          <Avatar class="m-1" :size="28" v-else>
            {{ user.nickname?.substring(0, 1) }}
          </Avatar>
          {{ user.nickname }}
          <X
            class="ml-2 size-4 cursor-pointer text-gray-400 hover:text-red-500"
            @click="handleRemoveManagerUser(user)"
          />
        </div>
        <Button
          type="link"
          @click="openManagerUserSelect"
          class="flex items-center"
        >
          <template #icon>
            <IconifyIcon icon="mdi:account-plus-outline" class="size-[18px]" />
          </template>
          选择人员
        </Button>
      </div>
    </Form.Item>
  </Form>

  <!-- 用户选择弹窗 -->
  <UserSelectModal
    ref="userSelectFormRef"
    v-model:value="selectedUsers"
    :multiple="true"
    title="选择用户"
    @confirm="handleUserSelectConfirm"
    @closed="handleUserSelectClosed"
    @cancel="handleUserSelectCancel"
  />
  <!-- 部门选择对话框 -->
  <DeptSelectModal
    ref="deptSelectFormRef"
    title="发起人部门选择"
    :check-strictly="true"
    @confirm="handleDeptSelectConfirm"
  />
</template>

<style lang="scss" scoped>
.bg-gray-100 {
  background-color: #f5f7fa;
  transition: all 0.3s;

  &:hover {
    background-color: #e6e8eb;
  }
}

.upload-img-placeholder {
  cursor: pointer;
  background-color: #fafafa;
  transition: all 0.3s;

  &:hover {
    border-color: #1890ff !important;
  }
}
</style>
