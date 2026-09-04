<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalarySlipSendRecordApi } from '#/api/hrm/salary/slip/send-record';
import type { HrmSalarySlipTemplateApi } from '#/api/hrm/salary/slip/template';

import { computed, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import {
  ElButton,
  ElEmpty,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElStep,
  ElSteps,
  ElSwitch,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
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

import TemplateForm from '../../template/modules/template-form.vue';
import TemplateOptionEditor from '../../template/modules/template-option-editor.vue';
import { useSendEmployeeGridColumns } from '../data';

defineOptions({ name: 'HrmSalarySlipSendForm' });

const emit = defineEmits(['success']);

const currentStep = ref(0);
const sendLoading = ref(false);
const templateLoading = ref(false);
const employeeLoaded = ref(false);
const employeeTotal = ref(0);
const monthRecordId = ref<number>();
const selectedEmployeeIdSet = ref<Set<number>>(new Set());
const templateList = ref<HrmSalarySlipTemplateApi.SalarySlipTemplate[]>([]);
const selectedTemplateId = ref<number>();
const sendTemplate = ref<HrmSalarySlipTemplateApi.SalarySlipTemplate>();
const templateEditorRef = ref<InstanceType<typeof TemplateOptionEditor>>();

const [TemplateFormModal, templateFormModalApi] = useVbenModal({
  connectedComponent: TemplateForm,
  destroyOnClose: true,
});

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
        clearable: true,
        class: 'w-[220px]',
        placeholder: '请输入员工姓名',
      },
    },
    {
      fieldName: 'deptId',
      label: '部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        checkStrictly: true,
        class: 'w-[220px]',
        clearable: true,
        defaultExpandAll: true,
        fieldNames: { label: 'name', value: 'id', children: 'children' },
        placeholder: '请选择部门',
      },
    },
    {
      fieldName: 'sent',
      label: '发送状态',
      component: 'Select',
      defaultValue: false,
      componentProps: {
        clearable: true,
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

function handleSelectionChange() {
  const records = [
    ...(employeeGridApi.grid.getCheckboxReserveRecords?.() || []),
    ...(employeeGridApi.grid.getCheckboxRecords?.() || []),
  ] as HrmSalarySlipSendRecordApi.SendEmployee[];
  selectedEmployeeIdSet.value = new Set(
    records.map((record) => record.employeeId),
  );
}

const [EmployeeGrid, employeeGridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    checkboxConfig: { highlight: true, reserve: true },
    columns: useSendEmployeeGridColumns(),
    height: 380,
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async ({ page }) => {
          if (!monthRecordId.value) return { list: [], total: 0 };
          const formValues = await searchFormApi.getValues();
          const data = await getSalarySlipSendEmployeePage({
            deptId: formValues.deptId,
            monthRecordId: monthRecordId.value,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            search: formValues.search,
            sent: formValues.sent,
          });
          employeeLoaded.value = true;
          employeeTotal.value = data.total;
          return data;
        },
      },
    },
    rowConfig: { keyField: 'employeeId', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<HrmSalarySlipSendRecordApi.SendEmployee>,
  gridEvents: {
    checkboxAll: handleSelectionChange,
    checkboxChange: handleSelectionChange,
  },
});

const [Modal, modalApi] = useVbenModal({
  footer: false,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      currentStep.value = 0;
      monthRecordId.value = undefined;
      employeeTotal.value = 0;
      employeeLoaded.value = false;
      selectedEmployeeIdSet.value = new Set();
      selectedTemplateId.value = undefined;
      sendTemplate.value = undefined;
      return;
    }
    const recordId = modalApi.getData() as number | undefined;
    if (!recordId) return;
    monthRecordId.value = recordId;
    currentStep.value = 0;
    selectedTemplateId.value = undefined;
    sendTemplate.value = undefined;
    employeeLoaded.value = false;
    employeeTotal.value = 0;
    selectedEmployeeIdSet.value = new Set();
    await employeeGridApi.grid.clearCheckboxRow();
    await employeeGridApi.grid.clearCheckboxReserve();
    await searchFormApi.reset();
    await searchFormApi.setValues({ sent: false });
    await loadTemplates();
  },
  title: '发送工资条',
});

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
    ElMessage.warning('请先选择或新增工资条模板');
    return;
  }
  const validateMessage = templateEditorRef.value?.validate();
  if (validateMessage) {
    ElMessage.warning(validateMessage);
    return;
  }
  currentStep.value = 1;
  if (!employeeLoaded.value) {
    await loadEmployees();
  }
}

async function loadEmployees() {
  if (monthRecordId.value) await employeeGridApi.query();
}

async function handleQuery() {
  await loadEmployees();
}

async function resetQuery() {
  await searchFormApi.reset();
  await searchFormApi.setValues({ sent: false });
  await loadEmployees();
}

