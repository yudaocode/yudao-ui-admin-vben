<script lang="ts" setup>
import type { BpmProcessDefinitionApi } from '#/api/bpm/definition';
import type { BpmProcessInstanceApi } from '#/api/bpm/processInstance';

import { computed, nextTick, ref, watch } from 'vue';

import { useTabs } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { Button, Card, Col, message, Row, Space, Tabs } from 'ant-design-vue';

import { getProcessDefinition } from '#/api/bpm/definition';
import {
  createProcessInstance,
  getApprovalDetail as getApprovalDetailApi,
} from '#/api/bpm/processInstance';
import { router } from '#/router';
import {
  BpmCandidateStrategyEnum,
  BpmFieldPermissionType,
  BpmModelFormType,
  BpmModelType,
  BpmNodeIdEnum,
  decodeFields,
  setConfAndFields2,
} from '#/utils';
import ProcessInstanceSimpleViewer from '#/views/bpm/processInstance/detail/modules/simple-bpm-viewer.vue';
import ProcessInstanceTimeline from '#/views/bpm/processInstance/detail/modules/time-line.vue';

/** 类型定义 */
interface ProcessFormData {
  rule: any[];
  option: Record<string, any>;
  value: Record<string, any>;
}

interface UserTask {
  id: number;
  name: string;
}

defineOptions({ name: 'BpmProcessInstanceCreateForm' });

