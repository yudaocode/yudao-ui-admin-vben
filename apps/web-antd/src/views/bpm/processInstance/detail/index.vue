<script lang="ts" setup>
import type { BpmProcessInstanceApi } from '#/api/bpm/processInstance';
import type { SystemUserApi } from '#/api/system/user';

import { nextTick, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  SvgBpmApproveIcon,
  SvgBpmCancelIcon,
  SvgBpmRejectIcon,
  SvgBpmRunningIcon,
} from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import {
  Avatar,
  Button,
  Card,
  Col,
  message,
  Row,
  TabPane,
  Tabs,
} from 'ant-design-vue';

import {
  getApprovalDetail as getApprovalDetailApi,
  getProcessInstanceBpmnModelView,
} from '#/api/bpm/processInstance';
import { getSimpleUserList } from '#/api/system/user';
import DictTag from '#/components/dict-tag/dict-tag.vue';
import {
  BpmModelFormType,
  BpmModelType,
  DICT_TYPE,
  registerComponent,
  setConfAndFields2,
  TaskStatusEnum,
} from '#/utils';

import TimeLine from './modules/time-line.vue';

defineOptions({ name: 'BpmProcessInstanceDetail' });

const props = defineProps<{
  activityId?: string; // 流程活动编号，用于抄送查看
  id: string; // 流程实例的编号
  taskId?: string; // 任务编号
}>();

enum FieldPermissionType {
  /**
   * 隐藏
   */
  // eslint-disable-next-line no-unused-vars
  NONE = '3',
  /**
   * 只读
   */
  // eslint-disable-next-line no-unused-vars
  READ = '1',
  /**
   * 编辑
   */
  // eslint-disable-next-line no-unused-vars
  WRITE = '2',
}

const processInstanceLoading = ref(false); // 流程实例的加载中
const processInstance = ref<BpmProcessInstanceApi.ProcessInstanceVO>(); // 流程实例
const processDefinition = ref<any>({}); // 流程定义
const processModelView = ref<any>({}); // 流程模型视图
// const operationButtonRef = ref(); // 操作按钮组件 ref
const auditIconsMap: {
  [key: string]:
    | typeof SvgBpmApproveIcon
    | typeof SvgBpmCancelIcon
    | typeof SvgBpmRejectIcon
    | typeof SvgBpmRunningIcon;
} = {
  [TaskStatusEnum.RUNNING]: SvgBpmRunningIcon,
  [TaskStatusEnum.APPROVE]: SvgBpmApproveIcon,
  [TaskStatusEnum.REJECT]: SvgBpmRejectIcon,
  [TaskStatusEnum.CANCEL]: SvgBpmCancelIcon,
  [TaskStatusEnum.APPROVING]: SvgBpmApproveIcon,
  [TaskStatusEnum.RETURN]: SvgBpmRejectIcon,
  [TaskStatusEnum.WAIT]: SvgBpmRunningIcon,
};

// ========== 申请信息 ==========
const fApi = ref<any>(); //
const detailForm = ref({
  rule: [],
  option: {},
  value: {},
}); // 流程实例的表单详情

const writableFields: Array<string> = []; // 表单可以编辑的字段

/** 加载流程实例 */
const BusinessFormComponent = ref<any>(null); // 异步组件

/** 获取详情 */
async function getDetail() {
  // 获得审批详情
  getApprovalDetail();

  // 获得流程模型视图
  getProcessModelView();
}

async function getApprovalDetail() {
  processInstanceLoading.value = true;
  try {
    const param = {
      processInstanceId: props.id,
      activityId: props.activityId,
      taskId: props.taskId,
    };
    const data = await getApprovalDetailApi(param);

    if (!data) {
      message.error('查询不到审批详情信息！');
    }

    if (!data.processDefinition || !data.processInstance) {
      message.error('查询不到流程信息！');
    }

    processInstance.value = data.processInstance;
    processDefinition.value = data.processDefinition;

    // 设置表单信息
    if (processDefinition.value.formType === BpmModelFormType.NORMAL) {
      // 获取表单字段权限
      const formFieldsPermission = data.formFieldsPermission;
      // 清空可编辑字段为空
      writableFields.splice(0);
      if (detailForm.value.rule?.length > 0) {
        // 避免刷新 form-create 显示不了
        detailForm.value.value = processInstance.value.formVariables;
      } else {
        setConfAndFields2(
          detailForm,
          processDefinition.value.formConf,
          processDefinition.value.formFields,
          processInstance.value.formVariables,
        );

        detailForm.value.value.Fx21maervo4ratc = undefined;
        detailForm.value.value.F3yvmaervlwuanc = undefined;
      }
      nextTick().then(() => {
        fApi.value?.btn.show(false);
        fApi.value?.resetBtn.show(false);
        fApi.value?.disabled(true);
        // 设置表单字段权限
        if (formFieldsPermission) {
          Object.keys(data.formFieldsPermission).forEach((item) => {
            setFieldPermission(item, formFieldsPermission[item]);
          });
        }
      });
    } else {
      // 注意：data.processDefinition.formCustomViewPath 是组件的全路径，例如说：/crm/contract/detail/index.vue
      BusinessFormComponent.value = registerComponent(
        data?.processDefinition?.formCustomViewPath || '',
      );
    }

    // 获取审批节点，显示 Timeline 的数据
    activityNodes.value = data.activityNodes;
  } catch (error) {
    console.error('🚀 ~ getApprovalDetail ~ error:', error);
  } finally {
    processInstanceLoading.value = false;
  }
}

