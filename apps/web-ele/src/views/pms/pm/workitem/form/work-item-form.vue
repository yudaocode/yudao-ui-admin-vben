<script lang="ts" setup>
import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { ElButton, ElInput, ElMessage, ElSlider } from 'element-plus';

import { useVbenForm, z } from '#/adapter/form';
import { getProject } from '#/api/pms/pm/project';
import {
  createWorkItem,
  getWorkItem,
  updateWorkItem,
} from '#/api/pms/pm/workitem';
import {
  PmsProjectType,
  PmsWorkItemDefectType,
  PmsWorkItemPriority,
  PmsWorkItemType,
} from '#/views/pms/pm/utils/constants';

import WorkItemLabelList from '../label/label-list.vue';
import WorkItemLabelSelect from '../label/work-item-label-select.vue';
import { useWorkItemFormSchema } from './data';

defineOptions({ name: 'PmsWorkItemForm' });

const emit = defineEmits<{ success: [] }>();

type WorkItemFormType = 'create' | 'update';

interface WorkItemCreateContext {
  iterationId?: number;
  projectId: number;
  projectType: number;
  type: number;
}

// 定义 success 事件，用于操作成功后的回调

const formLoading = ref(false); // 表单加载中
const formType = ref<WorkItemFormType>('create'); // 表单类型
const projectId = ref(0); // 项目编号
const projectType = ref<number>(PmsProjectType.GENERAL); // 项目类型
const type = ref<number>(PmsWorkItemType.TASK); // 工作项类型
const formData = ref<PmsWorkItemApi.WorkItem>(getDefaultFormData()); // 表单数据
const workItemTypeName = computed(
  () => getDictLabel(DICT_TYPE.PMS_WORK_ITEM_TYPE, type.value) || '-',
); // 工作项业务名称
const dialogTitle = computed(
  () =>
    `${formType.value === 'create' ? '新建' : '编辑'}${workItemTypeName.value}`,
); // 弹窗标题
const labelSelectRef = ref<InstanceType<typeof WorkItemLabelSelect>>(); // 标签选择 Ref