const props = defineProps({
  selectProcessDefinition: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['cancel']);

const { closeCurrentTab } = useTabs();

const getTitle = computed(() => {
  return `流程表单 - ${props.selectProcessDefinition.name}`;
});

const detailForm = ref<ProcessFormData>({
  rule: [],
  option: {},
  value: {},
});

const fApi = ref<any>();
const startUserSelectTasks = ref<UserTask[]>([]);
const startUserSelectAssignees = ref<Record<string, string[]>>({});
const tempStartUserSelectAssignees = ref<Record<string, string[]>>({});
const bpmnXML = ref<string | undefined>(undefined);
const simpleJson = ref<string | undefined>(undefined);
const timelineRef = ref<any>();
const activeTab = ref('form');
const activityNodes = ref<BpmProcessInstanceApi.ApprovalNodeInfo[]>([]);
const processInstanceStartLoading = ref(false);
/** 提交按钮 */
async function submitForm() {
  if (!fApi.value || !props.selectProcessDefinition) {
    return;
  }

  try {
    // 流程表单校验
    await fApi.value.validate();

    // 校验指定审批人
    if (startUserSelectTasks.value?.length > 0) {
      for (const userTask of startUserSelectTasks.value) {
        const assignees = startUserSelectAssignees.value[userTask.id];
        if (Array.isArray(assignees) && assignees.length === 0) {
          message.warning(`请选择${userTask.name}的候选人`);
          return;
        }
      }
    }

    // 提交请求
    processInstanceStartLoading.value = true;
    await createProcessInstance({
      processDefinitionId: props.selectProcessDefinition.id,
      variables: detailForm.value.value,
      startUserSelectAssignees: startUserSelectAssignees.value,
    });

    message.success('发起流程成功');

    // TODO @ziye：有告警哈；
    closeCurrentTab();

    await router.push({ path: '/bpm/task/my' });
  } catch (error) {
    console.error('发起流程失败:', error);
  } finally {
    processInstanceStartLoading.value = false;
  }
}

/** 设置表单信息、获取流程图数据 */
async function initProcessInfo(row: any, formVariables?: any) {
  // 重置指定审批人
  startUserSelectTasks.value = [];
  startUserSelectAssignees.value = {};

  // 情况一：流程表单
  if (row.formType === BpmModelFormType.NORMAL) {
    // 设置表单
    // 注意：需要从 formVariables 中，移除不在 row.formFields 的值。
    // 原因是：后端返回的 formVariables 里面，会有一些非表单的信息。例如说，某个流程节点的审批人。
    //        这样，就可能导致一个流程被审批不通过后，重新发起时，会直接后端报错！！！
    const allowedFields = new Set(
      decodeFields(row.formFields).map((fieldObj: any) => fieldObj.field),
    );
    for (const key in formVariables) {
      if (!allowedFields.has(key)) {
        delete formVariables[key];
      }
    }
    setConfAndFields2(detailForm, row.formConf, row.formFields, formVariables);

    await nextTick();
    fApi.value?.btn.show(false); // 隐藏提交按钮

    // 获取流程审批信息,当再次发起时，流程审批节点要根据原始表单参数预测出来
    await getApprovalDetail({
      id: row.id,
      processVariablesStr: JSON.stringify(formVariables),
    });

    // 加载流程图
    const processDefinitionDetail: BpmProcessDefinitionApi.ProcessDefinition =
      await getProcessDefinition(row.id);
    if (processDefinitionDetail) {
      bpmnXML.value = processDefinitionDetail.bpmnXml;
      simpleJson.value = processDefinitionDetail.simpleModel;
    }
    // 情况二：业务表单
  } else if (row.formCustomCreatePath) {
    await router.push({
      path: row.formCustomCreatePath,
    });
    // 这里暂时无需加载流程图，因为跳出到另外个 Tab；
  }
}

/** 预测流程节点会因为输入的参数值而产生新的预测结果值，所以需重新预测一次 */
watch(
  detailForm.value,
  (newValue) => {
    if (newValue && Object.keys(newValue.value).length > 0) {
      // 记录之前的节点审批人
      tempStartUserSelectAssignees.value = startUserSelectAssignees.value;
      startUserSelectAssignees.value = {};
      // 加载最新的审批详情
      getApprovalDetail({
        id: props.selectProcessDefinition.id,
        processVariablesStr: JSON.stringify(newValue.value), // 解决 GET 无法传递对象的问题，后端 String 再转 JSON
      });
    }
  },
  {
    immediate: true,
  },
);

/** 获取审批详情 */
async function getApprovalDetail(row: {
  id: string;
  processVariablesStr: string;
}) {
  try {
    const data = await getApprovalDetailApi({
      processDefinitionId: row.id,
      activityId: BpmNodeIdEnum.START_USER_NODE_ID,
      processVariablesStr: row.processVariablesStr,
    });

    if (!data) {
      message.error('查询不到审批详情信息！');
      return;
    }

    // 获取审批节点
    activityNodes.value = data.activityNodes;

    // 获取发起人自选的任务
    startUserSelectTasks.value = (data.activityNodes?.filter(
      (node) =>
        BpmCandidateStrategyEnum.START_USER_SELECT === node.candidateStrategy,
    ) || []) as unknown as UserTask[];

    // 恢复之前的选择审批人
    if (startUserSelectTasks.value.length > 0) {
      for (const node of startUserSelectTasks.value) {
        const tempAssignees = tempStartUserSelectAssignees.value[node.id];
        startUserSelectAssignees.value[node.id] = tempAssignees?.length
          ? tempAssignees
          : [];
      }
    }

    // 设置表单字段权限
    const formFieldsPermission = data.formFieldsPermission;
    if (formFieldsPermission) {
      Object.entries(formFieldsPermission).forEach(([field, permission]) => {
        setFieldPermission(field, permission as string);
      });
    }
  } catch (error) {
    message.error('获取审批详情失败');
    console.error('获取审批详情失败:', error);
  }
}

/**
 * 设置表单权限
 */
function setFieldPermission(field: string, permission: string) {
  if (permission === BpmFieldPermissionType.READ) {
    fApi.value?.disabled(true, field);
  }
  if (permission === BpmFieldPermissionType.WRITE) {
    fApi.value?.disabled(false, field);
  }
  if (permission === BpmFieldPermissionType.NONE) {
    fApi.value?.hidden(true, field);
  }
}

/** 取消发起审批 */
function handleCancel() {
  emit('cancel');
}

/** 选择发起人 */
function selectUserConfirm(activityId: string, userList: any[]) {
  if (!activityId || !Array.isArray(userList)) return;
  startUserSelectAssignees.value[activityId] = userList.map((item) => item.id);
}

defineExpose({ initProcessInfo });
</script>

<template>
  <Card
    :title="getTitle"
    class="h-full overflow-hidden"
    :body-style="{
      height: 'calc(100% - 112px)',
      paddingTop: '12px',
      overflowY: 'auto',
    }"
  >
    <template #extra>
      <Space wrap>
        <Button plain type="default" @click="handleCancel">
          <IconifyIcon icon="lucide:arrow-left" />&nbsp; 返回
        </Button>
      </Space>
    </template>

    <Tabs
      v-model:active-key="activeTab"
      class="flex flex-1 flex-col overflow-hidden"
    >
      <Tabs.TabPane tab="表单填写" key="form">
        <Row :gutter="[48, 16]" class="pt-4">
          <Col
            :xs="24"
            :sm="24"
            :md="18"
            :lg="18"
            :xl="18"
            class="flex-1 overflow-auto"
          >
            <form-create
              :rule="detailForm.rule"
              v-model:api="fApi"
              v-model="detailForm.value"
              :option="detailForm.option"
              @submit="submitForm"
            />
          </Col>
          <Col :xs="24" :sm="24" :md="6" :lg="6" :xl="6">
            <ProcessInstanceTimeline
              ref="timelineRef"
              :activity-nodes="activityNodes"
              :show-status-icon="false"
              @select-user-confirm="selectUserConfirm"
            />
          </Col>
        </Row>
      </Tabs.TabPane>

      <Tabs.TabPane
        tab="流程图"
        key="flow"
        class="flex flex-1 overflow-hidden"
        :force-render="true"
      >
        <div class="w-full">
          <ProcessInstanceSimpleViewer
            :simple-json="simpleJson"
            v-if="selectProcessDefinition.modelType === BpmModelType.SIMPLE"
          />
        </div>
      </Tabs.TabPane>
    </Tabs>

    <template #actions>
      <template v-if="activeTab === 'form'">
        <Space wrap class="flex w-full justify-center">
          <Button
            plain
            type="primary"
            @click="submitForm"
            :loading="processInstanceStartLoading"
          >
            <IconifyIcon icon="lucide:check" />
            发起
          </Button>
          <Button plain type="default" @click="handleCancel">
            <IconifyIcon icon="lucide:x" />
            取消
          </Button>
        </Space>
      </template>
    </template>
  </Card>
</template>
