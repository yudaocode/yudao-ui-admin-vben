<script lang="ts" setup>
import type { Rule, TableColumnsType } from 'antdv-next';

import type { HrmInsuranceSchemeApi } from '#/api/hrm/insurance/scheme';

import { computed, reactive, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import {
  Alert,
  Button,
  Checkbox,
  Dropdown,
  Form,
  FormItem,
  Input,
  InputNumber,
  Menu,
  message,
  RadioButton,
  RadioGroup,
  Select,
  Table,
} from 'antdv-next';

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

const formRules = reactive<Record<string, Rule[]>>({
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
const projectColumns = computed<
  TableColumnsType<HrmInsuranceSchemeApi.Project>
>(() => {
  const columns: TableColumnsType<HrmInsuranceSchemeApi.Project> = [
    { title: '项目名称', key: 'name', minWidth: 150 },
    { title: '默认基数', key: 'baseAmount', width: 140 },
  ];
  if (formData.value.type === HrmInsuranceSchemeType.PROPORTION) {
    columns.push(
      { title: '公司缴纳比例', key: 'corporateRate', width: 140 },
      { title: '个人缴纳比例', key: 'personalRate', width: 140 },
    );
  }
  columns.push(
    { title: '公司金额', key: 'corporateAmount', width: 140 },
    { title: '个人金额', key: 'personalAmount', width: 140 },
    { title: '操作', key: 'actions', align: 'center', width: 80 },
  );
  return columns;
});
const corporateAmountColumnIndex = computed(() =>
  formData.value.type === HrmInsuranceSchemeType.PROPORTION ? 4 : 2,
);
const personalAmountColumnIndex = computed(() =>
  formData.value.type === HrmInsuranceSchemeType.PROPORTION ? 5 : 3,
);
const actionsColumnIndex = computed(() =>
  formData.value.type === HrmInsuranceSchemeType.PROPORTION ? 6 : 4,
);

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
    if (!project) {
      addProject(type);
    }
    return;
  }
  if (project) {
    removeProject(project);
  }
}

function addCustomProject(type: number) {
  addProject(type);
}

async function getInsuranceTypeList(areaId: number) {
  standardLoading.value = true;
  try {
    const data = await getInsuranceStandardTypeList(areaId);
    if (formData.value.areaId !== areaId) {
      return;
    }
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
    if (selectedType) {
      formData.value.householdType = selectedType.code;
    }
  } finally {
    standardLoading.value = false;
  }
}

async function handleAreaChange(areaId?: number) {
  formData.value.householdType = '';
  insuranceTypeList.value = [];
  resetStandardProjectValues();
  if (areaId) {
    await getInsuranceTypeList(areaId);
  }
}

async function handleHouseTypeChange() {
  const areaId = formData.value.areaId;
  const typeCode = formData.value.householdType;
  if (!areaId || !typeCode) {
    return;
  }
  standardLoading.value = true;
  try {
    const projects = await getInsuranceStandardProjectList({
      areaId,
      typeCode,
    });
    if (
      formData.value.areaId !== areaId ||
      formData.value.householdType !== typeCode
    ) {
      return;
    }
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
    if (isCustomProject(project.type)) {
      return;
    }
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

function getSectionSummary(
  projects: HrmInsuranceSchemeApi.Project[],
  column: 'corporateAmount' | 'personalAmount',
) {
  const type = column === 'corporateAmount' ? 'corporate' : 'personal';
  return formatHrmMoney(
    projects.reduce(
      (total, project) =>
        total +
        (formData.value.type === HrmInsuranceSchemeType.PROPORTION
          ? calculateAmount(project, type)
          : Number(project[column] || 0)),
      0,
    ),
  );
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
      message.success($t('ui.actionMessage.operationSuccess'));
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
      if (formData.value.areaId) {
        await getInsuranceTypeList(formData.value.areaId);
      }
    } else {
      formData.value = createDefaultFormData();
    }
  },
});
</script>

