<script lang="ts" setup>
import type { FormInstance, Rule } from 'antdv-next';

import type { HrmEmployeeConfigApi } from '#/api/hrm/employee/config';
import type { HrmPortalEmployeeApi } from '#/api/hrm/portal/employee';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { fromTimestampPickerValue, toTimestampPickerValue } from '@vben/utils';

import {
  Col,
  DatePicker,
  Form,
  FormItem,
  Input,
  message,
  Row,
  Select,
} from 'antdv-next';

import { updateEmployee } from '#/api/hrm/portal/employee';
import { HrmEmployeeIdTypeOptions } from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmPortalEmployeeForm' });

const emit = defineEmits<{
  success: [];
}>();

const formRef = ref<FormInstance>();
const editableFields = ref<Set<string>>(new Set());
const formData = ref<HrmPortalEmployeeApi.EmployeeUpdateReq>({});
const formRules: Record<string, Rule[]> = {
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
    message.success('保存成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}
</script>

<template>
  <Modal class="w-[760px]">
    <Form
      ref="formRef"
      :label-col="{ style: { width: '104px' } }"
      :model="formData"
      :rules="formRules"
    >
      <Row :gutter="20">
        <Col v-if="isEditable('name')" :span="12">
          <FormItem label="姓名" name="name">
            <Input
              v-model:value="formData.name"
              :maxlength="255"
              placeholder="请输入姓名"
            />
          </FormItem>
        </Col>
        <Col v-if="isEditable('mobile')" :span="12">
          <FormItem label="手机号" name="mobile">
            <Input
              v-model:value="formData.mobile"
              :maxlength="11"
              placeholder="请输入手机号"
            />
          </FormItem>
        </Col>
        <Col v-if="isEditable('email')" :span="12">
          <FormItem label="邮箱" name="email">
            <Input
              v-model:value="formData.email"
              :maxlength="255"
              placeholder="请输入邮箱"
            />
          </FormItem>
        </Col>
        <Col v-if="isEditable('country')" :span="12">
          <FormItem label="国家或地区" name="country">
            <Input
              v-model:value="formData.country"
              :maxlength="64"
              placeholder="请输入国家或地区"
            />
          </FormItem>
        </Col>
        <Col v-if="isEditable('nation')" :span="12">
          <FormItem label="民族" name="nation">
            <Input
              v-model:value="formData.nation"
              :maxlength="64"
              placeholder="请输入民族"
            />
          </FormItem>
        </Col>
        <Col v-if="isEditable('idType')" :span="12">
          <FormItem label="证件类型" name="idType">
            <Select
              v-model:value="formData.idType"
              allow-clear
              class="w-full"
              :options="[...HrmEmployeeIdTypeOptions]"
              placeholder="请选择证件类型"
            />
          </FormItem>
        </Col>
        <Col v-if="isEditable('idNumber')" :span="12">
          <FormItem label="证件号码" name="idNumber">
            <Input
              v-model:value="formData.idNumber"
              :maxlength="255"
              placeholder="请输入证件号码"
            />
          </FormItem>
        </Col>
        <Col v-if="isEditable('sex')" :span="12">
          <FormItem label="性别" name="sex">
            <Select
              v-model:value="formData.sex"
              allow-clear
              class="w-full"
              :options="sexOptions"
              placeholder="请选择性别"
            />
          </FormItem>
        </Col>
        <Col v-if="isEditable('nativePlace')" :span="12">
          <FormItem label="籍贯" name="nativePlace">
            <Input
              v-model:value="formData.nativePlace"
              :maxlength="128"
              placeholder="请输入籍贯"
            />
          </FormItem>
        </Col>
        <Col v-if="isEditable('birthday')" :span="12">
          <FormItem label="出生时间" name="birthday">
            <DatePicker
              :value="toTimestampPickerValue(formData.birthday)"
              class="w-full"
              format="YYYY-MM-DD HH:mm:ss"
              placeholder="请选择出生时间"
              show-time
              value-format="x"
              @update:value="
                formData.birthday = fromTimestampPickerValue($event)
              "
            />
          </FormItem>
        </Col>
        <Col v-if="isEditable('highestEducation')" :span="12">
          <FormItem label="最高学历" name="highestEducation">
            <Select
              v-model:value="formData.highestEducation"
              allow-clear
              class="w-full"
              :options="educationOptions"
              placeholder="请选择最高学历"
            />
          </FormItem>
        </Col>
        <Col v-if="isEditable('address')" :span="24">
          <FormItem label="户籍地址" name="address">
            <Input
              v-model:value="formData.address"
              :maxlength="255"
              placeholder="请输入户籍地址"
            />
          </FormItem>
        </Col>
      </Row>
    </Form>
  </Modal>
</template>
