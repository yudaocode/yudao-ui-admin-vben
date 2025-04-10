<script lang="ts" setup>
import type { InfraCodegenApi } from '#/api/infra/codegen';

import { useVbenForm } from '#/adapter/form';
import { getCodegenTableList } from '#/api/infra/codegen';
import { InfraCodegenTemplateTypeEnum } from '#/utils/constants';
import { computed, ref, watch } from 'vue';

import { isEmpty } from '@vben/utils';

import { useGenerationInfoBaseFormSchema, useSubTableFormSchema, useTreeTableFormSchema } from '../data';

defineOptions({ name: 'InfraCodegenGenerateInfoForm' });

const props = defineProps<{
  columns?: InfraCodegenApi.CodegenColumn[];
  table?: InfraCodegenApi.CodegenTable;
}>();

const tables = ref<InfraCodegenApi.CodegenTable[]>([]);
const currentTemplateType = ref<number>();
const wrapperClass = 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'; // 一行两列布局
/** 计算当前模板类型 */
const isTreeTable = computed(() => currentTemplateType.value === InfraCodegenTemplateTypeEnum.TREE);
const isSubTable = computed(() => currentTemplateType.value === InfraCodegenTemplateTypeEnum.SUB);

/** 基础表单实例 */
const [BaseForm, baseFormApi] = useVbenForm({
  wrapperClass,
  layout: 'horizontal',
  showDefaultActions: false,
  schema: useGenerationInfoBaseFormSchema(),
  handleValuesChange: (values) => {
    // 监听模板类型变化
    if (values.templateType !== undefined && values.templateType !== currentTemplateType.value) {
      currentTemplateType.value = values.templateType;
    }
  },
});

/** 树表信息表单实例 */
const [TreeForm, treeFormApi] = useVbenForm({
  wrapperClass,
  layout: 'horizontal',
  showDefaultActions: false,
  schema: [],
});

/** 主子表信息表单实例 */
const [SubForm, subFormApi] = useVbenForm({
  wrapperClass,
  layout: 'horizontal',
  showDefaultActions: false,
  schema: [],
});

/** 更新树表信息表单 schema */
function updateTreeSchema(): void {
  const schema = useTreeTableFormSchema(props.columns);
  treeFormApi.setState({ schema });
}

/** 更新主子表信息表单 schema */
function updateSubSchema(): void {
  const schema = useSubTableFormSchema(props.columns, tables.value);
  subFormApi.setState({ schema });
}

/** 获取合并的表单值 */
async function getAllFormValues(): Promise<Record<string, any>> {
  // 基础表单值
  const baseValues = await baseFormApi.getValues();

  // 根据模板类型获取对应的额外表单值
  let extraValues = {};
  if (isTreeTable.value) {
    extraValues = await treeFormApi.getValues();
  } else if (isSubTable.value) {
    extraValues = await subFormApi.getValues();
  }

  // 合并表单值
  return { ...baseValues, ...extraValues };
}

/** 验证所有表单 */
async function validateAllForms() {
  let validateResult: boolean;
  // 验证基础表单
  const { valid: baseFormValid } = await baseFormApi.validate();
  validateResult = baseFormValid;
  // 根据模板类型验证对应的额外表单
  if (isTreeTable.value) {
    const { valid: treeFormValid } = await treeFormApi.validate();
    validateResult = baseFormValid && treeFormValid;
  } else if (isSubTable.value) {
    const { valid: subFormValid } = await subFormApi.validate();
    validateResult = baseFormValid && subFormValid;
  }
  return validateResult;
}

/** 设置表单值 */
function setAllFormValues(values: Record<string, any>): void {
  if (!values) return;

  // 记录模板类型
  currentTemplateType.value = values.templateType;

  // 设置基础表单值
  baseFormApi.setValues(values);

  // 根据模板类型设置对应的额外表单值
  if (isTreeTable.value) {
    treeFormApi.setValues(values);
  } else if (isSubTable.value) {
    subFormApi.setValues(values);
  }
}

/** 监听表格数据变化 */
watch(
  () => props.table,
  async (val) => {
    if (!val || isEmpty(val)) {
      return;
    }
    // 初始化树表的schema
    updateTreeSchema();
    // 设置表单值
    setAllFormValues(val);
    // 获取表数据，用于主子表选择
    if (typeof val.dataSourceConfigId === undefined) {
      return;
    }
    tables.value = await getCodegenTableList(val.dataSourceConfigId);
    // 初始化子表 schema
    updateSubSchema();
  },
  { immediate: true },
);

/** 暴露出表单校验方法和表单值获取方法 */
defineExpose({
  validate: validateAllForms,
  getValues: getAllFormValues,
});
</script>

<template>
  <div>
    <!-- 基础表单 -->
    <BaseForm />

    <!-- 树表信息表单 -->
    <TreeForm v-if="isTreeTable" />

    <!-- 主子表信息表单 -->
    <SubForm v-if="isSubTable" />
  </div>
</template>