/** 获取流程模型视图*/
const getProcessModelView = async () => {
  if (BpmModelType.BPMN === processDefinition.value?.modelType) {
    // 重置，解决 BPMN 流程图刷新不会重新渲染问题
    processModelView.value = {
      bpmnXml: '',
    };
  }
  const data = await getProcessInstanceBpmnModelView(props.id);
  if (data) {
    processModelView.value = data;
  }
};

// 审批节点信息
const activityNodes = ref<BpmProcessInstanceApi.ApprovalNodeInfo[]>([]);
/**
 * 设置表单权限
 */
const setFieldPermission = (field: string, permission: string) => {
  if (permission === FieldPermissionType.READ) {
    // @ts-ignore
    fApi.value?.disabled(true, field);
  }
  if (permission === FieldPermissionType.WRITE) {
    // @ts-ignore
    fApi.value?.disabled(false, field);
    // 加入可以编辑的字段
    writableFields.push(field);
  }
  if (permission === FieldPermissionType.NONE) {
    // @ts-ignore
    fApi.value?.hidden(true, field);
  }
};

/**
 * 操作成功后刷新
 */
// const refresh = () => {
//   // 重新获取详情
//   getDetail();
// };

/** 当前的Tab */
const activeTab = ref('form');

/** 初始化 */
const userOptions = ref<SystemUserApi.User[]>([]); // 用户列表
onMounted(async () => {
  getDetail();
  // 获得用户列表
  userOptions.value = await getSimpleUserList();
});
</script>

<template>
  <Page auto-content-height>
    <Card
      class="h-full"
      :body-style="{ height: 'calc(100% - 140px)', overflowY: 'auto' }"
    >
      <template #title>
        <span class="text-[#878c93]">编号：{{ id || '-' }}</span>
      </template>

      <div class="flex h-[100%] flex-col">
        <!-- 流程基本信息 -->
        <div class="flex flex-col gap-2">
          <div class="mb-10px h-40px flex items-center gap-5">
            <div class="mb-5px text-[26px] font-bold">
              {{ processInstance?.name }}
            </div>
            <DictTag
              v-if="processInstance?.status"
              :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
              :value="processInstance.status"
            />
          </div>

          <div class="mb-10px text-13px h-35px flex items-center gap-5">
            <div
              class="flex items-center gap-2 rounded-3xl bg-gray-100 px-[10px] py-[4px] dark:bg-gray-600"
            >
              <Avatar
                :size="28"
                v-if="processInstance?.startUser?.avatar"
                :src="processInstance?.startUser?.avatar"
              />
              <Avatar
                :size="28"
                v-else-if="processInstance?.startUser?.nickname"
              >
                {{ processInstance?.startUser?.nickname.substring(0, 1) }}
              </Avatar>
              <span class="text-12px">{{
                processInstance?.startUser?.nickname
              }}</span>
            </div>
            <div class="text-[#878c93]">
              {{ formatDateTime(processInstance?.startTime) }} 提交
            </div>
          </div>

          <component
            v-if="processInstance?.status"
            :is="auditIconsMap[processInstance?.status]"
            class="absolute right-[20px] top-[10px] size-[150px]"
          />
        </div>

        <!-- 流程操作 -->
        <div class="flex-1">
          <Tabs v-model:active-key="activeTab" class="mt-0">
            <TabPane tab="审批详情" key="form">
              <Row :gutter="[48, 24]">
                <Col :xs="24" :sm="24" :md="18" :lg="18" :xl="16">
                  <!-- 流程表单 -->
                  <div
                    v-if="
                      processDefinition?.formType === BpmModelFormType.NORMAL
                    "
                  >
                    <!-- v-model="detailForm.value" -->
                    <form-create
                      v-model="detailForm.value"
                      v-model:api="fApi"
                      :option="detailForm.option"
                      :rule="detailForm.rule"
                    />
                  </div>

                  <div
                    v-if="
                      processDefinition?.formType === BpmModelFormType.CUSTOM
                    "
                  >
                    <BusinessFormComponent :id="processInstance?.businessKey" />
                  </div>
                </Col>
                <Col :xs="24" :sm="24" :md="6" :lg="6" :xl="8">
                  <div class="mt-2">
                    <TimeLine :activity-nodes="activityNodes" />
                  </div>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="流程图" key="diagram">
              <div>流程图</div>
            </TabPane>

            <TabPane tab="流转记录" key="record">
              <div>流转记录</div>
            </TabPane>

            <!-- TODO 待开发 -->
            <TabPane tab="流转评论" key="comment" v-if="false">
              <div>流转评论</div>
            </TabPane>
          </Tabs>
        </div>
      </div>

      <template #actions>
        <div class="flex justify-start gap-x-2 p-4">
          <Button type="primary">驳回</Button>
          <Button type="primary">同意</Button>
        </div>
      </template>
    </Card>
  </Page>
</template>
