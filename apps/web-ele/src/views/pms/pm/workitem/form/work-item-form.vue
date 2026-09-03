<script lang="ts" setup>
import type { FormRules } from 'element-plus';

import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElCol,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRow,
  ElSelect,
  ElSlider,
} from 'element-plus';

import { getProject } from '#/api/pms/pm/project';
import {
  createWorkItem,
  getWorkItem,
  updateWorkItem,
} from '#/api/pms/pm/workitem';
import { Tinymce as RichTextarea } from '#/components/tinymce';
import { FileUpload } from '#/components/upload';
import IterationSelect from '#/views/pms/pm/iteration/components/iteration-select.vue';
import ProjectMemberSelect from '#/views/pms/pm/project/components/project-member-select.vue';
import {
  PmsProjectType,
  PmsWorkItemDefectType,
  PmsWorkItemPriority,
  PmsWorkItemType,
} from '#/views/pms/pm/utils/constants';

import WorkItemSelect from '../components/work-item-select.vue';
import WorkItemLabelList from '../label/label-list.vue';
import WorkItemLabelSelect from '../label/work-item-label-select.vue';

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
const formRules = computed<FormRules>(() => ({
  name: [
    {
      required: true,
      message: `${workItemTypeName.value}标题不能为空`,
      trigger: 'blur',
    },
  ],
  priority: [{ required: true, message: '优先级不能为空', trigger: 'change' }],
  startTime: [{ validator: validateWorkItemTimeRange, trigger: 'change' }],
  endTime: [{ validator: validateWorkItemTimeRange, trigger: 'change' }],
  defectType:
    type.value === PmsWorkItemType.DEFECT
      ? [{ required: true, message: '缺陷类型不能为空', trigger: 'change' }]
      : [],
})); // 表单校验规则
const formRef = ref(); // 表单 Ref
const labelSelectRef = ref<InstanceType<typeof WorkItemLabelSelect>>(); // 标签选择 Ref

/** 校验工作项时间范围 */
function validateWorkItemTimeRange(
  _rule: unknown,
  _value: unknown,
  callback: (error?: Error) => void,
) {
  if (
    formData.value.startTime &&
    formData.value.endTime &&
    Number(formData.value.startTime) >= Number(formData.value.endTime)
  ) {
    callback(new Error('开始时间必须早于截止时间'));
    return;
  }
  callback();
}

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

/** 重置表单 */
function resetForm() {
  formData.value = getDefaultFormData();
  formRef.value?.resetFields();
}

const [LabelManageModal, labelManageModalApi] = useVbenModal({
  connectedComponent: WorkItemLabelList,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[900px]',
  async onConfirm() {
    // 校验表单
    if (
      !formRef.value ||
      !(await formRef.value.validate().catch(() => false))
    ) {
      return;
    }
    // 新增或修改工作项
    modalApi.lock();
    try {
      if (formType.value === 'create') {
        await createWorkItem(formData.value);
        ElMessage.success('创建成功');
      } else {
        await updateWorkItem(formData.value);
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
        return;
      }
      // 新建场景没有工作项编号，需要由业务入口提供项目和事项类型
      if (!data.createContext) {
        return;
      }
      projectId.value = data.createContext.projectId;
      projectType.value = data.createContext.projectType;
      type.value = data.createContext.type;
      resetForm();
      formData.value.iterationId = data.createContext.iterationId;
    } finally {
      formLoading.value = false;
    }
  },
});
</script>

