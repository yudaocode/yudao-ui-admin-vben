<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { CrmPerformanceConfigApi } from '#/api/crm/performance/config';
import type { SystemUserApi } from '#/api/system/user';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { erpPriceInputFormatter, handleTree } from '@vben/utils';

import { ElMessage } from 'element-plus';

import {
  createPerformanceConfig,
  getPerformanceConfig,
  PerformanceConfigObjectTypeEnum,
  updatePerformanceConfig,
} from '#/api/crm/performance/config';
import { BizTypeEnum } from '#/api/crm/permission';
import { getSimpleDeptList } from '#/api/system/dept';
import { getSimpleUserList } from '#/api/system/user';
import { $t } from '#/locales';

import { bizTypeOptions, monthFields, objectTypeOptions } from '../data';

const emit = defineEmits(['success']);
const formRef = ref<FormInstance>();
const formData = ref<any>({});
const deptList = ref<any[]>([]);
const userList = ref<SystemUserApi.User[]>([]);
const treeProps = { label: 'name', value: 'id', children: 'children' };

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['业绩目标'])
    : $t('ui.actionTitle.create', ['业绩目标']);
});

const formRules = reactive<FormRules>({
  year: [{ required: true, message: '年份不能为空', trigger: 'change' }],
  bizType: [{ required: true, message: '目标类型不能为空', trigger: 'change' }],
  objectType: [
    { required: true, message: '对象类型不能为空', trigger: 'change' },
  ],
  objectId: [{ required: true, message: '目标对象不能为空', trigger: 'change' }],
});

/** 年度目标金额 */
const yearTargetPrice = computed(() =>
  monthFields.reduce(
    (sum, item) => sum + Number(formData.value[item.prop] || 0),
    0,
  ),
);

/** 年度目标金额展示文本 */
const yearTargetPriceText = computed(() =>
  erpPriceInputFormatter(yearTargetPrice.value),
);

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const valid = await formRef.value?.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    try {
      const data = {
        ...formData.value,
        year: Number(formData.value.year),
      } as CrmPerformanceConfigApi.PerformanceConfig;
      await (data.id
        ? updatePerformanceConfig(data)
        : createPerformanceConfig(data));
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    resetForm();
    await loadOptions();
    const data =
      modalApi.getData<CrmPerformanceConfigApi.PerformanceConfig>();
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      const detail = await getPerformanceConfig(data.id);
      formData.value = {
        ...detail,
        year: String(detail.year),
      };
    } finally {
      modalApi.unlock();
    }
  },
});

/** 对象类型变化时重置目标对象 */
function handleObjectTypeChange() {
  formData.value.objectId = undefined;
}

/** 加载部门和员工选项 */
async function loadOptions() {
  if (!deptList.value.length) {
    deptList.value = handleTree(await getSimpleDeptList());
  }
  if (!userList.value.length) {
    userList.value = await getSimpleUserList();
  }
}

/** 重置表单 */
function resetForm() {
  formData.value = {
    id: undefined,
    objectId: undefined,
    objectType: PerformanceConfigObjectTypeEnum.DEPT,
    year: new Date().getFullYear().toString(),
    bizType: BizTypeEnum.CRM_CONTRACT,
    januaryTargetPrice: 0,
    februaryTargetPrice: 0,
    marchTargetPrice: 0,
    aprilTargetPrice: 0,
    mayTargetPrice: 0,
    juneTargetPrice: 0,
    julyTargetPrice: 0,
    augustTargetPrice: 0,
    septemberTargetPrice: 0,
    octoberTargetPrice: 0,
    novemberTargetPrice: 0,
    decemberTargetPrice: 0,
  };
  formRef.value?.resetFields();
}
</script>

<template>
  <Modal class="w-3/5" :title="getTitle">
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <ElRow :gutter="16">
        <ElCol :span="8">
          <ElFormItem label="年份" prop="year">
            <ElDatePicker
              v-model="formData.year"
              class="!w-full"
              type="year"
              value-format="YYYY"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="8">
          <ElFormItem label="目标类型" prop="bizType">
            <ElSelect
              v-model="formData.bizType"
              class="!w-full"
              placeholder="请选择目标类型"
            >
              <ElOption
                v-for="item in bizTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="8">
          <ElFormItem label="对象类型" prop="objectType">
            <ElSelect
              v-model="formData.objectType"
              class="!w-full"
              placeholder="请选择对象类型"
              @change="handleObjectTypeChange"
            >
              <ElOption
                v-for="item in objectTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElFormItem label="目标对象" prop="objectId">
        <ElTreeSelect
          v-if="formData.objectType === PerformanceConfigObjectTypeEnum.DEPT"
          v-model="formData.objectId"
          :data="deptList"
          :props="treeProps"
          check-strictly
          class="!w-full"
          node-key="id"
          placeholder="请选择部门"
        />
        <ElSelect
          v-else
          v-model="formData.objectId"
          class="!w-full"
          filterable
          placeholder="请选择员工"
        >
          <ElOption
            v-for="user in userList"
            :key="user.id"
            :label="user.nickname"
            :value="user.id"
          />
        </ElSelect>
      </ElFormItem>
      <ElDivider />
      <ElRow :gutter="16">
        <ElCol v-for="item in monthFields" :key="item.prop" :span="6">
          <ElFormItem :label="item.label" :prop="item.prop">
            <ElInputNumber
              v-model="formData[item.prop]"
              :min="0"
              :precision="2"
              :step="1000"
              class="!w-full"
              controls-position="right"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElFormItem label="年度目标">
        <ElInput :model-value="yearTargetPriceText" disabled />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
