<script lang="ts" setup>
import type { HrmSalarySlipSendRecordApi } from '#/api/hrm/salary/slip/send-record';
import type { HrmSalarySlipTemplateApi } from '#/api/hrm/salary/slip/template';

import { computed, ref } from 'vue';

import { confirm, prompt, useVbenModal } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import {
  Button,
  Empty,
  message,
  Select,
  Spin,
  Steps,
  Switch,
  Table,
  Tag,
} from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  getSalarySlipSendEmployeePage,
  sendSalarySlip,
} from '#/api/hrm/salary/slip/send-record';
import {
  createSalarySlipTemplate,
  deleteSalarySlipTemplate,
  getSalarySlipTemplateList,
} from '#/api/hrm/salary/slip/template';
import { getSimpleDeptList } from '#/api/system/dept';
import { HrmSalaryOptionCategoryCode } from '#/views/hrm/utils/constants';
import { formatHrmMoney } from '#/views/hrm/utils/format';

import TemplateForm from '../../template/modules/template-form.vue';
import TemplateOptionEditor from '../../template/modules/template-option-editor.vue';

defineOptions({ name: 'HrmSalarySlipSendForm' });

const emit = defineEmits(['success']);

const currentStep = ref(0);
const sendLoading = ref(false);
const templateLoading = ref(false);
const employeeLoading = ref(false);
const employeeLoaded = ref(false);
const employeeTotal = ref(0);
const monthRecordId = ref<number>();
const employeeList = ref<HrmSalarySlipSendRecordApi.SendEmployee[]>([]);
const selectedEmployeeIdSet = ref<Set<number>>(new Set());
const templateList = ref<HrmSalarySlipTemplateApi.SalarySlipTemplate[]>([]);
const selectedTemplateId = ref<number>();
const sendTemplate = ref<HrmSalarySlipTemplateApi.SalarySlipTemplate>();
const templateFormRef = ref<InstanceType<typeof TemplateForm>>();
const templateEditorRef = ref<InstanceType<typeof TemplateOptionEditor>>();

const selectedEmployeeIds = computed(() => [...selectedEmployeeIdSet.value]);
const selectedTemplate = computed(() =>
  templateList.value.find(
    (template) => template.id === selectedTemplateId.value,
  ),
);

