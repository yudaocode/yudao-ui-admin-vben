<script lang="ts" setup>
import type { OaFilePermissionApi } from '#/api/oa/file/permission';
import type { SystemDeptApi } from '#/api/system/dept';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import { ElMessage, ElTreeSelect } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { saveFilePermission } from '#/api/oa/file/permission';
import { getSimpleDeptList } from '#/api/system/dept';
import { $t } from '#/locales';
import {
  OA_FILE_PERMISSION_LEVEL,
  OA_FILE_SUBJECT_TYPE,
} from '#/views/oa/utils/constants';
import { UserSelect } from '#/views/system/user/components';

import { usePermissionFormSchema } from '../data';

defineOptions({ name: 'OaFilePermissionForm' });

const emit = defineEmits(['success']);

const formData = ref<OaFilePermissionApi.FilePermission>(); // 表单数据
const subjectType = ref<number>(OA_FILE_SUBJECT_TYPE.USER); // 当前共享类型
const deptTree = ref<SystemDeptApi.Dept[]>([]); // 部门树

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['共享'])
    : $t('ui.actionTitle.create', ['共享']);
});

/** 加载部门树 */
async function loadDeptTree() {
  if (deptTree.value.length > 0) {
    return;
  }
  deptTree.value = handleTree(await getSimpleDeptList());
}

/** 切换共享类型 */
async function handleSubjectTypeChange(value: number) {
  subjectType.value = value;
  await formApi.setFieldValue('subjectId', undefined);
  if (value === OA_FILE_SUBJECT_TYPE.DEPT) {
    await loadDeptTree();
  }
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: usePermissionFormSchema({
    onSubjectTypeChange: handleSubjectTypeChange,
  }),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    // 1. 校验表单
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // 2. 提交请求
    modalApi.lock();
    const data =
      (await formApi.getValues()) as OaFilePermissionApi.FilePermission;
    try {
      await saveFilePermission(data);
      // 3. 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 初始化表单，修改时回显已有授权，仅调整权限、继承和到期时间
    const data = modalApi.getData() as {
      formType: string;
      nodeId: number;
      row?: OaFilePermissionApi.FilePermission;
    };
    formData.value = data.row ? { ...data.row } : undefined;
    subjectType.value = data.row?.subjectType ?? OA_FILE_SUBJECT_TYPE.USER;
    await formApi.setValues(
      data.row
        ? { ...data.row }
        : {
            id: undefined,
            nodeId: data.nodeId,
            subjectType: OA_FILE_SUBJECT_TYPE.USER,
            subjectId: undefined,
            level: OA_FILE_PERMISSION_LEVEL.READ,
            inherit: true,
            expireTime: undefined,
          },
    );
    if (subjectType.value === OA_FILE_SUBJECT_TYPE.DEPT) {
      await loadDeptTree();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[700px]">
    <Form class="mx-4">
      <template #subjectId="slotProps">
        <UserSelect
          v-if="subjectType === OA_FILE_SUBJECT_TYPE.USER"
          :model-value="slotProps.componentField.modelValue"
          :disabled="!!formData?.id"
          @update:model-value="
            slotProps.componentField['onUpdate:modelValue']
          "
        />
        <ElTreeSelect
          v-else
          :model-value="slotProps.componentField.modelValue"
          :disabled="!!formData?.id"
          :data="deptTree"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          check-strictly
          clearable
          default-expand-all
          class="!w-full"
          placeholder="请选择部门"
          @update:model-value="
            slotProps.componentField['onUpdate:modelValue']
          "
        />
      </template>
    </Form>
  </Modal>
</template>
