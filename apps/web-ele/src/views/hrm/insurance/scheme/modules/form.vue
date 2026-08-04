<script lang="ts" setup>
import type { TableColumnCtx } from 'element-plus';

import type { HrmInsuranceSchemeApi } from '#/api/hrm/insurance/scheme';

import { computed, reactive, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  createInsuranceScheme,
  getInsuranceScheme,
  updateInsuranceScheme,
} from '#/api/hrm/insurance/scheme';
import {
  getInsuranceStandardProjectList,
  getInsuranceStandardTypeList,
} from '#/api/hrm/insurance/standard';
import { AreaCascader } from '#/components/area';
import { $t } from '#/locales';
import {
  HrmInsuranceProjectType,
  HrmInsuranceSchemeType,
} from '#/views/hrm/utils/constants';
import {
  formatHrmInsuranceProjectName,
  formatHrmMoney,
} from '#/views/hrm/utils/format';

defineOptions({ name: 'HrmInsuranceSchemeForm' });

const emit = defineEmits(['success']);

const SOCIAL_PROJECT_TYPES = [
  HrmInsuranceProjectType.ENDOWMENT,
  HrmInsuranceProjectType.MEDICAL,
  HrmInsuranceProjectType.UNEMPLOYMENT,
  HrmInsuranceProjectType.EMPLOYMENT_INJURY,
  HrmInsuranceProjectType.MATERNITY,
  HrmInsuranceProjectType.SUPPLEMENTARY_MEDICAL,
  HrmInsuranceProjectType.SUPPLEMENTARY_ENDOWMENT,
  HrmInsuranceProjectType.DISABILITY,
];
const PROVIDENT_FUND_PROJECT_TYPES = [HrmInsuranceProjectType.PROVIDENT_FUND];

const formType = ref<'create' | 'update'>('create');
const formRef = ref();
const standardLoading = ref(false);
const insuranceTypeList = ref<{ code: string; label: string; value: string }[]>(
  [],
);
const formData = ref<HrmInsuranceSchemeApi.InsuranceScheme>(
  createDefaultFormData(),
);

const dialogTitle = computed(() =>
  formType.value === 'create'
    ? $t('ui.actionTitle.create', ['参保方案'])
    : $t('ui.actionTitle.edit', ['参保方案']),
);

const formRules = reactive({
  name: [{ required: true, message: '方案名称不能为空', trigger: 'blur' }],
  areaId: [{ required: true, message: '参保城市不能为空', trigger: 'change' }],
  type: [{ required: true, message: '方案类型不能为空', trigger: 'change' }],
  projectList: [{ validator: validateProjectList, trigger: 'change' }],
});

const projectSections = computed(() => [
  {
    key: 'social' as const,
    label: '社保',
    projects:
      formData.value.projectList?.filter((project) =>
        isSocialProject(project.type),
      ) || [],
    options: getProjectOptions(SOCIAL_PROJECT_TYPES),
    customType: HrmInsuranceProjectType.CUSTOM_SOCIAL_SECURITY,
  },
  {
    key: 'providentFund' as const,
    label: '公积金',
    projects:
      formData.value.projectList?.filter((project) =>
        isProvidentFundProject(project.type),
      ) || [],
    options: getProjectOptions(PROVIDENT_FUND_PROJECT_TYPES),
    customType: HrmInsuranceProjectType.CUSTOM_PROVIDENT_FUND,
  },
]);

function createProject(type: number): HrmInsuranceSchemeApi.Project {
  return {
    type,
    name: isCustomProject(type) ? '' : getProjectTypeName(type),
    baseAmount: 0,
    corporateRate: 0,
    personalRate: 0,
    corporateAmount: 0,
    personalAmount: 0,
  };
}

