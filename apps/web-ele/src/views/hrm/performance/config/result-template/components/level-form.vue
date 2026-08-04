<script lang="ts" setup>
import type { HrmPerformanceResultTemplateApi } from '#/api/hrm/performance/config/result-template';

import { ElMessage } from 'element-plus';

import {
  isSameNumber,
  isValidPerformanceCoefficient,
  isValidPerformanceScore,
} from '#/views/hrm/utils/performance';

defineOptions({ name: 'HrmPerformanceResultLevelForm' });

const props = withDefaults(defineProps<{ disabled?: boolean }>(), {
  disabled: false,
});

const modelValue = defineModel<HrmPerformanceResultTemplateApi.ResultLevel[]>({
  required: true,
});

function validate() {
  if (modelValue.value.length === 0) {
    ElMessage.warning('至少需要一个结果等级');
    return false;
  }
  const names = new Set<string>();
  for (const level of modelValue.value) {
    const name = level.name?.trim();
    if (!name) {
      ElMessage.warning('等级名称不能为空');
      return false;
    }
    if (names.has(name)) {
      ElMessage.warning(`等级名称（${name}）重复`);
      return false;
    }
    names.add(name);
    if (
      !isValidPerformanceScore(level.minScore) ||
      !isValidPerformanceScore(level.maxScore)
    ) {
      ElMessage.warning(
        `等级（${name}）的分数必须在 0 到 100 之间，并最多保留两位小数`,
      );
      return false;
    }
    if (level.minScore > level.maxScore) {
      ElMessage.warning(`等级（${name}）的最低分数不能大于最高分数`);
      return false;
    }
    if (!isValidPerformanceCoefficient(level.coefficient)) {
      ElMessage.warning(
        `等级（${name}）的绩效系数不能小于 0，并最多保留两位小数`,
      );
      return false;
    }
  }
  const sortedLevels = [...modelValue.value].toSorted(
    (left, right) => left.minScore - right.minScore,
  );
  if (!isSameNumber(sortedLevels[0]!.minScore, 0)) {
    ElMessage.warning('结果等级必须覆盖 0 分');
    return false;
  }
  for (let index = 1; index < sortedLevels.length; index++) {
    if (
      !isSameNumber(
        sortedLevels[index]!.minScore,
        sortedLevels[index - 1]!.maxScore + 0.01,
      )
    ) {
      ElMessage.warning('结果等级分数区间必须连续且不能重叠');
      return false;
    }
  }
  if (!isSameNumber(sortedLevels[sortedLevels.length - 1]!.maxScore, 100)) {
    ElMessage.warning('结果等级必须覆盖 100 分');
    return false;
  }
  return true;
}

function addLevel() {
  modelValue.value = [
    ...modelValue.value,
    { name: '', minScore: 0, maxScore: 0, coefficient: 1 },
  ];
}

function removeLevel(index: number) {
  modelValue.value = modelValue.value.filter((_, i) => i !== index);
}

defineExpose({ validate });
</script>

<template>
  <div class="w-full">
    <div class="mb-3 flex items-center justify-between gap-4">
      <span class="text-sm text-gray-500">
        分数区间须从 0 到 100 连续且不重叠；绩效系数不小于
        0，分数和系数最多保留两位小数。
      </span>
      <ElButton :disabled="props.disabled" @click="addLevel">
        新增结果等级
      </ElButton>
    </div>
    <ElTable border :data="modelValue" size="small">
      <ElTableColumn label="等级" width="140">
        <template #default="{ row }">
          <ElInput
            v-model="row.name"
            :disabled="props.disabled"
            :maxlength="255"
            placeholder="请输入等级"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn label="最低分数" width="150">
        <template #default="{ row }">
          <ElInputNumber
            v-model="row.minScore"
            :controls="false"
            :disabled="props.disabled"
            :max="100"
            :min="0"
            :precision="2"
            class="w-full"
            placeholder="0~100"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn label="最高分数" width="150">
        <template #default="{ row }">
          <ElInputNumber
            v-model="row.maxScore"
            :controls="false"
            :disabled="props.disabled"
            :max="100"
            :min="0"
            :precision="2"
            class="w-full"
            placeholder="0~100"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn label="绩效系数" width="150">
        <template #default="{ row }">
          <ElInputNumber
            v-model="row.coefficient"
            :controls="false"
            :disabled="props.disabled"
            :min="0"
            :precision="2"
            class="w-full"
            placeholder="请输入系数"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="操作" width="72">
        <template #default="{ $index }">
          <ElButton
            :disabled="props.disabled"
            link
            type="danger"
            @click="removeLevel($index)"
          >
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </div>
</template>
