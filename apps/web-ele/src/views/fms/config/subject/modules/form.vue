<script lang="ts" setup>
import type { FormRules } from 'element-plus';

import type { FmsAuxiliaryTypeApi } from '#/api/fms/config/auxiliary/type';
import type { FmsSubjectApi } from '#/api/fms/config/subject';

import { computed, reactive, ref, watch } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  ElAlert,
  ElCheckbox,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
} from 'element-plus';

import { getFinanceParameter } from '#/api/fms/config/finance-parameter';
import {
  createSubject,
  getSubject,
  getSubjectList,
  getSubjectUsage,
  updateSubject,
} from '#/api/fms/config/subject';
import FmsAuxiliaryItemSelect from '#/views/fms/config/auxiliary/components/auxiliary-item-select.vue';
import FmsAuxiliaryTypeSelect from '#/views/fms/config/auxiliary/components/auxiliary-type-select.vue';
import FmsCurrencySelect from '#/views/fms/config/currency/components/fms-currency-select.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import {
  FMS_DEBIT_CREDIT_DIRECTION,
  FMS_SUBJECT_PARENT_ID_ROOT,
  FMS_SUBJECT_TYPE,
} from '#/views/fms/utils/constants';

defineOptions({ name: 'FmsSubjectForm' });

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const fmsStore = useFmsStore(); // FMS 状态

