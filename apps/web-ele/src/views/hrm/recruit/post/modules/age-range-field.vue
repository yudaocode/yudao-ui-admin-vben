<script lang="ts" setup>
/**
 * 招聘职位「年龄要求」组合字段：
 * 最小年龄 + 最大年龄 + 不限，在视觉上合并成一个表单项（对齐源 vue3）。
 */
import { ElCheckbox, ElInputNumber } from 'element-plus';

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

/** 是否不限年龄：勾选后禁用范围输入，并清空已填年龄 */
const ageUnlimited = () => !!props.values?.ageUnlimited;

async function handleUnlimitedChange(checked: boolean | number | string) {
  const next = !!checked;
  await props.formApi?.setFieldValue('ageUnlimited', next);
  if (!next) {
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
      <ElInputNumber
        :model-value="modelValue ?? undefined"
        :controls="false"
        :disabled="ageUnlimited()"
        :max="99"
        :min="0"
        class="!w-0 flex-1"
        placeholder="最小年龄"
        @update:model-value="(v) => emit('update:modelValue', v ?? undefined)"
      />
      <span class="text-muted-foreground shrink-0">至</span>
      <ElInputNumber
        :model-value="values?.maxAge ?? undefined"
        :controls="false"
        :disabled="ageUnlimited()"
        :max="99"
        :min="0"
        class="!w-0 flex-1"
        placeholder="最大年龄"
        @update:model-value="
          (v) => formApi?.setFieldValue('maxAge', v ?? undefined)
        "
      />
      <ElCheckbox
        :model-value="ageUnlimited()"
        class="shrink-0"
        @update:model-value="handleUnlimitedChange"
      >
        不限
      </ElCheckbox>
    </div>
  </div>
</template>
