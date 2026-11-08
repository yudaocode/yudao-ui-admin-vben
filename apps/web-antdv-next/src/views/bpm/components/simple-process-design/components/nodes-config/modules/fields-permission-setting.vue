<!-- 表单字段权限设置：用于发起人、审批、抄送节点，以及 BPMN 设计器的用户任务 -->
<script lang="ts" setup>
import { Col, Radio, RadioGroup, Row } from 'antdv-next';

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
  permission: string,
) {
  child.permission = permission === item.permission ? undefined : permission;
  emit('change');
}
</script>

<template>
  <div class="p-1">
    <div v-if="title" class="mb-4 text-base font-bold">{{ title }}</div>

    <!-- 表头 -->
    <Row class="border border-gray-200 px-4 py-3">
      <Col :span="8" class="font-bold">字段名称</Col>
      <Col :span="16">
        <Row>
          <Col
            v-for="option in PERMISSION_OPTIONS"
            :key="option.value"
            :span="8"
            class="flex items-center justify-center"
          >
            <span
              class="cursor-pointer font-bold"
              @click="updateAllPermission(option.value)"
            >
              {{ option.label }}
            </span>
          </Col>
        </Row>
      </Col>
    </Row>

    <!-- 表格内容 -->
    <template v-for="item in fieldsPermission" :key="item.field">
      <Row class="border border-t-0 border-gray-200 px-4 py-2">
        <Col :span="8" class="flex items-center truncate">
          {{ item.title }}
        </Col>
        <Col :span="16">
          <RadioGroup
            v-model:value="item.permission"
            class="w-full"
            @change="emit('change')"
          >
            <Row>
              <Col
                v-for="option in PERMISSION_OPTIONS"
                :key="option.value"
                :span="8"
                class="flex items-center justify-center"
              >
                <Radio
                  :value="option.value"
                  :disabled="isPermissionDisabled(option.value)"
                />
              </Col>
            </Row>
          </RadioGroup>
        </Col>
      </Row>
      <!-- 子表单的子字段：未单独设置时继承子表单，子表单的权限是上限 -->
      <Row
        v-for="child in item.children"
        :key="child.field"
        class="border border-t-0 border-gray-200 px-4 py-2"
      >
        <Col :span="8" class="flex items-center truncate pl-4">
          {{ child.title }}
        </Col>
        <Col :span="16">
          <RadioGroup
            :value="getSubFieldPermission(item.permission, child.permission)"
            :disabled="item.permission === FieldPermissionType.NONE"
            class="w-full"
            @change="
              (e) => updateSubFieldPermission(item, child, e.target.value)
            "
          >
            <Row>
              <Col
                v-for="option in PERMISSION_OPTIONS"
                :key="option.value"
                :span="8"
                class="flex items-center justify-center"
              >
                <Radio
                  :value="option.value"
                  :disabled="
                    isPermissionDisabled(option.value, item.permission)
                  "
                />
              </Col>
            </Row>
          </RadioGroup>
        </Col>
      </Row>
    </template>
  </div>
</template>
