<script lang="ts" setup>
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage, ElRadioButton, ElRadioGroup } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { createProject, getProject, updateProject } from '#/api/pms/pm/project';
import {
  PmsProjectLevel,
  PmsProjectType,
} from '#/views/pms/pm/utils/constants';

import { useFormSchema } from './data';

defineOptions({ name: 'PmsProjectForm' });

const emit = defineEmits<{ success: [] }>(); // 定义 success 事件，用于操作成功后的回调

const formType = ref<'create' | 'update'>('create'); // 表单类型：create - 新增；update - 修改
const formData = ref<Partial<PmsProjectApi.Project>>(getDefaultFormData()); // 表单数据
const dialogTitle = computed(() =>
  formType.value === 'create' ? '新增' : '修改',
); // 弹窗标题

/** 项目类型说明 */
function projectTypeTip(type?: number) {
  return type === PmsProjectType.AGILE
    ? '适合敏捷研发协作，提供需求、迭代、任务、缺陷和甘特图。'
    : '适合日常任务协作，提供项目概况、任务和甘特图。';
}

/** 获得默认表单数据 */
function getDefaultFormData(): Partial<PmsProjectApi.Project> {
  return {
    id: undefined,
    name: '',
    type: PmsProjectType.GENERAL,
    level: PmsProjectLevel.NORMAL,
    description: '',
    openStatus: false,
    icon: 'ep:folder',
    startTime: undefined,
    endTime: undefined,
    memberUserIds: [],
  };
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 96,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[760px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // 提交请求
    modalApi.lock();
    // 合并表单值，修改时保留项目详情中的其他字段
    const data = {
      ...formData.value,
      ...(await formApi.getValues()),
    };
    try {
      if (formType.value === 'create') {
        await createProject(data);
        ElMessage.success('创建成功');
      } else {
        await updateProject(data);
        ElMessage.success('更新成功');
      }
      await modalApi.close();
      // 发送操作成功的事件
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as {
      formType: 'create' | 'update';
      id?: number;
    };
    formType.value = data.formType;
    // 重置表单为默认值
    formData.value = getDefaultFormData();
    await formApi.reset();
    // 修改时加载项目详情
    if (data.id) {
      modalApi.lock();
      try {
        formData.value = await getProject(data.id);
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
    }
  },
});
</script>

<template>
  <Modal :title="dialogTitle">
    <Form class="mx-4">
      <template #type="{ model, field }">
        <div class="w-full">
          <ElRadioGroup v-model="model[field]">
            <ElRadioButton :value="PmsProjectType.GENERAL">
              通用项目
            </ElRadioButton>
            <ElRadioButton :value="PmsProjectType.AGILE">
              敏捷开发项目
            </ElRadioButton>
          </ElRadioGroup>
          <div class="mt-2 text-[13px] text-[var(--el-text-color-secondary)]">
            {{ projectTypeTip(model[field]) }}
          </div>
        </div>
      </template>
    </Form>
  </Modal>
</template>
