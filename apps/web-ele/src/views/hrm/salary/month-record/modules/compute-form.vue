<script lang="ts" setup>
import type { UploadUserFile } from 'element-plus';

import type { HrmSalaryMonthRecordApi } from '#/api/hrm/salary/month-record';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElMessage, ElSwitch, ElUpload } from 'element-plus';

import {
  computeSalaryMonthRecordWithImport,
  getSalaryAdditionalDeductionImportTemplate,
  getSalaryAttendanceImportTemplate,
  getSalaryCumulativeTaxImportTemplate,
  getSalaryPayrollReadiness,
} from '#/api/hrm/salary/month-record';

defineOptions({ name: 'HrmSalaryMonthComputeForm' });

const emit = defineEmits(['success']);

const formLoading = ref(false);
const currentRecord = ref<HrmSalaryMonthRecordApi.SalaryMonthRecord>();
const payrollEmployeeCount = ref(0);
const syncInsuranceData = ref(true);
const syncAttendanceData = ref(false);
const attendanceFiles = ref<UploadUserFile[]>([]);
const cumulativeTaxFiles = ref<UploadUserFile[]>([]);
const additionalDeductionFiles = ref<UploadUserFile[]>([]);

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!currentRecord.value?.id) {
      return;
    }
    modalApi.lock();
    formLoading.value = true;
    try {
      const formData = new FormData();
      formData.append('id', String(currentRecord.value.id));
      formData.append('syncInsuranceData', String(syncInsuranceData.value));
      formData.append('syncAttendanceData', String(syncAttendanceData.value));
      appendFile(formData, 'attendanceFile', attendanceFiles.value);
      appendFile(formData, 'cumulativeTaxFile', cumulativeTaxFiles.value);
      appendFile(
        formData,
        'additionalDeductionFile',
        additionalDeductionFiles.value,
      );
      await computeSalaryMonthRecordWithImport(formData);
      ElMessage.success('核算成功');
      await modalApi.close();
      emit('success');
    } finally {
      formLoading.value = false;
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      currentRecord.value = undefined;
      payrollEmployeeCount.value = 0;
      syncInsuranceData.value = true;
      syncAttendanceData.value = false;
      attendanceFiles.value = [];
      cumulativeTaxFiles.value = [];
      additionalDeductionFiles.value = [];
    }
  },
  title: '核算工资表',
});

function appendFile(
  formData: FormData,
  field: string,
  files: UploadUserFile[],
) {
  const raw = files[0]?.raw;
  if (raw) {
    formData.append(field, raw);
  }
}

async function getPayrollEmployeeCount() {
  const readiness = await getSalaryPayrollReadiness(currentRecord.value?.id);
  payrollEmployeeCount.value = readiness.payrollEmployeeCount || 0;
}

async function downloadTemplate(
  type: 'additionalDeduction' | 'attendance' | 'cumulativeTax',
) {
  const monthRecordId = currentRecord.value?.id;
  if (type === 'attendance') {
    const data = await getSalaryAttendanceImportTemplate(monthRecordId);
    downloadFileFromBlobPart({
      fileName: '月度工资考勤导入模板.xls',
      source: data,
    });
    return;
  }
  if (type === 'cumulativeTax') {
    const data = await getSalaryCumulativeTaxImportTemplate(monthRecordId);
    downloadFileFromBlobPart({
      fileName: '月度工资上月个税累计导入模板.xls',
      source: data,
    });
    return;
  }
  const data = await getSalaryAdditionalDeductionImportTemplate(monthRecordId);
  downloadFileFromBlobPart({
    fileName: '月度工资专项附加扣除导入模板.xls',
    source: data,
  });
}

function open(record: HrmSalaryMonthRecordApi.SalaryMonthRecord) {
  currentRecord.value = record;
  payrollEmployeeCount.value = record.employeeCount || 0;
  attendanceFiles.value = [];
  cumulativeTaxFiles.value = [];
  additionalDeductionFiles.value = [];
  syncInsuranceData.value = true;
  syncAttendanceData.value = false;
  modalApi.open();
  getPayrollEmployeeCount();
}

defineExpose({ open });
</script>

<template>
  <Modal v-loading="formLoading" class="w-[760px]">
    <div class="space-y-4">
      <div class="grid grid-cols-[112px_1fr] items-center gap-y-4">
        <span class="text-right text-muted-foreground">工资表</span>
        <span>{{ currentRecord?.title || '-' }}</span>
        <span class="text-right text-muted-foreground">计薪人员</span>
        <span>{{ payrollEmployeeCount }} 人</span>
        <span class="text-right text-muted-foreground">社保数据</span>
        <ElSwitch
          v-model="syncInsuranceData"
          active-text="从社保表同步"
          inactive-text="本次不带入"
        />
        <span class="text-right text-muted-foreground">同步考勤</span>
        <ElSwitch
          v-model="syncAttendanceData"
          active-text="从考勤统计同步"
          inactive-text="使用导入文件"
        />
        <span class="text-right text-muted-foreground">考勤数据</span>
        <div class="flex flex-wrap items-start gap-2">
          <ElUpload
            v-model:file-list="attendanceFiles"
            :auto-upload="false"
            :disabled="syncAttendanceData"
            :limit="1"
            accept=".xls,.xlsx"
          >
            <ElButton :disabled="syncAttendanceData">选择文件</ElButton>
          </ElUpload>
          <ElButton @click="downloadTemplate('attendance')">下载模板</ElButton>
        </div>
        <span class="text-right text-muted-foreground">上月个税累计</span>
        <div class="flex flex-wrap items-start gap-2">
          <ElUpload
            v-model:file-list="cumulativeTaxFiles"
            :auto-upload="false"
            :limit="1"
            accept=".xls,.xlsx"
          >
            <ElButton>选择文件</ElButton>
          </ElUpload>
          <ElButton @click="downloadTemplate('cumulativeTax')">
            下载模板
          </ElButton>
        </div>
        <span class="text-right text-muted-foreground">专项附加扣除</span>
        <div class="flex flex-wrap items-start gap-2">
          <ElUpload
            v-model:file-list="additionalDeductionFiles"
            :auto-upload="false"
            :limit="1"
            accept=".xls,.xlsx"
          >
            <ElButton>选择文件</ElButton>
          </ElUpload>
          <ElButton @click="downloadTemplate('additionalDeduction')">
            下载模板
          </ElButton>
        </div>
      </div>
    </div>
  </Modal>
</template>