function createDefaultFormData(): HrmInsuranceSchemeApi.InsuranceScheme {
  return {
    name: '',
    householdType: '',
    type: HrmInsuranceSchemeType.PROPORTION,
    projectList: [
      HrmInsuranceProjectType.ENDOWMENT,
      HrmInsuranceProjectType.MEDICAL,
      HrmInsuranceProjectType.UNEMPLOYMENT,
      HrmInsuranceProjectType.EMPLOYMENT_INJURY,
      HrmInsuranceProjectType.MATERNITY,
      HrmInsuranceProjectType.PROVIDENT_FUND,
    ].map((type) => createProject(type)),
  };
}

function getProjectTypeName(type?: number) {
  return getDictLabel(DICT_TYPE.HRM_INSURANCE_PROJECT_TYPE, type) || '';
}

function isCustomProject(type?: number) {
  return (
    type === HrmInsuranceProjectType.CUSTOM_SOCIAL_SECURITY ||
    type === HrmInsuranceProjectType.CUSTOM_PROVIDENT_FUND
  );
}

function isSocialProject(type?: number) {
  return type !== undefined && type < HrmInsuranceProjectType.PROVIDENT_FUND;
}

function isProvidentFundProject(type?: number) {
  return type !== undefined && type >= HrmInsuranceProjectType.PROVIDENT_FUND;
}

function getProjectOptions(types: number[]) {
  return types.map((type) => ({
    label: getProjectTypeName(type),
    value: type,
  }));
}

function isProjectTypeUsed(type: number) {
  return (
    formData.value.projectList?.some((project) => project.type === type) ||
    false
  );
}

function addProject(type: number) {
  formData.value.projectList = [
    ...(formData.value.projectList || []),
    createProject(type),
  ];
}

function removeProject(project: HrmInsuranceSchemeApi.Project) {
  formData.value.projectList = (formData.value.projectList || []).filter(
    (item) => item !== project,
  );
}

function handleProjectChecked(checked: boolean, type: number) {
  const project = formData.value.projectList?.find(
    (item) => item.type === type,
  );
  if (checked) {
    if (!project) addProject(type);
    return;
  }
  if (project) removeProject(project);
}

function addCustomProject(type: number) {
  addProject(type);
}

async function getInsuranceTypeList(areaId: number) {
  standardLoading.value = true;
  try {
    const data = await getInsuranceStandardTypeList(areaId);
    if (formData.value.areaId !== areaId) return;
    insuranceTypeList.value = data.map((item) => ({
      code: item.code,
      label: item.name,
      value: item.code,
    }));
    const selectedType = data.find(
      (item) =>
        item.name === formData.value.householdType &&
        item.code !== formData.value.householdType,
    );
    if (selectedType) formData.value.householdType = selectedType.code;
  } finally {
    standardLoading.value = false;
  }
}

async function handleAreaChange(areaId?: number) {
  formData.value.householdType = '';
  insuranceTypeList.value = [];
  resetStandardProjectValues();
  if (areaId) await getInsuranceTypeList(areaId);
}

async function handleHouseTypeChange(typeCode?: string) {
  const areaId = formData.value.areaId;
  if (!areaId || !typeCode) return;
  standardLoading.value = true;
  try {
    const projects = await getInsuranceStandardProjectList({
      areaId,
      typeCode,
    });
    if (
      formData.value.areaId !== areaId ||
      formData.value.householdType !== typeCode
    )
      return;
    const customProjects =
      formData.value.projectList?.filter((project) =>
        isCustomProject(project.type),
      ) || [];
    formData.value.projectList = [
      ...projects.map((project) => ({
        ...project,
        id: undefined,
        schemeId: undefined,
        name: getProjectTypeName(project.type),
      })),
      ...customProjects,
    ];
  } finally {
    standardLoading.value = false;
  }
}

function resetStandardProjectValues() {
  formData.value.projectList?.forEach((project) => {
    if (isCustomProject(project.type)) return;
    project.baseAmount = 0;
    project.corporateRate = 0;
    project.personalRate = 0;
    project.corporateAmount = 0;
    project.personalAmount = 0;
  });
}

