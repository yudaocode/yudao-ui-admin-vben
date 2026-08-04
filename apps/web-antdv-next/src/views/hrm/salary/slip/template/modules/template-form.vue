<script lang="ts" setup>
import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';
import type { HrmSalarySlipTemplateApi } from '#/api/hrm/salary/slip/template';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createSalarySlipTemplate,
  getSalarySlipTemplate,
  updateSalarySlipTemplate,
} from '#/api/hrm/salary/slip/template';
import {
  HrmSalaryOptionCategoryCode,
  HrmSalaryOptionCode,
  HrmSalarySlipTemplateOptionType,
} from '#/views/hrm/utils/constants';

import SalaryOptionSelect from '../../components/salary-option-select.vue';
import TemplateOptionEditor from './template-option-editor.vue';

defineOptions({ name: 'HrmSalarySlipTemplateForm' });

const emit = defineEmits<{
  success: [id: number];
}>();

const formType = ref<'create' | 'update'>('create');
const salaryOptionList = ref<HrmSalaryOptionApi.SalaryOption[]>([]);
const salaryOptionAllList = ref<HrmSalaryOptionApi.SalaryOption[]>([]);
const selectedCodes = ref<number[]>([]);
const templateOptions = ref<HrmSalarySlipTemplateApi.TemplateOption[]>([]);
const optionSelectRef = ref<InstanceType<typeof SalaryOptionSelect>>();
const optionEditorRef = ref<InstanceType<typeof TemplateOptionEditor>>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 104,
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Input',
      dependencies: {
        show: false,
        triggerFields: ['id'],
      },
      fieldName: 'id',
      label: '编号',
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: '模板名称',
      rules: 'required',
      componentProps: {
        maxlength: 64,
        placeholder: '请输入模板名称',
      },
    },
    {
      component: 'Switch',
      defaultValue: false,
      fieldName: 'hideEmpty',
      label: '隐藏空项',
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const validateMessage = optionEditorRef.value?.validate();
    if (validateMessage) {
      message.warning(validateMessage);
      return;
    }
    modalApi.lock();
    try {
      const values = await formApi.getValues();
      const payload: HrmSalarySlipTemplateApi.SalarySlipTemplate = {
        hideEmpty: Boolean(values.hideEmpty),
        name: values.name,
        options: optionEditorRef.value?.getNormalizedOptions() || [],
      };
      if (formType.value === 'update') {
        await updateSalarySlipTemplate({
          ...payload,
          id: values.id,
        });
        message.success('更新成功');
        await modalApi.close();
        emit('success', values.id);
        return;
      }
      const id = await createSalarySlipTemplate(payload);
      message.success('创建成功');
      await modalApi.close();
      emit('success', id);
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      selectedCodes.value = [];
      templateOptions.value = [];
      formType.value = 'create';
    }
  },
});

async function open(type: 'create' | 'update', id?: number) {
  modalApi.setState({
    title: type === 'create' ? '新增工资条模板' : '编辑工资条模板',
  });
  formType.value = type;
  modalApi.open();
  modalApi.lock();
  try {
    await formApi.resetForm();
    salaryOptionAllList.value = (await optionSelectRef.value?.init()) || [];
    salaryOptionList.value = salaryOptionAllList.value.filter(
      (item) => item.parentCode !== HrmSalaryOptionCategoryCode.ROOT,
    );
    selectedCodes.value = [HrmSalaryOptionCode.REAL_PAY];
    handleSelectedCodesChange(selectedCodes.value);
    if (id) {
      const data = await getSalarySlipTemplate(id);
      templateOptions.value = (data.options || []).map((item) => ({
        ...item,
        parentCode:
          item.parentCode === HrmSalaryOptionCategoryCode.ROOT
            ? undefined
            : item.parentCode,
      }));
      selectedCodes.value = templateOptions.value
        .filter(
          (item) => item.type !== HrmSalarySlipTemplateOptionType.CATEGORY,
        )
        .map((item) => item.code)
        .filter((code): code is number => code !== undefined);
      if (!selectedCodes.value.includes(HrmSalaryOptionCode.REAL_PAY)) {
        selectedCodes.value.push(HrmSalaryOptionCode.REAL_PAY);
        handleSelectedCodesChange(selectedCodes.value);
      }
      await formApi.setValues({
        hideEmpty: data.hideEmpty,
        id: data.id,
        name: data.name,
      });
    }
  } finally {
    modalApi.unlock();
  }
}

function handleSelectedCodesChange(codes: number[]) {
  templateOptions.value = templateOptions.value.filter(
    (item) =>
      item.type === HrmSalarySlipTemplateOptionType.CATEGORY ||
      (item.code !== undefined && codes.includes(item.code)),
  );
  codes.forEach((code) => {
    if (
      templateOptions.value.some(
        (item) =>
          item.type === HrmSalarySlipTemplateOptionType.ITEM &&
          item.code === code,
      )
    ) {
      return;
    }
    const salaryOption = salaryOptionList.value.find(
      (item) => item.code === code,
    );
    if (!salaryOption) {
      return;
    }
    const categoryCode =
      salaryOption.parentCode || HrmSalaryOptionCategoryCode.ROOT;
    ensureSalaryOptionCategory(categoryCode);
    templateOptions.value.push({
      code: salaryOption.code,
      hidden: false,
      name: salaryOption.name,
      parentCode: categoryCode,
      sort: getNextSort(),
      type: HrmSalarySlipTemplateOptionType.ITEM,
    });
  });
}

function ensureSalaryOptionCategory(categoryCode: number) {
  if (
    !categoryCode ||
    templateOptions.value.some(
      (item) =>
        item.type === HrmSalarySlipTemplateOptionType.CATEGORY &&
        item.code === categoryCode,
    )
  ) {
    return;
  }
  const category = salaryOptionAllList.value.find(
    (item) => item.code === categoryCode,
  );
  templateOptions.value.push({
    code: categoryCode,
    hidden: false,
    name: category?.name || '其他',
    parentCode: HrmSalaryOptionCategoryCode.ROOT,
    sort: getNextSort(),
    type: HrmSalarySlipTemplateOptionType.CATEGORY,
  });
}

function handleOptionRemove(option: HrmSalarySlipTemplateApi.TemplateOption) {
  if (
    option.type === HrmSalarySlipTemplateOptionType.ITEM &&
    option.code !== undefined
  ) {
    selectedCodes.value = selectedCodes.value.filter(
      (code) => code !== option.code,
    );
  }
}

function getNextSort() {
  return (
    Math.max(0, ...templateOptions.value.map((item) => item.sort || 0)) + 1
  );
}

defineExpose({ open });
</script>

<template>
  <Modal class="w-[1000px]">
    <Form />
    <div class="mb-4 mt-2">
      <div class="mb-2 text-sm font-medium">工资项</div>
      <SalaryOptionSelect
        ref="optionSelectRef"
        v-model="selectedCodes"
        :disabled-codes="[HrmSalaryOptionCode.REAL_PAY]"
        placeholder="请选择工资条项目"
        @change="handleSelectedCodesChange"
      />
    </div>
    <div>
      <div class="mb-2 text-sm font-medium">模板明细</div>
      <TemplateOptionEditor
        ref="optionEditorRef"
        v-model="templateOptions"
        @remove="handleOptionRemove"
      />
    </div>
  </Modal>
</template>