<template>
  <Modal :title="dialogTitle">
    <div class="max-h-[70vh] overflow-y-auto pr-2">
      <ElForm
        ref="formRef"
        v-loading="formLoading"
        :model="formData"
        :rules="formRules"
        label-width="96px"
      >
        <!-- 基本信息 -->
        <ElFormItem :label="`${workItemTypeName}标题`" prop="name">
          <ElInput
            v-model="formData.name"
            maxlength="100"
            :placeholder="`请输入${workItemTypeName}标题`"
          />
        </ElFormItem>
        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="优先级" prop="priority">
              <ElSelect v-model="formData.priority" class="!w-full">
                <ElOption
                  v-for="option in getDictOptions(
                    DICT_TYPE.PMS_WORK_ITEM_PRIORITY,
                    'number',
                  )"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="负责人" prop="assigneeUserId">
              <ProjectMemberSelect
                v-model="formData.assigneeUserId"
                :project-id="projectId"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="开始时间" prop="startTime">
              <ElDatePicker
                v-model="formData.startTime"
                class="!w-full"
                clearable
                placeholder="请选择开始时间"
                type="datetime"
                value-format="x"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="截止时间" prop="endTime">
              <ElDatePicker
                v-model="formData.endTime"
                class="!w-full"
                clearable
                placeholder="请选择截止时间"
                type="datetime"
                value-format="x"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="20">
          <ElCol v-if="projectType === PmsProjectType.AGILE" :span="12">
            <ElFormItem label="所属迭代" prop="iterationId">
              <IterationSelect
                v-model="formData.iterationId"
                :project-id="projectId"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="projectType === PmsProjectType.AGILE ? 12 : 24">
            <ElFormItem label="父级工作项" prop="parentId">
              <WorkItemSelect
                v-model="formData.parentId"
                :exclude-id="formData.id"
                placeholder="请选择父级工作项"
                :project-id="projectId"
                :type="type"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow
          v-if="
            projectType === PmsProjectType.AGILE &&
            type !== PmsWorkItemType.REQUIREMENT
          "
          :gutter="20"
        >
          <ElCol :span="12">
            <ElFormItem label="关联需求" prop="relatedRequirementId">
              <WorkItemSelect
                v-model="formData.relatedRequirementId"
                placeholder="请选择关联需求"
                :project-id="projectId"
                :type="PmsWorkItemType.REQUIREMENT"
              />
            </ElFormItem>
          </ElCol>
          <ElCol v-if="type === PmsWorkItemType.DEFECT" :span="12">
            <ElFormItem label="缺陷类型" prop="defectType">
              <ElSelect v-model="formData.defectType" class="!w-full">
                <ElOption
                  v-for="option in getDictOptions(
                    DICT_TYPE.PMS_WORK_ITEM_DEFECT_TYPE,
                    'number',
                  )"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="预估工时" prop="estimatedHours">
              <ElInputNumber
                v-model="formData.estimatedHours"
                class="!w-full"
                :min="0"
                placeholder="请输入预估工时"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="完成进度" prop="progress">
              <ElSlider
                v-model="formData.progress"
                show-input
                :max="100"
                :min="0"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElFormItem label="参与人" prop="memberUserIds">
          <ProjectMemberSelect
            v-model="formData.memberUserIds"
            multiple
            :project-id="projectId"
          />
        </ElFormItem>
        <ElFormItem label="标签" prop="labelIds">
          <div class="flex w-full gap-2">
            <WorkItemLabelSelect
              ref="labelSelectRef"
              v-model="formData.labelIds"
              class="flex-1"
            />
            <ElButton @click="labelManageModalApi.open()">标签管理</ElButton>
          </div>
        </ElFormItem>
        <ElFormItem :label="`${workItemTypeName}描述`" prop="description">
          <RichTextarea v-model="formData.description" height="240px" />
        </ElFormItem>
        <ElFormItem label="附件" prop="fileUrls">
          <FileUpload
            v-model="formData.fileUrls"
            :accept="['doc', 'xls', 'ppt', 'txt', 'pdf']"
            :max-number="5"
            :max-size="5"
          />
        </ElFormItem>
        <template v-if="formType === 'create'">
          <ElFormItem label="子工作项">
            <div class="flex w-full flex-col gap-2">
              <div
                v-for="(_, index) in formData.childWorkItemNames"
                :key="index"
                class="flex items-center gap-2"
              >
                <ElInput
                  v-model="formData.childWorkItemNames![index]"
                  maxlength="100"
                  placeholder="请输入子工作项标题"
                />
                <ElButton
                  link
                  type="danger"
                  @click="formData.childWorkItemNames?.splice(index, 1)"
                >
                  删除
                </ElButton>
              </div>
              <ElButton
                class="!w-fit"
                plain
                @click="formData.childWorkItemNames?.push('')"
              >
                <IconifyIcon class="mr-1" icon="ep:plus" />添加子工作项
              </ElButton>
            </div>
          </ElFormItem>
          <ElRow :gutter="20">
            <ElCol :span="12">
              <ElFormItem label="实际投入" prop="actualHours">
                <ElInputNumber
                  v-model="formData.actualHours"
                  class="!w-full"
                  :min="1"
                  placeholder="请输入实际投入工时"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="剩余工时" prop="remainingHours">
                <ElInputNumber
                  v-model="formData.remainingHours"
                  class="!w-full"
                  :min="0"
                  placeholder="请输入剩余工时"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </template>
      </ElForm>
    </div>
    <!-- 标签管理 -->
    <LabelManageModal @success="labelSelectRef?.getLabelList()" />
  </Modal>
</template>