function validateProjectList(
  _rule: unknown,
  value: HrmInsuranceSchemeApi.Project[],
) {
  if (!value?.some((project) => isSocialProject(project.type))) {
    return Promise.reject(new Error('请至少添加一个社保项目'));
  }
  if (value.some((project) => !project.name?.trim())) {
    return Promise.reject(new Error('参保项目名称不能为空'));
  }
  return Promise.resolve();
}

function calculateAmount(
  project: HrmInsuranceSchemeApi.Project,
  type: 'corporate' | 'personal',
) {
  const proportion =
    type === 'corporate' ? project.corporateRate : project.personalRate;
  return Number(project.baseAmount || 0) * Number(proportion || 0) * 0.01;
}

function getProjectSummaries(param: {
  columns: TableColumnCtx<HrmInsuranceSchemeApi.Project>[];
  data: HrmInsuranceSchemeApi.Project[];
}) {
  return param.columns.map((column, index) => {
    if (index === 0) return '总计';
    if (
      !['corporateAmount', 'personalAmount'].includes(String(column.property))
    )
      return '';
    const type =
      column.property === 'corporateAmount' ? 'corporate' : 'personal';
    return formatHrmMoney(
      param.data.reduce(
        (total, project) =>
          total +
          (formData.value.type === HrmInsuranceSchemeType.PROPORTION
            ? calculateAmount(project, type)
            : Number(
                project[
                  column.property as keyof HrmInsuranceSchemeApi.Project
                ] || 0,
              )),
        0,
      ),
    );
  });
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
    modalApi.lock();
    try {
      if (formType.value === 'create') {
        await createInsuranceScheme(formData.value);
      } else {
        await confirm('编辑参保方案后，不会变更现有参保信息，确定提交吗？');
        await updateInsuranceScheme(formData.value);
      }
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = createDefaultFormData();
      insuranceTypeList.value = [];
      return;
    }
    const data = modalApi.getData<{ id?: number; type: 'create' | 'update' }>();
    formType.value = data?.type || 'create';
    if (data?.id) {
      formData.value = await getInsuranceScheme(data.id);
      if (formData.value.areaId)
        await getInsuranceTypeList(formData.value.areaId);
    } else {
      formData.value = createDefaultFormData();
    }
  },
});
</script>

