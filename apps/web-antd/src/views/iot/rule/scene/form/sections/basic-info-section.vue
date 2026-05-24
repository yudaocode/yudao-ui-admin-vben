<!-- 基础信息配置组件 -->
<script setup lang="ts">
import type { RuleSceneApi } from '#/api/iot/rule/scene';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { useVModel } from '@vueuse/core';
import { Card, Col, Form, Input, Radio, Row } from 'ant-design-vue';

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
  <Card class="rounded-[8px] mb-[10px]! border border-primary" shadow="never">
    <template #title>
      <div class="flex items-center justify-between">
        <div class="gap-[8px] flex items-center">
          <IconifyIcon icon="ep:info-filled" class="text-[18px] text-primary" />
          <span class="text-[16px] font-semibold text-foreground">
            基础信息
          </span>
        </div>
        <div class="gap-[8px] flex items-center">
          <DictTag :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        </div>
      </div>
    </template>

    <div class="p-0">
      <Row :gutter="24" class="mb-[24px]">
        <Col :span="12">
          <Form.Item label="场景名称" name="name" required>
            <Input
              v-model:value="formData.name"
              placeholder="请输入场景名称"
              :maxlength="50"
              show-word-limit
              allow-clear
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="场景状态" name="status" required>
            <Radio.Group v-model:value="formData.status">
              <Radio
                v-for="(dict, index) in getDictOptions(
                  DICT_TYPE.COMMON_STATUS,
                  'number',
                )"
                :key="index"
                :value="dict.value"
              >
                {{ dict.label }}
              </Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="场景描述" name="description">
        <Input.TextArea
          v-model:value="formData.description"
          placeholder="请输入场景描述（可选）"
          :rows="3"
          :maxlength="200"
          show-word-limit
          resize="none"
        />
      </Form.Item>
    </div>
  </Card>
</template>

<style scoped>
:deep(.ant-form-item) {
  margin-bottom: 20px;
}

:deep(.ant-form-item:last-child) {
  margin-bottom: 0;
}
</style>