async function submitForm(all: boolean) {
  if (
    !monthRecordId.value ||
    !sendTemplate.value ||
    (!all && selectedEmployeeIds.value.length === 0)
  ) {
    ElMessage.warning('请选择发放员工');
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
    ElMessage.success('发放成功');
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
  let value: string;
  try {
    ({ value } = await ElMessageBox.prompt('请输入新模板名称', '另存为模板'));
  } catch {
    return;
  }
  const name = value.trim();
  if (!name) {
    ElMessage.warning('模板名称不能为空');
    return;
  }
  if (name.length > 64) {
    ElMessage.warning('模板名称不能超过 64 个字符');
    return;
  }
  const id = await createSalarySlipTemplate({
    hideEmpty: Boolean(sendTemplate.value.hideEmpty),
    name,
    options: templateEditorRef.value?.getNormalizedOptions() || [],
  });
  ElMessage.success('创建成功');
  await loadTemplates(id);
}

async function handleDeleteTemplate(id?: number) {
  if (!id) {
    return;
  }
  try {
    await confirm({ content: '确认删除该工资条模板吗？', title: '删除确认' });
  } catch {
    return;
  }
  await deleteSalarySlipTemplate(id);
  ElMessage.success('删除成功');
  await loadTemplates();
}
</script>

<template>
  <Modal class="w-[1180px]">
    <ElSteps
      :active="currentStep"
      align-center
      class="mx-auto mb-6 max-w-[680px]"
    >
      <ElStep title="设置工资条模板" />
      <ElStep title="选择发放员工" />
    </ElSteps>

    <div v-if="currentStep === 0" v-loading="templateLoading">
      <div class="mb-4 grid grid-cols-[100px_1fr] items-center gap-y-4">
        <span class="text-right text-muted-foreground">工资条模板</span>
        <div class="flex flex-wrap items-center gap-3">
          <ElSelect
            v-model="selectedTemplateId"
            clearable
            class="min-w-[240px] flex-1"
            filterable
            placeholder="请选择工资条模板"
            @change="handleTemplateChange"
          >
            <ElOption
              v-for="template in templateList"
              :key="template.id"
              :label="template.name"
              :value="template.id!"
            />
          </ElSelect>
          <ElButton
            v-access:code="['hrm:salary:slip:update']"
            type="primary"
            @click="templateFormModalApi.setData({ type: 'create' }).open()"
          >
            新增模板
          </ElButton>
          <ElButton
            v-access:code="['hrm:salary:slip:update']"
            :disabled="!selectedTemplate || selectedTemplate.defaultStatus"
            @click="
              templateFormModalApi
                .setData({ type: 'update', id: selectedTemplateId })
                .open()
            "
          >
            编辑模板
          </ElButton>
          <ElButton
            v-access:code="['hrm:salary:slip:delete']"
            :disabled="!selectedTemplate || selectedTemplate.defaultStatus"
            type="danger"
            @click="handleDeleteTemplate(selectedTemplateId)"
          >
            删除模板
          </ElButton>
        </div>
      </div>
      <ElEmpty
        v-if="!sendTemplate"
        description="暂无工资条模板，请先新增模板"
      />
      <template v-else>
        <div class="mb-4 grid grid-cols-[100px_1fr] items-center">
          <span class="text-right text-muted-foreground">隐藏空项</span>
          <ElSwitch
            v-model="sendTemplate.hideEmpty"
            active-text="隐藏金额为空的工资项"
            inactive-text="保留全部工资项"
          />
        </div>
        <div class="mb-2 text-sm font-medium">模板明细</div>
        <TemplateOptionEditor
          ref="templateEditorRef"
          v-model="sendTemplate.options"
          :max-height="320"
        >
          <template #actions>
            <ElButton
              v-access:code="['hrm:salary:slip:update']"
              @click="handleSaveAsTemplate"
            >
              另存为模板
            </ElButton>
          </template>
        </TemplateOptionEditor>
      </template>
    </div>

    <div v-else v-loading="sendLoading">
      <SearchForm class="mb-4" />
      <div class="mb-4 flex gap-2">
        <ElButton @click="handleQuery">搜索</ElButton>
        <ElButton @click="resetQuery">重置</ElButton>
      </div>
      <EmployeeGrid class="w-full" />
    </div>

    <div class="mt-6 flex items-center justify-end gap-3 border-t pt-4">
      <template v-if="currentStep === 0">
        <ElButton type="primary" @click="handleNextStep">下一步</ElButton>
      </template>
      <template v-else>
        <span class="mr-3 text-muted-foreground">
          已选 {{ selectedEmployeeIds.length }} 人
        </span>
        <ElButton @click="currentStep = 0">上一步</ElButton>
        <ElButton
          :loading="sendLoading"
          type="primary"
          @click="submitForm(false)"
        >
          发放已选员工
        </ElButton>
        <ElButton
          :disabled="!employeeTotal"
          :loading="sendLoading"
          type="primary"
          @click="submitForm(true)"
        >
          全部发放
        </ElButton>
      </template>
      <ElButton @click="modalApi.close()">取消</ElButton>
    </div>

    <TemplateFormModal @success="handleTemplateSuccess" />
  </Modal>
</template>
