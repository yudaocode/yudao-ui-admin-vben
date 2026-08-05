<script lang="ts" setup>
import type { Rule } from 'antdv-next';

import type { HrmSalaryTaxRuleApi } from '#/api/hrm/salary/config/tax-rule';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  Alert,
  Col,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Radio,
  RadioGroup,
  Row,
  Select,
  Switch,
} from 'antdv-next';

import {
  createSalaryTaxRule,
  getSalaryTaxRule,
  updateSalaryTaxRule,
} from '#/api/hrm/salary/config/tax-rule';
import { $t } from '#/locales';
import {
  HrmSalaryTaxCycleType,
  HrmSalaryTaxCycleTypeOptions,
  HrmSalaryTaxType,
} from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmSalaryTaxRuleForm' });

const emit = defineEmits(['success']);

const formType = ref<'create' | 'update'>('create');
const formRef = ref();
const formData = ref<HrmSalaryTaxRuleApi.SalaryTaxRule>(createDefault());

const dialogTitle = computed(() =>
  formType.value === 'create'
    ? $t('ui.actionTitle.create', ['计税规则'])
    : $t('ui.actionTitle.edit', ['计税规则']),
);

const formRules = reactive<Record<string, Rule[]>>({
  name: [{ required: true, message: '方案名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '个税类型不能为空', trigger: 'change' }],
  taxEnabled: [
    { required: true, message: '是否计税不能为空', trigger: 'change' },
  ],
  threshold: [
    {
      validator: async (_: unknown, value?: number) => {
        if (formData.value.type !== HrmSalaryTaxType.NONE && value === null) {
          throw new Error('起征点不能为空');
        }
      },
      trigger: ['blur', 'change'],
    },
  ],
  decimalScale: [
    {
      validator: async (_: unknown, value?: number) => {
        if (formData.value.type !== HrmSalaryTaxType.NONE && value === null) {
          throw new Error('小数位不能为空');
        }
      },
      trigger: ['blur', 'change'],
    },
  ],
  cycleType: [
    {
      validator: async (_: unknown, value?: number) => {
        if (formData.value.type === HrmSalaryTaxType.SALARY && value === null) {
          throw new Error('计税周期不能为空');
        }
      },
      trigger: 'change',
    },
  ],
});

function createDefault(): HrmSalaryTaxRuleApi.SalaryTaxRule {
  return {
    name: '',
    type: HrmSalaryTaxType.SALARY,
    taxEnabled: true,
    threshold: 5000,
    decimalScale: 2,
    cycleType: HrmSalaryTaxCycleType.JANUARY_TO_DECEMBER,
  };
}

function handleTypeChange(type?: number) {
  if (type === HrmSalaryTaxType.SALARY) {
    formData.value.taxEnabled = true;
    formData.value.threshold = 5000;
    formData.value.decimalScale = 2;
    formData.value.cycleType = HrmSalaryTaxCycleType.JANUARY_TO_DECEMBER;
  } else if (type === HrmSalaryTaxType.REMUNERATION) {
    formData.value.taxEnabled = true;
    formData.value.threshold = 800;
    formData.value.decimalScale = 2;
    formData.value.cycleType = undefined;
  } else {
    formData.value.taxEnabled = false;
    formData.value.threshold = 0;
    formData.value.decimalScale = undefined;
    formData.value.cycleType = undefined;
  }
  formRef.value?.clearValidate(['threshold', 'decimalScale', 'cycleType']);
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
    modalApi.lock();
    try {
      await (formType.value === 'create'
        ? createSalaryTaxRule(formData.value)
        : updateSalaryTaxRule(formData.value));
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = createDefault();
      return;
    }
    const data = modalApi.getData<{ id?: number; type: 'create' | 'update' }>();
    formType.value = data?.type || 'create';
    formData.value = data?.id
      ? await getSalaryTaxRule(data.id)
      : createDefault();
  },
});
</script>

<template>
  <Modal :title="dialogTitle" class="w-[620px]">
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="96px"
    >
      <FormItem label="方案名称" name="name">
        <Input
          v-model:value="formData.name"
          :maxlength="64"
          placeholder="请输入方案名称"
        />
      </FormItem>
      <Row :gutter="20">
        <Col :span="12">
          <FormItem label="个税类型" name="type">
            <Select
              v-model:value="formData.type"
              :options="getDictOptions(DICT_TYPE.HRM_SALARY_TAX_TYPE, 'number')"
              class="w-full"
              placeholder="请选择个税类型"
              @change="handleTypeChange"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="是否计税" name="taxEnabled">
            <Switch
              v-model:checked="formData.taxEnabled"
              :disabled="formData.type === HrmSalaryTaxType.NONE"
            />
          </FormItem>
        </Col>
      </Row>
      <Row v-if="formData.type !== HrmSalaryTaxType.NONE" :gutter="20">
        <Col :span="12">
          <FormItem label="起征点" name="threshold">
            <InputNumber
              v-model:value="formData.threshold"
              :min="0"
              :precision="2"
              class="w-full"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="小数位" name="decimalScale">
            <InputNumber
              v-model:value="formData.decimalScale"
              :max="4"
              :min="0"
              class="w-full"
            />
          </FormItem>
        </Col>
      </Row>
      <Alert
        v-if="formData.type !== HrmSalaryTaxType.NONE"
        class="mb-4"
        message="工资薪金默认起征点为 5000 元，劳务报酬默认 800 元，起征点不得小于 0；小数位决定个税计算结果保留 0～4 位。"
        show-icon
        type="info"
      />
      <FormItem
        v-if="formData.type === HrmSalaryTaxType.SALARY"
        label="计税周期"
        name="cycleType"
      >
        <RadioGroup v-model:value="formData.cycleType">
          <Radio
            v-for="item in HrmSalaryTaxCycleTypeOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </Radio>
        </RadioGroup>
      </FormItem>
    </Form>
  </Modal>
</template>
