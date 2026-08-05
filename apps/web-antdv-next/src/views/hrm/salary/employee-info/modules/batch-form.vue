<script lang="ts" setup>
import type { Rule } from 'antdv-next';
import type { Dayjs } from 'dayjs';

import type { HrmSalaryEmployeeInfoApi } from '#/api/hrm/salary/employee-info';
import type { SystemDeptApi } from '#/api/system/dept';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import {
  fromTimestampPickerValue,
  handleTree,
  toTimestampPickerValue,
} from '@vben/utils';

import {
  Alert,
  Col,
  DatePicker,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Radio,
  RadioGroup,
  Row,
  Select,
  Table,
  TreeSelect,
} from 'antdv-next';
import dayjs from 'dayjs';

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
const formData = ref<HrmSalaryEmployeeInfoApi.UpdateListReq>(
  createDefaultFormData(),
);
const formRules = reactive<Record<string, Rule[]>>({
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

function disabledEffectDate(current: Dayjs) {
  return (
    !!minEffectDate.value && current.isBefore(dayjs(minEffectDate.value), 'day')
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
        message.success(content);
      } else if (successCount > 0) {
        message.warning(content);
      } else {
        message.error(content);
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
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="104px"
    >
      <Row :gutter="20">
        <Col :span="12">
          <FormItem label="部门范围">
            <TreeSelect
              v-model:value="formData.deptIds"
              :field-names="{
                label: 'name',
                value: 'id',
                children: 'children',
              }"
              :tree-data="deptTree"
              allow-clear
              class="w-full"
              multiple
              placeholder="请选择调薪部门"
              tree-default-expand-all
              tree-checkable
              @change="formRef?.validateFields(['employeeIds'])"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="指定员工" name="employeeIds">
            <HrmEmployeeSelect
              v-model="formData.employeeIds"
              class="w-full"
              multiple
              placeholder="请选择调薪员工"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="调整原因" name="changeReason">
            <Select
              v-model:value="formData.changeReason"
              :options="
                getDictOptions(DICT_TYPE.HRM_SALARY_CHANGE_REASON, 'number')
              "
              class="w-full"
              placeholder="请选择调整原因"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="生效日期" name="effectTime">
            <DatePicker
              :value="toTimestampPickerValue(formData.effectTime)"
              :disabled-date="disabledEffectDate"
              class="w-full"
              value-format="x"
              @update:value="
                formData.effectTime = fromTimestampPickerValue($event)
              "
            />
          </FormItem>
        </Col>
      </Row>

      <Alert
        v-if="isPendingChange()"
        class="mb-4"
        message="批量调整将在生效日期前保持待生效，不会提前修改所选员工的薪资档案。"
        show-icon
        type="warning"
      />

      <FormItem label="调薪方式" name="type">
        <RadioGroup v-model:value="formData.type">
          <Radio :value="HrmSalaryBatchAdjustType.PERCENT">按比例调薪</Radio>
          <Radio :value="HrmSalaryBatchAdjustType.AMOUNT">按金额调薪</Radio>
        </RadioGroup>
      </FormItem>

      <Table
        bordered
        size="small"
        :data-source="formData.salaryOptions"
        :loading="formLoading"
        :pagination="false"
        :row-key="(row) => row.code ?? 0"
        :scroll="{ y: 260 }"
        :columns="[
          { title: '调薪项', dataIndex: 'name', key: 'name' },
          {
            title: '编码',
            dataIndex: 'code',
            key: 'code',
            align: 'center',
            width: 100,
          },
          {
            title:
              formData.type === HrmSalaryBatchAdjustType.PERCENT
                ? '调薪比例'
                : '调薪金额',
            key: 'value',
            align: 'center',
            width: 240,
          },
        ]"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'value'">
            <div class="flex items-center justify-center gap-2">
              <InputNumber
                v-model:value="record.value"
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
        </template>
      </Table>

      <FormItem class="mt-4" label="备注" name="remark">
        <Input.TextArea
          v-model:value="formData.remark"
          :maxlength="500"
          :rows="3"
          show-count
        />
      </FormItem>
    </Form>
  </Modal>
</template>
