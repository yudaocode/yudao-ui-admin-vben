<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { HrmEmployeeConfigApi } from '#/api/hrm/employee/config';
import type { HrmPortalEmployeeApi } from '#/api/hrm/portal/employee';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  ElCol,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElRow,
  ElSelect,
} from 'element-plus';

import { updateEmployee } from '#/api/hrm/portal/employee';
import { HrmEmployeeIdTypeOptions } from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmPortalEmployeeForm' });

const emit = defineEmits<{
  success: [];
}>();

const formRef = ref<FormInstance>();
const editableFields = ref<Set<string>>(new Set());
const formData = ref<HrmPortalEmployeeApi.EmployeeUpdateReq>({});

const formRules: FormRules = {
  name: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
  mobile: [
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号码',
      trigger: 'blur',
    },
  ],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }],
};

const sexOptions = getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number');
const educationOptions = getDictOptions(
  DICT_TYPE.HRM_EMPLOYEE_EDUCATION,
  'number',
);

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await submitForm();
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      formData.value = {};
      editableFields.value = new Set();
    }
  },
  title: '编辑我的档案',
});

/** 判断字段是否允许编辑 */
function isEditable(name: string) {
  return editableFields.value.has(name);
}

/** 打开弹窗 */
async function open(
  employee: Partial<HrmPortalEmployeeApi.PortalEmployee>,
  fields: HrmEmployeeConfigApi.FieldConfig[],
) {
  editableFields.value = new Set(
    fields.filter((field) => field.editable).map((field) => field.name),
  );
  const employeeFormData: HrmPortalEmployeeApi.EmployeeUpdateReq = {
    name: employee.name || '',
    mobile: employee.mobile,
    country: employee.country,
    nation: employee.nation,
    idType: employee.idType,
    idNumber: employee.idNumber,
    sex: employee.sex,
    email: employee.email,
    nativePlace: employee.nativePlace,
    birthday: employee.birthday,
    address: employee.address,
    highestEducation: employee.highestEducation,
  };
  formData.value = Object.fromEntries(
    Object.entries(employeeFormData).filter(([name]) =>
      editableFields.value.has(name),
    ),
  ) as HrmPortalEmployeeApi.EmployeeUpdateReq;
  modalApi.open();
  await nextTick();
  formRef.value?.clearValidate();
}

defineExpose({ open });

/** 提交表单 */
async function submitForm() {
  if (!formRef.value) {
    return;
  }
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  modalApi.lock();
  try {
    await updateEmployee(formData.value);
    ElMessage.success('保存成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}
</script>

<template>
  <Modal class="w-[760px]">
    <ElForm
      ref="formRef"
      label-width="104px"
      :model="formData"
      :rules="formRules"
    >
      <ElRow :gutter="20">
        <ElCol v-if="isEditable('name')" :span="12">
          <ElFormItem label="姓名" prop="name">
            <ElInput
              v-model="formData.name"
              maxlength="255"
              placeholder="请输入姓名"
            />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="isEditable('mobile')" :span="12">
          <ElFormItem label="手机号" prop="mobile">
            <ElInput
              v-model="formData.mobile"
              maxlength="11"
              placeholder="请输入手机号"
            />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="isEditable('email')" :span="12">
          <ElFormItem label="邮箱" prop="email">
            <ElInput
              v-model="formData.email"
              maxlength="255"
              placeholder="请输入邮箱"
            />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="isEditable('country')" :span="12">
          <ElFormItem label="国家或地区" prop="country">
            <ElInput
              v-model="formData.country"
              maxlength="64"
              placeholder="请输入国家或地区"
            />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="isEditable('nation')" :span="12">
          <ElFormItem label="民族" prop="nation">
            <ElInput
              v-model="formData.nation"
              maxlength="64"
              placeholder="请输入民族"
            />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="isEditable('idType')" :span="12">
          <ElFormItem label="证件类型" prop="idType">
            <ElSelect
              v-model="formData.idType"
              clearable
              class="!w-full"
              placeholder="请选择证件类型"
            >
              <ElOption
                v-for="item in HrmEmployeeIdTypeOptions"
                :key="String(item.value)"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol v-if="isEditable('idNumber')" :span="12">
          <ElFormItem label="证件号码" prop="idNumber">
            <ElInput
              v-model="formData.idNumber"
              maxlength="255"
              placeholder="请输入证件号码"
            />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="isEditable('sex')" :span="12">
          <ElFormItem label="性别" prop="sex">
            <ElSelect
              v-model="formData.sex"
              clearable
              class="!w-full"
              placeholder="请选择性别"
            >
              <ElOption
                v-for="item in sexOptions"
                :key="String(item.value)"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol v-if="isEditable('nativePlace')" :span="12">
          <ElFormItem label="籍贯" prop="nativePlace">
            <ElInput
              v-model="formData.nativePlace"
              maxlength="128"
              placeholder="请输入籍贯"
            />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="isEditable('birthday')" :span="12">
          <ElFormItem label="出生时间" prop="birthday">
            <ElDatePicker
              v-model="formData.birthday"
              class="!w-full"
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择出生时间"
              type="datetime"
              value-format="x"
            />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="isEditable('highestEducation')" :span="12">
          <ElFormItem label="最高学历" prop="highestEducation">
            <ElSelect
              v-model="formData.highestEducation"
              clearable
              class="!w-full"
              placeholder="请选择最高学历"
            >
              <ElOption
                v-for="item in educationOptions"
                :key="String(item.value)"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol v-if="isEditable('address')" :span="24">
          <ElFormItem label="户籍地址" prop="address">
            <ElInput
              v-model="formData.address"
              maxlength="255"
              placeholder="请输入户籍地址"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>
  </Modal>
</template>
