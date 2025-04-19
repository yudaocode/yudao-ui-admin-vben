<script lang="ts" setup>
import { useVbenForm } from '#/adapter/form';
import { getDemo03GradeByStudentId } from '#/api/infra/demo/demo03/inner';
import { nextTick, watch } from 'vue';

import { useDemo03GradeFormSchema } from '../data';

const props = defineProps<{
  studentId?: any; // 学生编号（主表的关联字段）
}>();

const [Demo03GradeForm, demo03GradeFormApi] = useVbenForm({
  layout: 'horizontal',
  schema: useDemo03GradeFormSchema(),
  showDefaultActions: false,
});

/** 暴露出表单校验方法和表单值获取方法 */
defineExpose({
  validate: async () => {
    const { valid } = await demo03GradeFormApi.validate();
    return valid;
  },
  getValues: demo03GradeFormApi.getValues,
});

/** 监听主表的关联字段的变化，加载对应的子表数据 */
watch(
  () => props.studentId,
  async (val) => {
    if (!val) {
      return;
    }

    await nextTick();
    await demo03GradeFormApi.setValues(await getDemo03GradeByStudentId(props.studentId!));
  },
);
</script>

<template>
  <Demo03GradeForm class="mx-4" />
</template>
