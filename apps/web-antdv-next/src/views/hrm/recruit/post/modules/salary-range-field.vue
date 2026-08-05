<script lang="ts" setup>
/**
 * 招聘职位「薪资范围」组合字段：
 * 最低薪资 + 最高薪资 + 单位 + 面议，在视觉上合并成一个表单项（对齐源 vue3）。
 */
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Checkbox, InputNumber, Select } from 'antdv-next';

defineOptions({ name: 'HrmRecruitPostSalaryRangeField' });

const props = defineProps<{
  /** vee-validate FormActions，用于写入关联隐藏字段 */
  formApi?: {
    setFieldValue: (field: string, value: unknown) => Promise<void> | void;
  };
  /** 最低薪资（对应表单字段 minSalary） */
  modelValue?: null | number;
  /** 当前表单全部值，用于读取 maxSalary / salaryUnit / salaryNegotiable */
  values?: {
    maxSalary?: null | number;
    salaryNegotiable?: boolean;
    salaryUnit?: number;
  };
}>();

const emit = defineEmits<{
  'update:modelValue': [value: null | number | undefined];
}>();

/** InputNumber 的 ValueType 可能是 string，统一收敛为 number */
function toOptionalNumber(
  value: null | number | string | undefined,
): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  return typeof value === 'number' ? value : Number(value);
}

/** 薪资单位字典选项 */
const salaryUnitOptions = getDictOptions(
  DICT_TYPE.HRM_RECRUIT_SALARY_UNIT,
  'number',
).map(({ label, value }) => ({ label, value: Number(value) }));

/** 是否面议：勾选后禁用范围输入，并清空已填薪资 */
const salaryNegotiable = () => !!props.values?.salaryNegotiable;

async function handleNegotiableChange(checked: boolean) {
  await props.formApi?.setFieldValue('salaryNegotiable', checked);
  if (!checked) {
    return;
  }
  // 对齐源表单：勾选面议后清空最低/最高薪资
  emit('update:modelValue', undefined);
  await props.formApi?.setFieldValue('maxSalary', undefined);
}
</script>

<template>
  <div class="w-full">
    <div class="flex w-full items-center gap-1">
      <InputNumber
        :value="modelValue ?? undefined"
        :disabled="salaryNegotiable()"
        :max="99_999_999.99"
        :min="0"
        :precision="2"
        class="!w-0 flex-1"
        placeholder="最低薪资"
        @update:value="(v) => emit('update:modelValue', toOptionalNumber(v))"
      />
      <span class="text-muted-foreground shrink-0">至</span>
      <InputNumber
        :value="values?.maxSalary ?? undefined"
        :disabled="salaryNegotiable()"
        :max="99_999_999.99"
        :min="0"
        :precision="2"
        class="!w-0 flex-1"
        placeholder="最高薪资"
        @update:value="
          (v) => formApi?.setFieldValue('maxSalary', toOptionalNumber(v))
        "
      />
      <Select
        :value="values?.salaryUnit"
        :disabled="salaryNegotiable()"
        :options="salaryUnitOptions"
        allow-clear
        class="!w-20 shrink-0"
        placeholder="单位"
        @update:value="(v) => formApi?.setFieldValue('salaryUnit', v)"
      />
      <Checkbox
        :checked="salaryNegotiable()"
        class="shrink-0"
        @update:checked="handleNegotiableChange"
      >
        面议
      </Checkbox>
    </div>
  </div>
</template>
