<script lang="ts" setup>
import type { Rule } from 'antdv-next';

import { onMounted, reactive, ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Col,
  DatePicker,
  Form,
  FormItem,
  InputNumber,
  message,
  Radio,
  RadioGroup,
  Row,
} from 'antdv-next';

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

const formRules = reactive<Record<string, Rule[]>>({
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
    message.success($t('ui.actionMessage.operationSuccess'));
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
    <Alert
      v-if="initialized"
      class="mb-4"
      message="计薪初始化已完成，仅可调整对应社保自然月。"
      show-icon
      type="info"
    />
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="max-w-[900px]"
      label-width="132px"
    >
      <Row :gutter="20">
        <Col :span="12">
          <FormItem label="计薪周期开始日" name="cycleStartDay">
            <InputNumber
              v-model:value="formData.cycleStartDay"
              :disabled="initialized"
              :max="31"
              :min="1"
              class="w-full"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="工资周期结束日">
            <InputNumber
              :disabled="true"
              :max="31"
              :min="1"
              :value="getCycleEndDay(formData.cycleStartDay)"
              class="w-full"
            />
          </FormItem>
        </Col>
      </Row>
      <Row v-if="!initialized" :gutter="20">
        <Col :span="12">
          <FormItem label="薪资启用月份" name="startYearMonth">
            <DatePicker
              v-model:value="formData.startYearMonth"
              :disabled="initialized"
              class="w-full"
              picker="month"
              value-format="YYYY-MM"
            />
          </FormItem>
        </Col>
      </Row>
      <FormItem label="对应社保自然月" name="socialSecurityMonthType">
        <RadioGroup v-model:value="formData.socialSecurityMonthType">
          <Radio
            v-for="item in HrmSalarySocialSecurityMonthTypeOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </Radio>
        </RadioGroup>
      </FormItem>
      <FormItem>
        <Button
          v-access:code="['hrm:salary:config:update']"
          :loading="loading"
          type="primary"
          @click="submitForm"
        >
          保存
        </Button>
        <Button class="ml-2" @click="loadConfig">重置</Button>
      </FormItem>
    </Form>
  </Page>
</template>
