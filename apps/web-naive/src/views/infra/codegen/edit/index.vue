<script lang="ts" setup>
import type { InfraCodegenApi } from '#/api/infra/codegen';

import { ref, unref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { NButton, NSteps } from 'naive-ui';

import { message } from '#/adapter/naive';
import { getCodegenTable, updateCodegenTable } from '#/api/infra/codegen';
import { $t } from '#/locales';

import BasicInfo from '../modules/basic-info.vue';
import ColumnInfo from '../modules/column-info.vue';
import GenerationInfo from '../modules/generation-info.vue';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const currentStep = ref(0);
const formData = ref<InfraCodegenApi.CodegenDetail>({
  table: {} as InfraCodegenApi.CodegenTable,
  columns: [],
});

/** 表单引用 */
const basicInfoRef = ref<InstanceType<typeof BasicInfo>>();
const columnInfoRef = ref<InstanceType<typeof ColumnInfo>>();
const generateInfoRef = ref<InstanceType<typeof GenerationInfo>>();

/** 获取详情数据 */
const getDetail = async () => {
  const id = route.query.id as any;
  if (!id) {
    return;
  }
  loading.value = true;
  try {
    formData.value = await getCodegenTable(id);
  } finally {
    loading.value = false;
  }
};

/** 提交表单 */
const submitForm = async () => {
  // 表单验证
  const basicInfoValid = await basicInfoRef.value?.validate();
  if (!basicInfoValid) {
    message.warn('保存失败，原因：基本信息表单校验失败请检查！！！');
    return;
  }
  const generateInfoValid = await generateInfoRef.value?.validate();
  if (!generateInfoValid) {
    message.warn('保存失败，原因：生成信息表单校验失败请检查！！！');
    return;
  }

  // 提交表单
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.updating'),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    // 拼接相关信息
    const basicInfo = await basicInfoRef.value?.getValues();
    const columns = columnInfoRef.value?.getData() || unref(formData).columns;
    const generateInfo = await generateInfoRef.value?.getValues();
    await updateCodegenTable({
      table: { ...unref(formData).table, ...basicInfo, ...generateInfo },
      columns,
    });
    // 关闭并提示
    message.success($t('ui.actionMessage.operationSuccess'));
    close();
  } catch (error) {
    console.error('保存失败', error);
  } finally {
    hideLoading();
  }
};
const tabs = useTabs();
/** 返回列表 */
const close = () => {
  tabs.closeCurrentTab();
  router.push('/infra/codegen');
};

/** 下一步 */
const nextStep = async () => {
  currentStep.value += 1;
};

/** 上一步 */
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value -= 1;
  }
};

/** 步骤配置 */
const steps = [
  {
    title: '基本信息',
  },
  {
    title: '字段信息',
  },
  {
    title: '生成信息',
  },
];

// 初始化
getDetail();
</script>

<template>
  <Page auto-content-height v-loading="loading">
    <div
      class="flex h-[95%] flex-col rounded-md bg-white p-4 dark:bg-[#1f1f1f] dark:text-gray-300"
    >
      <NSteps
        type="navigation"
        v-model:current="currentStep"
        class="mb-8 rounded shadow-sm dark:bg-[#141414]"
      >
        <Steps.Step
          v-for="(step, index) in steps"
          :key="index"
          :title="step.title"
        />
      </NSteps>

      <div class="flex-1 overflow-auto py-4">
        <!-- 根据当前步骤显示对应的组件 -->
        <BasicInfo
          v-show="currentStep === 0"
          ref="basicInfoRef"
          :table="formData.table"
        />
        <ColumnInfo
          v-show="currentStep === 1"
          ref="columnInfoRef"
          :columns="formData.columns"
        />
        <GenerationInfo
          v-show="currentStep === 2"
          ref="generateInfoRef"
          :table="formData.table"
          :columns="formData.columns"
        />
      </div>

      <div class="mt-4 flex justify-end space-x-2">
        <NButton v-show="currentStep > 0" @click="prevStep">上一步</NButton>
        <NButton v-show="currentStep < steps.length - 1" @click="nextStep">
          下一步
        </NButton>
        <NButton type="primary" :loading="loading" @click="submitForm">
          保存
        </NButton>
      </div>
    </div>
  </Page>
</template>