<template>
  <Modal :title="dialogTitle" class="w-[1120px]">
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="118px"
    >
      <div class="grid grid-cols-3 gap-4">
        <FormItem label="方案名称" name="name">
          <Input
            v-model:value="formData.name"
            :maxlength="64"
            placeholder="请输入方案名称"
          />
        </FormItem>
        <FormItem label="参保城市" name="areaId">
          <AreaCascader
            v-model:value="formData.areaId"
            :change-on-select="true"
            :selectable-levels="[2, 3]"
            allow-clear
            class="w-full"
            placeholder="请选择参保城市"
            @update:model-value="handleAreaChange"
          />
        </FormItem>
        <FormItem label="可选参保方案" name="householdType">
          <Select
            v-model:value="formData.householdType"
            :loading="standardLoading"
            :options="insuranceTypeList"
            allow-clear
            class="w-full"
            placeholder="请选择参保方案"
            @change="handleHouseTypeChange"
          />
        </FormItem>
      </div>
      <FormItem label="方案类型" name="type">
        <RadioGroup
          v-model:value="formData.type"
          button-style="solid"
          option-type="button"
        >
          <RadioButton :value="HrmInsuranceSchemeType.PROPORTION">
            设置参保基数和比例
          </RadioButton>
          <RadioButton :value="HrmInsuranceSchemeType.AMOUNT">
            仅设置参保金额
          </RadioButton>
        </RadioGroup>
      </FormItem>
      <Alert
        class="mb-4"
        message="比例模式：公司或个人缴纳金额 = 参保基数 × 对应比例；金额模式直接填写公司和个人缴纳金额。"
        show-icon
        type="info"
      />

      <FormItem name="projectList" label-width="0">
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
            <Dropdown :trigger="['click']">
              <Button>
                <span class="mr-1">+</span>
                添加项目
              </Button>
              <template #popupRender>
                <Menu>
                  <Menu.Item
                    v-for="option in section.options"
                    :key="option.value"
                    @click.stop
                  >
                    <Checkbox
                      :checked="isProjectTypeUsed(option.value)"
                      @change="
                        (event) =>
                          handleProjectChecked(
                            event.target.checked,
                            option.value,
                          )
                      "
                    >
                      {{ option.label }}
                    </Checkbox>
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item @click="addCustomProject(section.customType)">
                    + 其他
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </div>
          <Table
            :columns="projectColumns"
            :data-source="section.projects"
            :pagination="false"
            bordered
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <Input
                  v-if="isCustomProject(record.type)"
                  v-model:value="record.name"
                  :maxlength="64"
                  placeholder="请输入项目名称"
                />
                <span v-else>{{ formatHrmInsuranceProjectName(record) }}</span>
              </template>
              <template v-else-if="column.key === 'baseAmount'">
                <InputNumber
                  v-model:value="record.baseAmount"
                  :controls="false"
                  :min="0"
                  :precision="2"
                  class="w-full"
                />
              </template>
              <template v-else-if="column.key === 'corporateRate'">
                <InputNumber
                  v-model:value="record.corporateRate"
                  :controls="false"
                  :max="100"
                  :min="0"
                  :precision="2"
                  addon-after="%"
                  class="w-full"
                />
              </template>
              <template v-else-if="column.key === 'personalRate'">
                <InputNumber
                  v-model:value="record.personalRate"
                  :controls="false"
                  :max="100"
                  :min="0"
                  :precision="2"
                  addon-after="%"
                  class="w-full"
                />
              </template>
              <template v-else-if="column.key === 'corporateAmount'">
                <InputNumber
                  v-if="formData.type === HrmInsuranceSchemeType.AMOUNT"
                  v-model:value="record.corporateAmount"
                  :controls="false"
                  :min="0"
                  :precision="2"
                  class="w-full"
                />
                <span v-else>{{
                  formatHrmMoney(calculateAmount(record, 'corporate'))
                }}</span>
              </template>
              <template v-else-if="column.key === 'personalAmount'">
                <InputNumber
                  v-if="formData.type === HrmInsuranceSchemeType.AMOUNT"
                  v-model:value="record.personalAmount"
                  :controls="false"
                  :min="0"
                  :precision="2"
                  class="w-full"
                />
                <span v-else>{{
                  formatHrmMoney(calculateAmount(record, 'personal'))
                }}</span>
              </template>
              <template v-else-if="column.key === 'actions'">
                <Button danger type="link" @click="removeProject(record)">
                  删除
                </Button>
              </template>
            </template>
            <template #summary>
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index="0">总计</Table.Summary.Cell>
                  <Table.Summary.Cell index="1" />
                  <Table.Summary.Cell
                    v-if="formData.type === HrmInsuranceSchemeType.PROPORTION"
                    index="2"
                  />
                  <Table.Summary.Cell
                    v-if="formData.type === HrmInsuranceSchemeType.PROPORTION"
                    index="3"
                  />
                  <Table.Summary.Cell :index="corporateAmountColumnIndex">
                    {{ getSectionSummary(section.projects, 'corporateAmount') }}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell :index="personalAmountColumnIndex">
                    {{ getSectionSummary(section.projects, 'personalAmount') }}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell :index="actionsColumnIndex" />
                </Table.Summary.Row>
              </Table.Summary>
            </template>
          </Table>
        </div>
      </FormItem>
    </Form>
  </Modal>
</template>
