<script lang="ts" setup>
import type { HrmInsuranceMonthEmployeeRecordApi } from '#/api/hrm/insurance/month-record/employee';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { Button } from 'ant-design-vue';

import { getInsuranceMonthEmployeeRecord } from '#/api/hrm/insurance/month-record/employee';
import { DictTag } from '#/components/dict-tag';
import { formatHrmDate } from '#/views/hrm/utils/format';

import ProjectGrid from './project-grid.vue';

defineOptions({ name: 'HrmInsuranceMonthEmployeeDetail' });

const props = defineProps<{ editable?: boolean }>();
const emit = defineEmits<{
  edit: [
    detail: HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord,
  ];
}>();

const detail =
  ref<HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord>();
const projects = computed(() => [
  ...(detail.value?.socialSecurityProjectList || []),
  ...(detail.value?.providentFundProjectList || []),
]);

const [Drawer, drawerApi] = useVbenDrawer({
  footer: false,
  async onOpenChange(isOpen) {
    if (!isOpen) {
      detail.value = undefined;
      return;
    }
    const id = drawerApi.getData() as number | undefined;
    if (!id) {
      await drawerApi.close();
      return;
    }
    drawerApi.lock();
    try {
      detail.value = await getInsuranceMonthEmployeeRecord(id);
    } finally {
      drawerApi.unlock();
    }
  },
});

function handleEdit() {
  if (detail.value) emit('edit', detail.value);
}
</script>

<template>
  <Drawer class="w-[980px]" title="员工月度社保详情">
    <div class="min-h-80">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="truncate text-xl font-semibold">
              {{ detail?.employeeName || '--' }}
            </span>
            <DictTag
              :type="DICT_TYPE.HRM_INSURANCE_EMP_STATUS"
              :value="detail?.status ?? ''"
            />
          </div>
          <div class="text-muted-foreground mt-1 text-sm">
            {{ detail?.postName || '--' }} · {{ detail?.year || '--' }} 年
            {{ detail?.month || '--' }} 月
          </div>
        </div>
        <Button
          v-if="props.editable && detail"
          v-access:code="['hrm:insurance:month-record:update']"
          type="primary"
          @click="handleEdit"
        >
          编辑
        </Button>
      </div>

      <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <span class="text-muted-foreground">性别：</span>
          <DictTag
            v-if="detail?.sex != null"
            :type="DICT_TYPE.SYSTEM_USER_SEX"
            :value="detail.sex"
          />
          <span v-else>--</span>
        </div>
        <div>
          <span class="text-muted-foreground">年龄：</span>
          <span>{{ detail?.age ?? '--' }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">工号：</span>
          <span>{{ detail?.jobNumber || '--' }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">部门：</span>
          <span>{{ detail?.deptName || '--' }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">员工状态：</span>
          <DictTag
            v-if="detail?.employeeStatus != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
            :value="detail.employeeStatus"
          />
          <span v-else>--</span>
        </div>
        <div>
          <span class="text-muted-foreground">入职日期：</span>
          <span>{{ formatHrmDate(detail?.entryTime) }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">参保城市：</span>
          <span>{{ detail?.areaName || '--' }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">身份证号：</span>
          <span>{{ detail?.idNumber || '--' }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">个人社保号：</span>
          <span>{{ detail?.socialSecurityNumber || '--' }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">个人公积金号：</span>
          <span>{{ detail?.accumulationFundNumber || '--' }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">参保方案：</span>
          <span>{{ detail?.schemeName || '--' }}</span>
        </div>
      </div>

      <div class="mb-2 text-base font-semibold">缴费项目</div>
      <ProjectGrid
        mode="detail"
        :rows="projects"
        :scheme-type="detail?.schemeType"
      />
    </div>
  </Drawer>
</template>
