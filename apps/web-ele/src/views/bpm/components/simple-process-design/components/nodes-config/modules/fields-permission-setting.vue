<!-- 表单字段权限设置：用于发起人、审批、抄送节点，以及 BPMN 设计器的用户任务 -->
<script lang="ts" setup>
import { ElCol, ElRadio, ElRadioGroup, ElRow } from 'element-plus';

import { FieldPermissionType } from '../../../consts';
import { getSubFieldPermission } from '../../../helpers';

defineOptions({ name: 'FieldsPermissionSetting' });

const props = defineProps({
  // 标题，为空时不展示
  title: {
    type: String,
    default: '',
  },
  // 是否允许「可编辑」。例如说：抄送节点仅能查看
  writable: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['change']); // 用户修改权限后触发

// 字段权限配置：field、title、permission；子表单还有 children 子字段权限，permission 为空表示继承子表单
const fieldsPermission = defineModel<Array<Record<string, any>>>({
  required: true,
});

const PERMISSION_OPTIONS = [
  { label: '只读', value: FieldPermissionType.READ },
  { label: '可编辑', value: FieldPermissionType.WRITE },
  { label: '隐藏', value: FieldPermissionType.NONE },
];

/** 是否禁用权限选项：不允许「可编辑」时；子字段不能超过子表单的权限 */
function isPermissionDisabled(permission: string, subFormPermission?: string) {
  if (permission !== FieldPermissionType.WRITE) {
    return false;
  }
  return !props.writable || subFormPermission === FieldPermissionType.READ;
}

/** 批量设置字段权限：子表单的子字段，一并恢复为继承 */
function updateAllPermission(permission: string) {
  if (isPermissionDisabled(permission)) {
    return;
  }
  fieldsPermission.value.forEach((item) => {
    item.permission = permission;
    item.children?.forEach((child: Record<string, any>) => {
      child.permission = undefined;
    });
  });
  emit('change');
}

/** 设置子字段权限：选择与子表单相同的权限时，恢复为继承 */
function updateSubFieldPermission(
  item: Record<string, any>,
  child: Record<string, any>,
  permission?: boolean | number | string,
) {
  child.permission = permission === item.permission ? undefined : permission;
  emit('change');
}
</script>

<template>
  <div class="p-1">
    <div v-if="title" class="mb-4 text-base font-bold">{{ title }}</div>

    <!-- 表头 -->
    <ElRow class="border border-gray-200 px-4 py-3">
      <ElCol :span="8" class="font-bold">字段名称</ElCol>
      <ElCol :span="16" class="!flex">
        <span
          v-for="option in PERMISSION_OPTIONS"
          :key="option.value"
          class="flex-1 cursor-pointer text-center font-bold"
          @click="updateAllPermission(option.value)"
        >
          {{ option.label }}
        </span>
      </ElCol>
    </ElRow>

    <!-- 表格内容 -->
    <template v-for="item in fieldsPermission" :key="item.field">
      <ElRow class="border border-t-0 border-gray-200 px-4 py-2">
        <ElCol :span="8" class="flex items-center truncate">
          {{ item.title }}
        </ElCol>
        <ElCol :span="16">
          <ElRadioGroup
            v-model="item.permission"
            class="flex w-full"
            @change="emit('change')"
          >
            <div
              v-for="option in PERMISSION_OPTIONS"
              :key="option.value"
              class="flex flex-1 justify-center"
            >
              <ElRadio
                :value="option.value"
                :disabled="isPermissionDisabled(option.value)"
              />
            </div>
          </ElRadioGroup>
        </ElCol>
      </ElRow>
      <!-- 子表单的子字段：未单独设置时继承子表单，子表单的权限是上限 -->
      <ElRow
        v-for="child in item.children"
        :key="child.field"
        class="border border-t-0 border-gray-200 px-4 py-2"
      >
        <ElCol :span="8" class="flex items-center truncate pl-4">
          {{ child.title }}
        </ElCol>
        <ElCol :span="16">
          <ElRadioGroup
            :model-value="
              getSubFieldPermission(item.permission, child.permission)
            "
            :disabled="item.permission === FieldPermissionType.NONE"
            class="flex w-full"
            @change="(value) => updateSubFieldPermission(item, child, value)"
          >
            <div
              v-for="option in PERMISSION_OPTIONS"
              :key="option.value"
              class="flex flex-1 justify-center"
            >
              <ElRadio
                :value="option.value"
                :disabled="isPermissionDisabled(option.value, item.permission)"
              />
            </div>
          </ElRadioGroup>
        </ElCol>
      </ElRow>
    </template>
  </div>
</template>