const formType = ref(''); // 表单的类型：create - 新增；update - 修改
const dialogTitle = ref(''); // 弹窗的标题
const formData = ref<FmsSubjectApi.Subject>(createEmptyFormData()); // 表单数据
const formRef = ref(); // 表单 Ref
const formRules = reactive<FormRules>({
  code: [{ required: true, message: '科目编码不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '科目名称不能为空', trigger: 'blur' }],
  category: [{ required: true, message: '科目类别不能为空', trigger: 'change' }],
  balanceDirection: [
    { required: true, message: '余额方向不能为空', trigger: 'change' },
  ],
  quantityUnit: [
    {
      validator: (_rule, value, callback) => {
        if (!formData.value.quantityAccounting || value) {
          callback();
          return;
        }
        callback(new Error('数量单位不能为空'));
      },
      trigger: 'blur',
    },
  ],
});

const parentSubject = ref<FmsSubjectApi.Subject>(); // 上级科目
const subjectUsage = ref<FmsSubjectApi.Usage>(createEmptySubjectUsage()); // 科目使用情况
const subjectCodeRule = ref(''); // 科目编码规则
const originalAuxiliaryTypeIds = ref<number[]>([]); // 修改前的辅助核算类别编号数组
const auxiliaryTypes = ref<FmsAuxiliaryTypeApi.AuxiliaryTypeOption[]>([]); // 辅助核算类别数组
const subjectCandidates = ref<FmsSubjectApi.Subject[]>([]); // 当前账套同类科目，用于编码识别和重名提示
const explicitParent = ref(false); // 是否由“新建下级”入口明确指定上级

const balanceDirectionOptions = getDictOptions(
  DICT_TYPE.FMS_DEBIT_CREDIT_DIRECTION,
  'number',
); // 余额方向选项

/** 当前科目类型的类别选项 */
const categoryOptions = computed(() =>
  getDictOptions(DICT_TYPE.FMS_SUBJECT_CATEGORY)
    .filter((dict) => dict.value.startsWith(`${formData.value.type}-`))
    .map((dict) => ({
      ...dict,
      value: Number(dict.value.split('-')[1]),
    })),
);
/** 存在下级科目时不允许修改编码 */
const codeDisabled = computed(
  () => formType.value === 'update' && subjectUsage.value.childCount > 0,
);
/** 新建下级时，上级科目是否已有业务数据 */
const parentSubjectUsed = computed(
  () =>
    formType.value === 'create' &&
    Boolean(parentSubject.value) &&
    subjectUsage.value.used,
);
/** 上级科目存在业务数据和下级科目时不允许再次迁移 */
const parentDataMigrationBlocked = computed(
  () => parentSubjectUsed.value && subjectUsage.value.childCount > 0,
);
/** 是否禁用辅助核算类别选择 */
const auxiliaryTypeDisabled = computed(
  () =>
    parentSubjectUsed.value ||
    subjectUsage.value.childCount > 0 ||
    (subjectUsage.value.used && originalAuxiliaryTypeIds.value.length > 0),
);
/** 是否需要迁移历史辅助核算数据 */
const auxiliaryMigrationRequired = computed(
  () =>
    formType.value === 'update' &&
    subjectUsage.value.voucherEntryCount > 0 &&
    originalAuxiliaryTypeIds.value.length === 0 &&
    formData.value.auxiliaryTypeIds.length > 0,
);

/** 创建空的科目使用情况 */
function createEmptySubjectUsage(): FmsSubjectApi.Usage {
  return {
    childCount: 0,
    voucherEntryCount: 0,
    initialBalanceCount: 0,
    auxiliaryCombinationCount: 0,
    quantityDataCount: 0,
    used: false,
  };
}

/** 创建空表单数据 */
function createEmptyFormData(
  accountSetId: number = 0,
  type: number = FMS_SUBJECT_TYPE.ASSET,
): FmsSubjectApi.Subject {
  return {
    id: 0,
    accountSetId,
    code: '',
    name: '',
    parentId: FMS_SUBJECT_PARENT_ID_ROOT,
    type,
    category: undefined,
    balanceDirection: FMS_DEBIT_CREDIT_DIRECTION.DEBIT,
    auxiliaryTypeIds: [],
    auxiliaryTypeNames: [],
    currencyIds: [],
    quantityAccounting: false,
    cash: false,
    migrateParentData: false,
    auxiliaryMappings: [],
    children: [],
  };
}

/** 同步辅助核算历史数据迁移项目 */
function handleAuxiliaryTypeChange(value: number | number[] | undefined) {
  const typeIds = Array.isArray(value) ? value : [];
  const mappingMap = new Map(
    (formData.value.auxiliaryMappings || []).map((mapping) => [
      mapping.typeId,
      mapping,
    ]),
  );
  formData.value.auxiliaryMappings = typeIds.map(
    (typeId) => mappingMap.get(typeId) || { typeId },
  );
}

/** 获得辅助核算类别名称 */
function getAuxiliaryTypeName(typeId: number) {
  return (
    auxiliaryTypes.value.find((item) => item.id === typeId)?.name ||
    '辅助核算项目'
  );
}

/** 根据编码规则生成下级科目编码 */
function suggestChildCode(parent: FmsSubjectApi.Subject) {
  const codeRules = subjectCodeRule.value.split('-').map(Number);
  const segmentLength = codeRules[parent.level || 1] || 2;
  const prefix = parent.code;
  const usedCodes = new Set(
    (parent.children || []).map((item) => item.code.slice(prefix.length)),
  );
  const maxCode = 10 ** segmentLength - 1;
  for (let code = 1; code <= maxCode; code++) {
    const suffix = String(code).padStart(segmentLength, '0');
    if (!usedCodes.has(suffix)) {
      return `${prefix}${suffix}`;
    }
  }
  return `${prefix}${String(maxCode).padStart(segmentLength, '0')}`;
}

/** 根据完整科目编码识别上级科目 */
function handleCodeBlur() {
  if (formType.value !== 'create' || explicitParent.value) return;
  const code = formData.value.code?.trim();
  const parent = findParentByCode(code);
  if (!parent) {
    parentSubject.value = undefined;
    formData.value.parentId = FMS_SUBJECT_PARENT_ID_ROOT;
    return;
  }
  parentSubject.value = parent;
  formData.value.parentId = parent.id;
  formData.value.category = parent.category;
  formData.value.balanceDirection = parent.balanceDirection;
  formData.value.auxiliaryTypeIds = [...(parent.auxiliaryTypeIds || [])];
  formData.value.currencyIds = [...(parent.currencyIds || [])];
  formData.value.quantityAccounting = parent.quantityAccounting;
  formData.value.quantityUnit = parent.quantityUnit;
  formData.value.cash = parent.cash;
}

/** 按会计科目级次和编码前缀查找已存在的上级科目 */
function findParentByCode(code?: string) {
  if (!code || !/^\d+$/.test(code)) return undefined;
  const codeRules = subjectCodeRule.value.split('-').map(Number);
  const parentLength = codeRules.reduce((total, length) => {
    const currentLength = total + length;
    return currentLength < code.length ? currentLength : total;
  }, 0);
  if (parentLength <= 0 || parentLength >= code.length) return undefined;
  const parentCode = code.slice(0, parentLength);
  return subjectCandidates.value.find((subject) => subject.code === parentCode);
}

/** 重置表单 */
function resetForm(
  accountSetId: number,
  type: number,
  parent?: FmsSubjectApi.Subject,
) {
  formData.value = createEmptyFormData(accountSetId, type);
  parentSubject.value = parent;
  explicitParent.value = Boolean(parent);
  subjectCandidates.value = [];
  subjectUsage.value = createEmptySubjectUsage();
  subjectCodeRule.value = '';
  originalAuxiliaryTypeIds.value = [];
}

/** 提交表单 */
async function submitForm() {
  // 校验表单
  await formRef.value?.validate();
  // 提交请求
  modalApi.lock();
  try {
    if (!formData.value.quantityAccounting) {
      formData.value.quantityUnit = undefined;
    }
    if (formType.value === 'create') {
      const duplicateSubject = subjectCandidates.value.find(
        (subject) =>
          subject.parentId === formData.value.parentId &&
          subject.name === formData.value.name.trim(),
      );
      if (duplicateSubject) {
        try {
          await confirm(
            `同级已有名称为“${duplicateSubject.name}”的科目（${duplicateSubject.code}），是否仍要继续？`,
            '科目名称重复',
          );
        } catch {
          return;
        }
      }
      if (parentSubjectUsed.value) {
        try {
          await confirm(
            `继续后会把上级科目的 ${subjectUsage.value.voucherEntryCount} 条凭证分录、${subjectUsage.value.initialBalanceCount} 条初始余额和 ${subjectUsage.value.auxiliaryCombinationCount} 个辅助核算组合迁移到新科目，且无法撤销。是否继续？`,
            '迁移上级科目历史数据',
          );
        } catch {
          return;
        }
        formData.value.migrateParentData = true;
      }
      await createSubject(formData.value);
      ElMessage.success('新增成功');
    } else {
      if (auxiliaryMigrationRequired.value) {
        try {
          await confirm(
            `继续后会把该科目的 ${subjectUsage.value.voucherEntryCount} 条凭证分录迁移到所选辅助核算项目，且无法撤销。是否继续？`,
            '迁移历史辅助核算数据',
          );
        } catch {
          return;
        }
      } else {
        formData.value.auxiliaryMappings = undefined;
      }
      await updateSubject(formData.value);
      ElMessage.success('更新成功');
    }
    await modalApi.close();
    // 发送操作成功的事件
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 上级科目存在业务数据和下级科目时，禁用确定按钮 */
watch(parentDataMigrationBlocked, (blocked) => {
  modalApi.setState({ confirmDisabled: blocked });
});

const [Modal, modalApi] = useVbenModal({
  onConfirm: submitForm,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const data = modalApi.getData<{
      parent?: FmsSubjectApi.Subject;
      row?: FmsSubjectApi.Subject;
      subjectType: number;
      type: string;
    }>();
    const accountSetId = fmsStore.getAccountSetId;
    if (!data || !accountSetId) return;
    formType.value = data.type;
    dialogTitle.value =
      data.type === 'update'
        ? '编辑科目'
        : data.parent
          ? '新建下级科目'
          : '新建科目';
    resetForm(accountSetId, data.subjectType, data.parent);
    modalApi.lock();
    try {
      // 修改时，设置科目数据
      if (data.type === 'update' && data.row?.id) {
        const [financeParameter, subject, usage] = await Promise.all([
          getFinanceParameter(accountSetId),
          getSubject(accountSetId, data.row.id),
          getSubjectUsage(accountSetId, data.row.id),
        ]);
        subjectCodeRule.value = financeParameter!.subjectCodeRule;
        formData.value = subject;
        formData.value.auxiliaryMappings = [];
        originalAuxiliaryTypeIds.value = [...(subject.auxiliaryTypeIds || [])];
        subjectUsage.value = usage;
        parentSubject.value = data.parent;
        return;
      }
      // 加载科目编码规则和上级科目使用情况
      const [financeParameter, parentUsage, subjects] = await Promise.all([
        getFinanceParameter(accountSetId),
        data.parent?.id
          ? getSubjectUsage(accountSetId, data.parent.id)
          : undefined,
        getSubjectList(accountSetId, data.subjectType),
      ]);
      subjectCodeRule.value = financeParameter!.subjectCodeRule;
      subjectCandidates.value = subjects;
      // 新建下级时，继承上级科目的核算配置
      if (data.parent) {
        const parent = data.parent;
        formData.value.parentId = parent.id;
        formData.value.code = suggestChildCode(parent);
        formData.value.category = parent.category;
        formData.value.balanceDirection = parent.balanceDirection;
        formData.value.auxiliaryTypeIds = [...(parent.auxiliaryTypeIds || [])];
        formData.value.currencyIds = [...(parent.currencyIds || [])];
        formData.value.quantityAccounting = parent.quantityAccounting;
        formData.value.quantityUnit = parent.quantityUnit;
        formData.value.cash = parent.cash;
        if (parentUsage) subjectUsage.value = parentUsage;
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="dialogTitle" class="w-[560px]">
    <ElAlert
      v-if="formType === 'create' && parentSubjectUsed"
      :closable="false"
      :title="
        subjectUsage.childCount > 0
          ? '上级科目已有业务数据和下级科目，当前数据状态不允许继续新增下级'
          : `上级科目已有 ${subjectUsage.voucherEntryCount} 条凭证分录、${subjectUsage.initialBalanceCount} 条初始余额和 ${subjectUsage.auxiliaryCombinationCount} 个辅助核算组合，创建后将全部迁移到新科目`
      "
      class="mb-4"
      type="warning"
    />
    <ElAlert
      v-if="formType === 'update' && (subjectUsage.used || subjectUsage.childCount > 0)"
      :closable="false"
      :title="
        subjectUsage.used
          ? '该科目已有业务数据，余额方向不能修改；首次启用辅助核算时，需要为历史数据指定迁移项目'
          : '该科目已有下级，科目类别、编码和辅助核算不能修改'
      "
      class="mb-4"
      type="warning"
    />
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="112px"
    >
      <ElFormItem label="科目编码" prop="code">
        <ElInput
          v-model="formData.code"
          :disabled="codeDisabled"
          maxlength="64"
          placeholder="请输入科目编码"
          @blur="handleCodeBlur"
        />
        <div class="text-muted-foreground text-xs leading-6">
          科目级次：{{ subjectCodeRule || '未配置' }}
        </div>
      </ElFormItem>
      <ElFormItem label="科目名称" prop="name">
        <ElInput
          v-model="formData.name"
          maxlength="255"
          placeholder="请输入科目名称"
        />
      </ElFormItem>
      <ElFormItem label="上级科目">
        <ElInput
          :model-value="
            parentSubject
              ? `${parentSubject.code} ${parentSubject.name}`
              : '无上级科目'
          "
          disabled
        />
      </ElFormItem>
      <ElFormItem label="科目类别" prop="category">
        <ElSelect
          v-model="formData.category"
          :disabled="Boolean(parentSubject) || subjectUsage.childCount > 0"
          class="w-full"
          placeholder="请选择科目类别"
        >
          <ElOption
            v-for="dict in categoryOptions"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="余额方向" prop="balanceDirection">
        <ElRadioGroup
          v-model="formData.balanceDirection"
          :disabled="subjectUsage.used"
        >
          <ElRadio
            v-for="dict in balanceDirectionOptions"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="辅助核算">
        <FmsAuxiliaryTypeSelect
          v-model="formData.auxiliaryTypeIds"
          :disabled="auxiliaryTypeDisabled"
          multiple
          placeholder="请选择辅助核算"
          @change="handleAuxiliaryTypeChange"
          @loaded="auxiliaryTypes = $event"
        />
      </ElFormItem>
      <template v-if="auxiliaryMigrationRequired">
        <ElAlert
          :closable="false"
          class="mb-4"
          title="请选择历史凭证要迁入的辅助核算项目，该操作不可撤销"
          type="warning"
        />
        <ElFormItem
          v-for="(mapping, index) in formData.auxiliaryMappings"
          :key="mapping.typeId"
          :label="getAuxiliaryTypeName(mapping.typeId)"
          :prop="`auxiliaryMappings.${index}.itemId`"
          :rules="[
            { required: true, message: '请选择迁移项目', trigger: 'change' },
          ]"
        >
          <FmsAuxiliaryItemSelect
            v-model="mapping.itemId"
            :auxiliary-type-id="mapping.typeId"
            placeholder="请选择迁移项目"
          />
        </ElFormItem>
      </template>
      <ElFormItem label="外币核算">
        <FmsCurrencySelect
          v-model="formData.currencyIds"
          :disabled="parentSubjectUsed"
          :exclude-standard="true"
          multiple
          placeholder="请选择币别"
        />
      </ElFormItem>
      <ElFormItem label="数量核算">
        <ElCheckbox
          v-model="formData.quantityAccounting"
          :disabled="parentSubjectUsed || subjectUsage.quantityDataCount > 0"
        >
          启用数量核算
        </ElCheckbox>
      </ElFormItem>
      <ElFormItem
        v-if="formData.quantityAccounting"
        label="数量单位"
        prop="quantityUnit"
      >
        <ElInput
          v-model="formData.quantityUnit"
          :disabled="parentSubjectUsed"
          maxlength="255"
          placeholder="请输入数量单位"
        />
      </ElFormItem>
      <ElFormItem label="现金项">
        <ElCheckbox
          v-model="formData.cash"
          :disabled="Boolean(parentSubject?.cash)"
        >
          现金及现金等价物
        </ElCheckbox>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