/** 获得表单默认值 */
function getDefaultFormData(): PmsWorkItemApi.WorkItem {
  return {
    projectId: projectId.value,
    type: type.value,
    name: '',
    priority: PmsWorkItemPriority.MEDIUM,
    memberUserIds: [],
    progress: 0,
    defectType:
      type.value === PmsWorkItemType.DEFECT
        ? PmsWorkItemDefectType.FUNCTION
        : undefined,
    fileUrls: [],
    labelIds: [],
    childWorkItemNames: [],
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
  schema: useWorkItemFormSchema(workItemTypeName.value),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

/** 按工作项类型更新标题、描述等动态文案和父级工作项布局 */
function updateTypeSchema() {
  formApi.updateSchema([
    {
      fieldName: 'name',
      label: `${workItemTypeName.value}标题`,
      componentProps: {
        maxlength: 100,
        placeholder: `请输入${workItemTypeName.value}标题`,
      },
      rules: z
        .string({ message: `${workItemTypeName.value}标题不能为空` })
        .min(1, `${workItemTypeName.value}标题不能为空`),
    },
    {
      fieldName: 'description',
      label: `${workItemTypeName.value}描述`,
    },
    {
      fieldName: 'parentId',
      formItemClass:
        projectType.value === PmsProjectType.AGILE
          ? 'col-span-1'
          : 'col-span-2',
    },
  ]);
}

const [LabelManageModal, labelManageModalApi] = useVbenModal({
  destroyOnClose: true,
  connectedComponent: WorkItemLabelList,
});

/** 子工作项标题数组通过插槽的 componentField 写回 */
function handleChildNameChange(
  slotProps: any,
  index: number | string,
  value: number | string,
) {
  const next = [...(slotProps.componentField.modelValue || [])];
  next[Number(index)] = value;
  slotProps.componentField['onUpdate:modelValue'](next);
}

/** 删除子工作项标题 */
function handleChildNameRemove(slotProps: any, index: number | string) {
  const next = [...(slotProps.componentField.modelValue || [])];
  next.splice(Number(index), 1);
  slotProps.componentField['onUpdate:modelValue'](next);
}

/** 追加子工作项标题 */
function handleChildNameAppend(slotProps: any) {
  slotProps.componentField['onUpdate:modelValue']([
    ...(slotProps.componentField.modelValue || []),
    '',
  ]);
}

const [Modal, modalApi] = useVbenModal({
  class: 'w-[900px]',
  async onConfirm() {
    // 校验表单
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // 新增或修改工作项
    modalApi.lock();
    // 合并表单值，修改时保留工作项详情中的其他字段；隐藏的辅助字段不参与提交
    const {
      formType: _formType,
      projectType: _projectType,
      ...values
    } = await formApi.getValues();
    const data = {
      ...formData.value,
      ...values,
    } as PmsWorkItemApi.WorkItem;
    try {
      if (formType.value === 'create') {
        await createWorkItem(data);
        ElMessage.success('创建成功');
      } else {
        await updateWorkItem(data);
        ElMessage.success('更新成功');
      }
      await modalApi.close();
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
      createContext?: WorkItemCreateContext;
      formType: WorkItemFormType;
      id?: number;
    };
    formType.value = data.formType;
    formLoading.value = true;
    try {
      if (data.formType === 'update' && data.id) {
        // 修改场景通过工作项详情确定项目和事项类型
        const workItem = await getWorkItem(data.id);
        projectId.value = workItem.projectId;
        projectType.value = (await getProject(workItem.projectId)).type;
        type.value = workItem.type;
        formData.value = {
          ...workItem,
          fileUrls: workItem.fileUrls ?? [],
          labelIds: workItem.labelIds ?? [],
        };
        await formApi.reset();
        await formApi.setValues({
          ...formData.value,
          formType: formType.value,
          projectType: projectType.value,
        });
        updateTypeSchema();
        return;
      }
      // 新建场景没有工作项编号，需要由业务入口提供项目和事项类型
      if (!data.createContext) {
        return;
      }
      projectId.value = data.createContext.projectId;
      projectType.value = data.createContext.projectType;
      type.value = data.createContext.type;
      // 重置表单为默认值
      formData.value = getDefaultFormData();
      formData.value.iterationId = data.createContext.iterationId;
      await formApi.reset();
      await formApi.setValues({
        ...getDefaultFormData(),
        formType: formType.value,
        iterationId: data.createContext.iterationId,
        projectType: projectType.value,
      });
      updateTypeSchema();
    } finally {
      formLoading.value = false;
    }
  },
});
</script>

<template>
  <Modal :title="dialogTitle">
    <div class="max-h-[70vh] overflow-y-auto pr-2">
      <Form v-loading="formLoading" class="mx-4">
        <template #progress="slotProps">
          <ElSlider
            :max="100"
            :min="0"
            :model-value="slotProps.componentField.modelValue"
            show-input
            @update:model-value="slotProps.componentField['onUpdate:modelValue']"
          />
        </template>
        <template #labelIds="slotProps">
          <div class="flex w-full gap-2">
            <WorkItemLabelSelect
              ref="labelSelectRef"
              class="flex-1"
              :model-value="slotProps.componentField.modelValue"
              @update:model-value="slotProps.componentField['onUpdate:modelValue']"
            />
            <ElButton @click="labelManageModalApi.open()">标签管理</ElButton>
          </div>
        </template>
        <template #childWorkItemNames="slotProps">
          <div class="flex w-full flex-col gap-2">
            <div
              v-for="(_, index) in slotProps.componentField.modelValue"
              :key="index"
              class="flex items-center gap-2"
            >
              <ElInput
                maxlength="100"
                placeholder="请输入子工作项标题"
                :model-value="slotProps.componentField.modelValue[index]"
                @update:model-value="(v: string) => handleChildNameChange(slotProps, index, v)"
              />
              <ElButton link type="danger" @click="handleChildNameRemove(slotProps, index)">
                删除
              </ElButton>
            </div>
            <ElButton class="!w-fit" plain @click="handleChildNameAppend(slotProps)">
              <IconifyIcon class="mr-1" icon="ep:plus" />添加子工作项
            </ElButton>
          </div>
        </template>
      </Form>
    </div>
    <!-- 标签管理 -->
    <LabelManageModal @success="labelSelectRef?.getLabelList()" />
  </Modal>
</template>
