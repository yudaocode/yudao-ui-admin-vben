<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { Alert, Button, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createSalaryConfig,
  getSalaryConfig,
  updateSalaryConfig,
} from '#/api/hrm/salary/config/config';
import { $t } from '#/locales';
import { HrmSalarySocialSecurityMonthType } from '#/views/hrm/utils/constants';

import { useFormSchema } from './data';

defineOptions({ name: 'HrmSalaryConfigConfig' });

const loading = ref(false);
const initialized = ref(false);

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 132 },
  layout: 'horizontal',
  schema: useFormSchema(false),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
  handleValuesChange(values, fieldsChanged) {
    if (fieldsChanged.includes('cycleStartDay')) {
      formApi.setFieldValue(
        'cycleEndDay',
        values.cycleStartDay === 1 ? 31 : Number(values.cycleStartDay) - 1,
      );
    }
  },
});

async function loadConfig() {
  loading.value = true;
  try {
    const data = await getSalaryConfig();
    initialized.value = Boolean(data?.startYear && data?.startMonth);
    formApi.setState({ schema: useFormSchema(initialized.value) });
    const cycleStartDay = data?.cycleStartDay ?? 1;
    await formApi.reset();
    await formApi.setValues({
      cycleEndDay: cycleStartDay === 1 ? 31 : cycleStartDay - 1,
      cycleStartDay,
      socialSecurityMonthType:
        data?.socialSecurityMonthType ??
        HrmSalarySocialSecurityMonthType.PREVIOUS_MONTH,
      startYearMonth:
        data?.startYear && data?.startMonth
          ? `${data.startYear}-${String(data.startMonth).padStart(2, '0')}`
          : undefined,
    });
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) return;
  loading.value = true;
  try {
    const values = await formApi.getValues();
    if (initialized.value) {
      await updateSalaryConfig({
        socialSecurityMonthType: values.socialSecurityMonthType,
      });
    } else {
      const [startYear, startMonth] = String(values.startYearMonth)
        .split('-')
        .map(Number);
      await createSalaryConfig({
        cycleStartDay: values.cycleStartDay,
        socialSecurityMonthType: values.socialSecurityMonthType,
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
    <Form class="max-w-[900px]" />
    <div class="mt-4">
      <Button
        v-access:code="['hrm:salary:config:update']"
        :loading="loading"
        type="primary"
        @click="submitForm"
      >
        保存
      </Button>
      <Button class="ml-2" @click="loadConfig">重置</Button>
    </div>
  </Page>
</template>