const [SearchForm, searchFormApi] = useVbenForm({
  commonConfig: {
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: [
    {
      fieldName: 'search',
      label: '员工筛选',
      component: 'Input',
      componentProps: {
        allowClear: true,
        class: 'w-[220px]',
        placeholder: '请输入员工姓名',
      },
    },
    {
      fieldName: 'deptId',
      label: '部门',
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: async () => handleTree(await getSimpleDeptList()),
        class: 'w-[220px]',
        fieldNames: { label: 'name', value: 'id', children: 'children' },
        placeholder: '请选择部门',
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'sent',
      label: '发送状态',
      component: 'Select',
      defaultValue: false,
      componentProps: {
        allowClear: true,
        class: 'w-[150px]',
        options: [
          { label: '未发送', value: false },
          { label: '已发送', value: true },
        ],
        placeholder: '发送状态',
      },
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  footer: false,
  onOpenChange(isOpen) {
    if (!isOpen) {
      currentStep.value = 0;
      monthRecordId.value = undefined;
      employeeList.value = [];
      employeeTotal.value = 0;
      employeeLoaded.value = false;
      selectedEmployeeIdSet.value = new Set();
      selectedTemplateId.value = undefined;
      sendTemplate.value = undefined;
    }
  },
  title: '发送工资条',
});

async function open(recordId: number) {
  monthRecordId.value = recordId;
  currentStep.value = 0;
  selectedTemplateId.value = undefined;
  sendTemplate.value = undefined;
  employeeLoaded.value = false;
  employeeList.value = [];
  employeeTotal.value = 0;
  selectedEmployeeIdSet.value = new Set();
  await searchFormApi.resetForm();
  await searchFormApi.setValues({ sent: false });
  modalApi.open();
  await loadTemplates();
}

async function loadTemplates(preferredId?: number) {
  templateLoading.value = true;
  try {
    const currentTemplateId = preferredId || selectedTemplateId.value;
    templateList.value = await getSalarySlipTemplateList();
    selectedTemplateId.value =
      templateList.value.find((template) => template.id === currentTemplateId)
        ?.id ||
      templateList.value.find((template) => template.defaultStatus)?.id ||
      templateList.value[0]?.id;
    handleTemplateChange(selectedTemplateId.value);
  } finally {
    templateLoading.value = false;
  }
}

function handleTemplateChange(id?: number) {
  const template = templateList.value.find((item) => item.id === id);
  sendTemplate.value = template
    ? {
        ...template,
        options: (template.options || []).map((item) => ({
          ...item,
          parentCode:
            item.parentCode === HrmSalaryOptionCategoryCode.ROOT
              ? undefined
              : item.parentCode,
        })),
      }
    : undefined;
}

async function handleNextStep() {
  if (!sendTemplate.value) {
    message.warning('请先选择或新增工资条模板');
    return;
  }
  const validateMessage = templateEditorRef.value?.validate();
  if (validateMessage) {
    message.warning(validateMessage);
    return;
  }
  currentStep.value = 1;
  if (!employeeLoaded.value) {
    await loadEmployees();
  }
}

async function loadEmployees(pageNo = 1, pageSize = 10) {
  if (!monthRecordId.value) {
    return;
  }
  employeeLoading.value = true;
  try {
    const formValues = await searchFormApi.getValues();
    const data = await getSalarySlipSendEmployeePage({
      deptId: formValues.deptId,
      monthRecordId: monthRecordId.value,
      pageNo,
      pageSize,
      search: formValues.search,
      sent: formValues.sent,
    });
    employeeList.value = data.list;
    employeeTotal.value = data.total;
    employeeLoaded.value = true;
  } finally {
    employeeLoading.value = false;
  }
}

async function handleQuery() {
  await loadEmployees();
}

async function resetQuery() {
  await searchFormApi.resetForm();
  await searchFormApi.setValues({ sent: false });
  await loadEmployees();
}

function handleSelectionChange(
  selectedRowKeys: (number | string)[],
  selectedRows: HrmSalarySlipSendRecordApi.SendEmployee[],
) {
  employeeList.value.forEach((row) =>
    selectedEmployeeIdSet.value.delete(row.employeeId),
  );
  selectedRows.forEach((row) =>
    selectedEmployeeIdSet.value.add(row.employeeId),
  );
  selectedEmployeeIdSet.value = new Set(selectedEmployeeIdSet.value);
  void selectedRowKeys;
}

async function submitForm(all: boolean) {
  if (
    !monthRecordId.value ||
    !sendTemplate.value ||
    (!all && selectedEmployeeIds.value.length === 0)
  ) {
    message.warning('请选择发放员工');
    return;
  }
  sendLoading.value = true;
  try {
    const formValues = await searchFormApi.getValues();
    await sendSalarySlip({
      all,
      deptId: all ? formValues.deptId : undefined,
      employeeIds: all ? undefined : selectedEmployeeIds.value,
      hideEmpty: Boolean(sendTemplate.value.hideEmpty),
      monthRecordId: monthRecordId.value,
      options: templateEditorRef.value?.getNormalizedOptions() || [],
      search: all ? formValues.search : undefined,
      sent: all ? formValues.sent : undefined,
    });
    message.success('发放成功');
    await modalApi.close();
    emit('success');
  } finally {
    sendLoading.value = false;
  }
}

async function handleTemplateSuccess(id: number) {
  await loadTemplates(id);
}

async function handleSaveAsTemplate() {
  if (!sendTemplate.value) {
    return;
  }
  try {
    const result = await prompt({
      content: '请输入新模板名称',
      title: '另存为模板',
    });
    const name = result.trim();
    if (!name) {
      message.warning('模板名称不能为空');
      return;
    }
    if (name.length > 64) {
      message.warning('模板名称不能超过 64 个字符');
      return;
    }
    const id = await createSalarySlipTemplate({
      hideEmpty: Boolean(sendTemplate.value.hideEmpty),
      name,
      options: templateEditorRef.value?.getNormalizedOptions() || [],
    });
    message.success('创建成功');
    await loadTemplates(id);
  } catch {}
}

async function handleDeleteTemplate(id?: number) {
  if (!id) {
    return;
  }
  try {
    await confirm({ content: '确认删除该工资条模板吗？', title: '删除确认' });
    await deleteSalarySlipTemplate(id);
    message.success('删除成功');
    await loadTemplates();
  } catch {}
}

defineExpose({ open });
</script>

<template>
  <Modal class="w-[1180px]">
    <Steps
      :current="currentStep"
      class="mx-auto mb-6 max-w-[680px]"
      label-placement="vertical"
      :items="[{ title: '设置工资条模板' }, { title: '选择发放员工' }]"
    />

    <Spin :spinning="templateLoading">
      <div v-if="currentStep === 0">
        <div class="mb-4 grid grid-cols-[100px_1fr] items-center gap-y-4">
          <span class="text-right text-muted-foreground">工资条模板</span>
          <div class="flex flex-wrap items-center gap-3">
            <Select
              v-model:value="selectedTemplateId"
              :options="
                templateList.map((template) => ({
                  label: template.name,
                  value: template.id,
                }))
              "
              allow-clear
              class="min-w-[240px] flex-1"
              placeholder="请选择工资条模板"
              show-search
              @change="handleTemplateChange"
            />
            <Button
              v-access:code="['hrm:salary:slip:update']"
              type="primary"
              @click="templateFormRef?.open('create')"
            >
              新增模板
            </Button>
            <Button
              v-access:code="['hrm:salary:slip:update']"
              :disabled="!selectedTemplate || selectedTemplate.defaultStatus"
              @click="templateFormRef?.open('update', selectedTemplateId)"
            >
              编辑模板
            </Button>
            <Button
              v-access:code="['hrm:salary:slip:delete']"
              :disabled="!selectedTemplate || selectedTemplate.defaultStatus"
              danger
              @click="handleDeleteTemplate(selectedTemplateId)"
            >
              删除模板
            </Button>
          </div>
        </div>
        <Empty
          v-if="!sendTemplate"
          description="暂无工资条模板，请先新增模板"
        />
        <template v-else>
          <div class="mb-4 grid grid-cols-[100px_1fr] items-center">
            <span class="text-right text-muted-foreground">隐藏空项</span>
            <Switch
              v-model:checked="sendTemplate.hideEmpty"
              checked-children="隐藏金额为空的工资项"
              un-checked-children="保留全部工资项"
            />
          </div>
          <div class="mb-2 text-sm font-medium">模板明细</div>
          <TemplateOptionEditor
            ref="templateEditorRef"
            v-model="sendTemplate.options"
            :max-height="320"
          >
            <template #actions>
              <Button
                v-access:code="['hrm:salary:slip:update']"
                @click="handleSaveAsTemplate"
              >
                另存为模板
              </Button>
            </template>
          </TemplateOptionEditor>
        </template>
      </div>
    </Spin>

    <Spin :spinning="sendLoading">
      <div v-if="currentStep === 1">
        <SearchForm class="mb-4" />
        <div class="mb-4 flex gap-2">
          <Button @click="handleQuery">搜索</Button>
          <Button @click="resetQuery">重置</Button>
        </div>
        <Table
          :columns="[
            { dataIndex: 'employeeName', title: '员工', width: 120 },
            { dataIndex: 'jobNumber', title: '工号', width: 110 },
            { dataIndex: 'deptName', title: '部门', width: 130 },
            { dataIndex: 'postName', title: '岗位', width: 130 },
            { dataIndex: 'mobile', title: '手机号', width: 130 },
            { dataIndex: 'sent', title: '发送状态', width: 100 },
            { dataIndex: 'expectedPaySalary', title: '应发工资', width: 120 },
            { dataIndex: 'realPaySalary', title: '实发工资', width: 120 },
          ]"
          :data-source="employeeList"
          :loading="employeeLoading"
          :pagination="{
            current: 1,
            pageSize: 10,
            total: employeeTotal,
            onChange: (page, pageSize) => loadEmployees(page, pageSize),
          }"
          :row-selection="{
            selectedRowKeys: selectedEmployeeIds,
            onChange: handleSelectionChange,
            preserveSelectedRowKeys: true,
          }"
          bordered
          row-key="employeeId"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'sent'">
              <Tag :color="record.sent ? 'success' : 'default'">
                {{ record.sent ? '已发送' : '未发送' }}
              </Tag>
            </template>
            <template v-else-if="column.dataIndex === 'expectedPaySalary'">
              {{ formatHrmMoney(record.expectedPaySalary) }}
            </template>
            <template v-else-if="column.dataIndex === 'realPaySalary'">
              {{ formatHrmMoney(record.realPaySalary) }}
            </template>
          </template>
        </Table>
      </div>
    </Spin>

    <div class="mt-6 flex items-center justify-end gap-3 border-t pt-4">
      <template v-if="currentStep === 0">
        <Button type="primary" @click="handleNextStep">下一步</Button>
      </template>
      <template v-else>
        <span class="mr-3 text-muted-foreground">
          已选 {{ selectedEmployeeIds.length }} 人
        </span>
        <Button @click="currentStep = 0">上一步</Button>
        <Button
          :loading="sendLoading"
          type="primary"
          @click="submitForm(false)"
        >
          发放已选员工
        </Button>
        <Button
          :disabled="!employeeTotal"
          :loading="sendLoading"
          type="primary"
          @click="submitForm(true)"
        >
          全部发放
        </Button>
      </template>
      <Button @click="modalApi.close()">取消</Button>
    </div>

    <TemplateForm ref="templateFormRef" @success="handleTemplateSuccess" />
  </Modal>
</template>
