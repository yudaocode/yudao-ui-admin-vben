<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { PmsWorkItemApi } from '#/api/pms/pm/workitem';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Slider,
} from 'ant-design-vue';

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
const formRules = computed<Record<string, Rule[]>>(() => ({
  name: [{ required: true, message: `${workItemTypeName.value}标题不能为空` }],
  priority: [{ required: true, message: '优先级不能为空' }],
  startTime: [{ validator: validateWorkItemTimeRange }],
  endTime: [{ validator: validateWorkItemTimeRange }],
  defectType:
    type.value === PmsWorkItemType.DEFECT
      ? [{ required: true, message: '缺陷类型不能为空' }]
      : [],
})); // 表单校验规则
const formRef = ref(); // 表单 Ref
const labelSelectRef = ref<InstanceType<typeof WorkItemLabelSelect>>(); // 标签选择 Ref

/** 校验工作项时间范围 */
async function validateWorkItemTimeRange() {
  if (
    formData.value.startTime &&
    formData.value.endTime &&
    Number(formData.value.startTime) >= Number(formData.value.endTime)
  ) {
    throw new Error('开始时间必须早于截止时间');
  }
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
        message.success('创建成功');
      } else {
        await updateWorkItem(formData.value);
        message.success('更新成功');
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
      <Form
        ref="formRef"
        v-loading="formLoading"
        :label-col="{ style: { width: '96px' } }"
        :model="formData"
        :rules="formRules"
      >
        <!-- 基本信息 -->
        <Form.Item :label="`${workItemTypeName}标题`" name="name">
          <Input
            v-model:value="formData.name"
            :maxlength="100"
            :placeholder="`请输入${workItemTypeName}标题`"
          />
        </Form.Item>
        <Row :gutter="20">
          <Col :span="12">
            <Form.Item label="优先级" name="priority">
              <Select
                v-model:value="formData.priority"
                :options="
                  getDictOptions(
                    DICT_TYPE.PMS_WORK_ITEM_PRIORITY,
                    'number',
                  ).map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))
                "
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="负责人" name="assigneeUserId">
              <ProjectMemberSelect
                v-model="formData.assigneeUserId"
                :project-id="projectId"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row :gutter="20">
          <Col :span="12">
            <Form.Item label="开始时间" name="startTime">
              <DatePicker
                v-model:value="formData.startTime as any"
                allow-clear
                class="!w-full"
                placeholder="请选择开始时间"
                show-time
                value-format="x"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="截止时间" name="endTime">
              <DatePicker
                v-model:value="formData.endTime as any"
                allow-clear
                class="!w-full"
                placeholder="请选择截止时间"
                show-time
                value-format="x"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row :gutter="20">
          <Col v-if="projectType === PmsProjectType.AGILE" :span="12">
            <Form.Item label="所属迭代" name="iterationId">
              <IterationSelect
                v-model="formData.iterationId"
                :project-id="projectId"
              />
            </Form.Item>
          </Col>
          <Col :span="projectType === PmsProjectType.AGILE ? 12 : 24">
            <Form.Item label="父级工作项" name="parentId">
              <WorkItemSelect
                v-model="formData.parentId"
                :exclude-id="formData.id"
                placeholder="请选择父级工作项"
                :project-id="projectId"
                :type="type"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row
          v-if="
            projectType === PmsProjectType.AGILE &&
            type !== PmsWorkItemType.REQUIREMENT
          "
          :gutter="20"
        >
          <Col :span="12">
            <Form.Item label="关联需求" name="relatedRequirementId">
              <WorkItemSelect
                v-model="formData.relatedRequirementId"
                placeholder="请选择关联需求"
                :project-id="projectId"
                :type="PmsWorkItemType.REQUIREMENT"
              />
            </Form.Item>
          </Col>
          <Col v-if="type === PmsWorkItemType.DEFECT" :span="12">
            <Form.Item label="缺陷类型" name="defectType">
              <Select
                v-model:value="formData.defectType"
                :options="
                  getDictOptions(
                    DICT_TYPE.PMS_WORK_ITEM_DEFECT_TYPE,
                    'number',
                  ).map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))
                "
              />
            </Form.Item>
          </Col>
        </Row>
        <Row :gutter="20">
          <Col :span="12">
            <Form.Item label="预估工时" name="estimatedHours">
              <InputNumber
                v-model:value="formData.estimatedHours"
                class="!w-full"
                :min="0"
                placeholder="请输入预估工时"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="完成进度" name="progress">
              <div class="flex w-full items-center gap-2">
                <Slider
                  v-model:value="formData.progress"
                  class="flex-1"
                  :max="100"
                  :min="0"
                />
                <InputNumber
                  v-model:value="formData.progress"
                  :max="100"
                  :min="0"
                />
              </div>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="参与人" name="memberUserIds">
          <ProjectMemberSelect
            v-model="formData.memberUserIds"
            multiple
            :project-id="projectId"
          />
        </Form.Item>
        <Form.Item label="标签" name="labelIds">
          <div class="flex w-full gap-2">
            <WorkItemLabelSelect
              ref="labelSelectRef"
              v-model="formData.labelIds"
              class="flex-1"
            />
            <Button @click="labelManageModalApi.open()">标签管理</Button>
          </div>
        </Form.Item>
        <Form.Item :label="`${workItemTypeName}描述`" name="description">
          <RichTextarea v-model="formData.description" height="240px" />
        </Form.Item>
        <Form.Item label="附件" name="fileUrls">
          <FileUpload
            v-model="formData.fileUrls"
            :accept="['doc', 'xls', 'ppt', 'txt', 'pdf']"
            :max-number="5"
            :max-size="5"
          />
        </Form.Item>
        <template v-if="formType === 'create'">
          <Form.Item label="子工作项">
            <div class="flex w-full flex-col gap-2">
              <div
                v-for="(_, index) in formData.childWorkItemNames"
                :key="index"
                class="flex items-center gap-2"
              >
                <Input
                  v-model:value="formData.childWorkItemNames![index]"
                  :maxlength="100"
                  placeholder="请输入子工作项标题"
                />
                <Button
                  danger
                  type="link"
                  @click="formData.childWorkItemNames?.splice(index, 1)"
                >
                  删除
                </Button>
              </div>
              <Button
                class="!w-fit"
                @click="formData.childWorkItemNames?.push('')"
              >
                <IconifyIcon class="mr-1" icon="lucide:plus" />添加子工作项
              </Button>
            </div>
          </Form.Item>
          <Row :gutter="20">
            <Col :span="12">
              <Form.Item label="实际投入" name="actualHours">
                <InputNumber
                  v-model:value="formData.actualHours"
                  class="!w-full"
                  :min="1"
                  placeholder="请输入实际投入工时"
                />
              </Form.Item>
            </Col>
            <Col :span="12">
              <Form.Item label="剩余工时" name="remainingHours">
                <InputNumber
                  v-model:value="formData.remainingHours"
                  class="!w-full"
                  :min="0"
                  placeholder="请输入剩余工时"
                />
              </Form.Item>
            </Col>
          </Row>
        </template>
      </Form>
    </div>
    <!-- 标签管理 -->
    <LabelManageModal @success="labelSelectRef?.getLabelList()" />
  </Modal>
</template>
