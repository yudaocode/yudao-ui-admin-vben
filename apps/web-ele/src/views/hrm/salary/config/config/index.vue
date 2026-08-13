<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import {
  createSalaryConfig,
  getSalaryConfig,
  updateSalaryConfig,
} from '#/api/hrm/salary/config/config';
import { $t } from '#/locales';
import {
  HrmSalarySocialSecurityMonthType,
  HrmSalarySocialSecurityMonthTypeOptions,
} from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmSalaryConfigConfig' });

interface FormModel {
  cycleStartDay: number;
  socialSecurityMonthType: number;
  startYearMonth?: string;
}

const loading = ref(false);
const initialized = ref(false);
const formRef = ref();
const formData = ref<FormModel>({
  cycleStartDay: 1,
  socialSecurityMonthType: HrmSalarySocialSecurityMonthType.PREVIOUS_MONTH,
  startYearMonth: undefined,
});

const formRules = reactive({
  cycleStartDay: [
    { required: true, message: '计薪周期开始日不能为空', trigger: 'blur' },
  ],
  socialSecurityMonthType: [
    { required: true, message: '对应社保自然月不能为空', trigger: 'change' },
  ],
  startYearMonth: [
    { required: true, message: '薪资启用月份不能为空', trigger: 'change' },
  ],
});

function getCycleEndDay(cycleStartDay: number) {
  return cycleStartDay === 1 ? 31 : cycleStartDay - 1;
}

async function loadConfig() {
  loading.value = true;
  try {
    const data = await getSalaryConfig();
    initialized.value = Boolean(data?.startYear && data?.startMonth);
    formData.value = {
      cycleStartDay: data?.cycleStartDay ?? 1,
      socialSecurityMonthType:
        data?.socialSecurityMonthType ??
        HrmSalarySocialSecurityMonthType.PREVIOUS_MONTH,
      startYearMonth:
        data?.startYear && data?.startMonth
          ? `${data.startYear}-${String(data.startMonth).padStart(2, '0')}`
          : undefined,
    };
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  await (initialized.value
    ? formRef.value?.validateFields(['socialSecurityMonthType'])
    : formRef.value?.validate());
  loading.value = true;
  try {
    if (initialized.value) {
      await updateSalaryConfig({
        socialSecurityMonthType: formData.value.socialSecurityMonthType,
      });
    } else {
      const [startYear, startMonth] = (formData.value.startYearMonth || '-')
        .split('-')
        .map(Number);
      await createSalaryConfig({
        cycleStartDay: formData.value.cycleStartDay,
        socialSecurityMonthType: formData.value.socialSecurityMonthType,
        startYear: startYear!,
        startMonth: startMonth!,
      });
    }
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    await loadConfig();
  } finally {
    loading.value = false;
  }
}

onMounted(loadConfig);
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【薪资】计薪设置、薪资档案"
        url="https://doc.iocoder.cn/hrm/salary/config/"
      />
    </template>
    <ElAlert
      v-if="initialized"
      class="mb-4"
      message="计薪初始化已完成，仅可调整对应社保自然月。"
      show-icon
      type="info"
    />
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="max-w-[900px]"
      label-width="132px"
    >
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="计薪周期开始日" name="cycleStartDay">
            <ElInputNumber
              v-model="formData.cycleStartDay"
              :disabled="initialized"
              :max="31"
              :min="1"
              class="w-full"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="工资周期结束日">
            <ElInputNumber
              :disabled="true"
              :max="31"
              :min="1"
              :value="getCycleEndDay(formData.cycleStartDay)"
              class="w-full"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow v-if="!initialized" :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="薪资启用月份" name="startYearMonth">
            <ElDatePicker
              v-model="formData.startYearMonth"
              :disabled="initialized"
              class="w-full"
              type="month"
              value-format="YYYY-MM"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElFormItem label="对应社保自然月" name="socialSecurityMonthType">
        <ElRadioGroup v-model="formData.socialSecurityMonthType">
          <ElRadio
            v-for="item in HrmSalarySocialSecurityMonthTypeOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem>
        <ElButton
          v-access:code="['hrm:salary:config:update']"
          :loading="loading"
          type="primary"
          @click="submitForm"
        >
          保存
        </ElButton>
        <ElButton class="ml-2" @click="loadConfig">重置</ElButton>
      </ElFormItem>
    </ElForm>
  </Page>
</template>
