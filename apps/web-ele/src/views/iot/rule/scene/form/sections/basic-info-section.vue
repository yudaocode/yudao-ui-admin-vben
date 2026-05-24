<!-- 基础信息配置组件 -->
<script setup lang="ts">
import type { RuleSceneApi } from '#/api/iot/rule/scene';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { useVModel } from '@vueuse/core';
import {
  ElCard,
  ElCol,
  ElFormItem,
  ElInput,
  ElRadio,
  ElRadioGroup,
  ElRow,
} from 'element-plus';

import { DictTag } from '#/components/dict-tag';

/** 基础信息配置组件 */
defineOptions({ name: 'BasicInfoSection' });

const props = defineProps<{
  modelValue: RuleSceneApi.SceneRule;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: RuleSceneApi.SceneRule): void;
}>();

const formData = useVModel(props, 'modelValue', emit); // 表单数据
</script>

<template>
  <ElCard
    class="rounded-[8px] mb-[10px] border border-[var(--el-border-color-light)]"
    shadow="never"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <div class="gap-[8px] flex items-center">
          <IconifyIcon
            icon="ep:info-filled"
            class="text-[18px] text-[var(--el-color-primary)]"
          />
          <span
            class="text-[16px] font-600 text-[var(--el-text-color-primary)]"
          >
            基础信息
          </span>
        </div>
        <div class="gap-[8px] flex items-center">
          <DictTag :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        </div>
      </div>
    </template>

    <div class="p-0">
      <ElRow :gutter="24" class="mb-[24px]">
        <ElCol :span="12">
          <ElFormItem label="场景名称" prop="name" required>
            <ElInput
              v-model="formData.name"
              placeholder="请输入场景名称"
              :maxlength="50"
              show-word-limit
              clearable
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="场景状态" prop="status" required>
            <ElRadioGroup v-model="formData.status">
              <ElRadio
                v-for="(dict, index) in getDictOptions(
                  DICT_TYPE.COMMON_STATUS,
                  'number',
                )"
                :key="index"
                :label="dict.value"
              >
                {{ dict.label }}
              </ElRadio>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElFormItem label="场景描述" prop="description">
        <ElInput
          v-model="formData.description"
          type="textarea"
          placeholder="请输入场景描述（可选）"
          :rows="3"
          :maxlength="200"
          show-word-limit
          resize="none"
        />
      </ElFormItem>
    </div>
  </ElCard>
</template>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
