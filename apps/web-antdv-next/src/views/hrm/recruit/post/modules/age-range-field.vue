<script lang="ts" setup>
/**
 * 招聘职位「年龄要求」组合字段：
 * 最小年龄 + 最大年龄 + 不限，在视觉上合并成一个表单项（对齐源 vue3）。
 */
import { Checkbox, InputNumber } from 'antdv-next';

defineOptions({ name: 'HrmRecruitPostAgeRangeField' });

const props = defineProps<{
  /** vee-validate FormActions，用于写入关联隐藏字段 */
  formApi?: {
    setFieldValue: (field: string, value: unknown) => Promise<void> | void;
  };
  /** 最小年龄（对应表单字段 minAge） */
  modelValue?: null | number;
  /** 当前表单全部值，用于读取 maxAge / ageUnlimited */
  values?: {
    ageUnlimited?: boolean;
    maxAge?: null | number;
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

/** 是否不限年龄：勾选后禁用范围输入，并清空已填年龄 */
const ageUnlimited = () => !!props.values?.ageUnlimited;

async function handleUnlimitedChange(checked: boolean) {
  await props.formApi?.setFieldValue('ageUnlimited', checked);
  if (!checked) {
    return;
  }
  // 对齐源表单：勾选不限后清空最小/最大年龄
  emit('update:modelValue', undefined);
  await props.formApi?.setFieldValue('maxAge', undefined);
}
</script>

<template>
  <div class="w-full">
    <div class="flex w-full items-center gap-2">
      <InputNumber
        :value="modelValue ?? undefined"
        :disabled="ageUnlimited()"
        :max="99"
        :min="0"
        class="!w-0 flex-1"
        placeholder="最小年龄"
        @update:value="(v) => emit('update:modelValue', toOptionalNumber(v))"
      />
      <span class="text-muted-foreground shrink-0">至</span>
      <InputNumber
        :value="values?.maxAge ?? undefined"
        :disabled="ageUnlimited()"
        :max="99"
        :min="0"
        class="!w-0 flex-1"
        placeholder="最大年龄"
        @update:value="
          (v) => formApi?.setFieldValue('maxAge', toOptionalNumber(v))
        "
      />
      <Checkbox
        :checked="ageUnlimited()"
        class="shrink-0"
        @update:checked="handleUnlimitedChange"
      >
        不限
      </Checkbox>
    </div>
  </div>
</template>