<template>
  <Modal :title="dialogTitle" class="w-[1120px]">
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="118px"
    >
      <div class="grid grid-cols-3 gap-4">
        <ElFormItem label="方案名称" prop="name">
          <ElInput
            v-model="formData.name"
            maxlength="64"
            placeholder="请输入方案名称"
          />
        </ElFormItem>
        <ElFormItem label="参保城市" prop="areaId">
          <AreaCascader
            v-model="formData.areaId"
            check-strictly
            clearable
            class="w-full"
            placeholder="请选择参保城市"
            :selectable-levels="[2, 3]"
            @update:model-value="handleAreaChange"
          />
        </ElFormItem>
        <ElFormItem label="可选参保方案" prop="householdType">
          <ElSelect
            v-model="formData.householdType"
            clearable
            class="w-full"
            filterable
            :loading="standardLoading"
            placeholder="请选择参保方案"
            @change="handleHouseTypeChange"
          >
            <ElOption
              v-for="item in insuranceTypeList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>
      </div>
      <ElFormItem label="方案类型" prop="type">
        <ElRadioGroup v-model="formData.type">
          <ElRadioButton :value="HrmInsuranceSchemeType.PROPORTION">
            设置参保基数和比例
          </ElRadioButton>
          <ElRadioButton :value="HrmInsuranceSchemeType.AMOUNT">
            仅设置参保金额
          </ElRadioButton>
        </ElRadioGroup>
      </ElFormItem>
      <ElAlert
        :closable="false"
        class="mb-4"
        show-icon
        title="比例模式：公司或个人缴纳金额 = 参保基数 × 对应比例；金额模式直接填写公司和个人缴纳金额。"
        type="info"
      />
      <ElFormItem label-width="0" prop="projectList">
        <div
          v-for="section in projectSections"
          :key="section.key"
          :class="section.key === 'social' ? '' : 'mt-5'"
          class="w-full"
        >
          <div class="mb-3 flex items-center justify-between">
            <div class="flex items-center text-base font-semibold">
              <span class="bg-primary mr-2.5 h-[18px] w-1 rounded-sm"></span>
              {{ section.label }}
            </div>
            <ElDropdown :hide-on-click="false" trigger="click">
              <ElButton>+ 添加项目</ElButton>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem
                    v-for="option in section.options"
                    :key="option.value"
                    @click.stop
                  >
                    <ElCheckbox
                      :model-value="isProjectTypeUsed(option.value)"
                      @change="
                        (checked) =>
                          handleProjectChecked(Boolean(checked), option.value)
                      "
                    >
                      {{ option.label }}
                    </ElCheckbox>
                  </ElDropdownItem>
                  <ElDropdownItem
                    divided
                    @click="addCustomProject(section.customType)"
                  >
                    + 其他
                  </ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </div>
          <ElTable
            :data="section.projects"
            border
            show-summary
            size="small"
            :summary-method="getProjectSummaries"
          >
            <ElTableColumn label="项目名称" min-width="150" prop="name">
              <template #default="{ row }">
                <ElInput
                  v-if="isCustomProject(row.type)"
                  v-model="row.name"
                  maxlength="64"
                  placeholder="请输入项目名称"
                />
                <span v-else>{{ formatHrmInsuranceProjectName(row) }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="默认基数" prop="baseAmount" width="140">
              <template #default="{ row }">
                <ElInputNumber
                  v-model="row.baseAmount"
                  :controls="false"
                  :min="0"
                  :precision="2"
                  class="!w-full"
                />
              </template>
            </ElTableColumn>
            <ElTableColumn
              v-if="formData.type === HrmInsuranceSchemeType.PROPORTION"
              label="公司缴纳比例"
              prop="corporateRate"
              width="140"
            >
              <template #default="{ row }">
                <ElInputNumber
                  v-model="row.corporateRate"
                  :controls="false"
                  :max="100"
                  :min="0"
                  :precision="2"
                  class="!w-full"
                />
              </template>
            </ElTableColumn>
            <ElTableColumn
              v-if="formData.type === HrmInsuranceSchemeType.PROPORTION"
              label="个人缴纳比例"
              prop="personalRate"
              width="140"
            >
              <template #default="{ row }">
                <ElInputNumber
                  v-model="row.personalRate"
                  :controls="false"
                  :max="100"
                  :min="0"
                  :precision="2"
                  class="!w-full"
                />
              </template>
            </ElTableColumn>
            <ElTableColumn label="公司金额" prop="corporateAmount" width="140">
              <template #default="{ row }">
                <ElInputNumber
                  v-if="formData.type === HrmInsuranceSchemeType.AMOUNT"
                  v-model="row.corporateAmount"
                  :controls="false"
                  :min="0"
                  :precision="2"
                  class="!w-full"
                />
                <span v-else>{{
                  formatHrmMoney(calculateAmount(row, 'corporate'))
                }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="个人金额" prop="personalAmount" width="140">
              <template #default="{ row }">
                <ElInputNumber
                  v-if="formData.type === HrmInsuranceSchemeType.AMOUNT"
                  v-model="row.personalAmount"
                  :controls="false"
                  :min="0"
                  :precision="2"
                  class="!w-full"
                />
                <span v-else>{{
                  formatHrmMoney(calculateAmount(row, 'personal'))
                }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn align="center" label="操作" width="80">
              <template #default="{ row }">
                <ElButton link type="danger" @click="removeProject(row)">
                  删除
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
