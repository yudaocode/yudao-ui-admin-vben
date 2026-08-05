<script lang="ts" setup>
import type { HrmSalaryEmployeeInfoApi } from '#/api/hrm/salary/employee-info';
import type { SystemDeptApi } from '#/api/system/dept';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { handleTree } from '@vben/utils';

import dayjs from 'dayjs';
import {
  ElAlert,
  ElCol,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElRow,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTreeSelect,
} from 'element-plus';

import { getSalaryOptionSimpleList } from '#/api/hrm/salary/config/option';
import {
  getSalaryAdjustmentMinEffectDate,
  updateSalaryEmployeeInfoList,
} from '#/api/hrm/salary/employee-info';
import { getSimpleDeptList } from '#/api/system/dept';
import HrmEmployeeSelect from '#/views/hrm/employee/components/employee-select.vue';
import {
  HrmSalaryBatchAdjustType,
  HrmSalaryChangeReason,
  HrmSalaryOptionCategoryCode,
} from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmSalaryEmployeeInfoBatchForm' });

const emit = defineEmits(['success']);

const formRef = ref();
const formLoading = ref(false);
const minEffectDate = ref<string>();
const deptTree = ref<SystemDeptApi.Dept[]>([]);
const deptTreeProps = {
  children: 'children',
  label: 'name',
};
const formData = ref<HrmSalaryEmployeeInfoApi.UpdateListReq>(
  createDefaultFormData(),
);

const formRules = reactive({
  employeeIds: [
    {
      validator: async () => {
        if (
          formData.value.employeeIds.length > 0 ||
          formData.value.deptIds.length > 0
        ) {
          return;
        }
        throw new Error('至少需要选择一个部门或员工');
      },
      trigger: 'change',
    },
  ],
  type: [{ required: true, message: '调薪方式不能为空', trigger: 'change' }],
  changeReason: [
    { required: true, message: '调整原因不能为空', trigger: 'change' },
  ],
  effectTime: [
    { required: true, message: '生效日期不能为空', trigger: 'change' },
  ],
});

function createDefaultFormData(): HrmSalaryEmployeeInfoApi.UpdateListReq {
  return {
    employeeIds: [],
    deptIds: [],
    type: HrmSalaryBatchAdjustType.PERCENT,
    changeReason: HrmSalaryChangeReason.ENTRY_SALARY,
    effectTime: dayjs().startOf('day').valueOf(),
    remark: '',
    salaryOptions: [],
  };
}

function isPendingChange() {
  return dayjs(Number(formData.value.effectTime)).isAfter(dayjs(), 'day');
}

function disabledEffectDate(date: Date) {
  return (
    !!minEffectDate.value &&
    dayjs(date).isBefore(dayjs(minEffectDate.value), 'day')
  );
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
    modalApi.lock();
    formLoading.value = true;
    try {
      const data = await updateSalaryEmployeeInfoList(formData.value);
      const successCount = data.successEmployeeIds.length;
      const failureCount = Object.keys(data.failureEmployeeReasons).length;
      const content = `批量调薪完成：成功 ${successCount} 人，失败 ${failureCount} 人`;
      if (failureCount === 0) {
        ElMessage.success(content);
      } else if (successCount > 0) {
        ElMessage.warning(content);
      } else {
        ElMessage.error(content);
      }
      if (successCount > 0) {
        await modalApi.close();
        emit('success');
      }
    } finally {
      formLoading.value = false;
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      formData.value = createDefaultFormData();
      formRef.value?.clearValidate();
    }
  },
  title: '批量调薪',
});

async function open(employeeIds: number[]) {
  formData.value = createDefaultFormData();
  formData.value.employeeIds = [...employeeIds];
  modalApi.open();
  formLoading.value = true;
  try {
    const [options, adjustmentMinEffectDate, deptList] = await Promise.all([
      getSalaryOptionSimpleList(),
      getSalaryAdjustmentMinEffectDate(),
      getSimpleDeptList(),
    ]);
    deptTree.value = handleTree(deptList);
    formData.value.salaryOptions = options
      .filter(
        (option) =>
          option.parentCode === HrmSalaryOptionCategoryCode.BASIC_SALARY,
      )
      .map((option) => ({ code: option.code, name: option.name, value: 0 }));
    minEffectDate.value = adjustmentMinEffectDate || undefined;
  } finally {
    formLoading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Modal class="w-[980px]">
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="104px"
    >
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="部门范围">
            <ElTreeSelect
              v-model="formData.deptIds"
              :data="deptTree"
              :props="deptTreeProps"
              check-strictly
              clearable
              class="w-full"
              default-expand-all
              multiple
              node-key="id"
              placeholder="请选择调薪部门"
              @change="formRef?.validateField('employeeIds')"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="指定员工" prop="employeeIds">
            <HrmEmployeeSelect
              v-model="formData.employeeIds"
              class="w-full"
              multiple
              placeholder="请选择调薪员工"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="调整原因" prop="changeReason">
            <ElSelect
              v-model="formData.changeReason"
              class="w-full"
              placeholder="请选择调整原因"
            >
              <ElOption
                v-for="item in getDictOptions(
                  DICT_TYPE.HRM_SALARY_CHANGE_REASON,
                  'number',
                )"
                :key="String(item.value)"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="生效日期" prop="effectTime">
            <ElDatePicker
              v-model="formData.effectTime"
              :disabled-date="disabledEffectDate"
              class="w-full!"
              type="date"
              value-format="x"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElAlert
        v-if="isPendingChange()"
        class="mb-4"
        show-icon
        title="批量调整将在生效日期前保持待生效，不会提前修改所选员工的薪资档案。"
        type="warning"
      />

      <ElFormItem label="调薪方式" prop="type">
        <ElRadioGroup v-model="formData.type">
          <ElRadio :value="HrmSalaryBatchAdjustType.PERCENT">
            按比例调薪
          </ElRadio>
          <ElRadio :value="HrmSalaryBatchAdjustType.AMOUNT">按金额调薪</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <ElTable
        v-loading="formLoading"
        border
        max-height="260"
        size="small"
        :data="formData.salaryOptions"
      >
        <ElTableColumn label="调薪项" min-width="180" prop="name" />
        <ElTableColumn align="center" label="编码" prop="code" width="100" />
        <ElTableColumn
          align="center"
          :label="
            formData.type === HrmSalaryBatchAdjustType.PERCENT
              ? '调薪比例'
              : '调薪金额'
          "
          width="240"
        >
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-2">
              <ElInputNumber
                v-model="row.value"
                :controls="false"
                :max="
                  formData.type === HrmSalaryBatchAdjustType.PERCENT
                    ? 9999.99
                    : 9999999.99
                "
                :precision="2"
                class="w-[180px]"
              />
              <span>{{
                formData.type === HrmSalaryBatchAdjustType.PERCENT ? '%' : '元'
              }}</span>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>

      <ElFormItem class="mt-4" label="备注" prop="remark">
        <ElInput
          v-model="formData.remark"
          :maxlength="500"
          :rows="3"
          show-word-limit
          type="textarea"
        />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
