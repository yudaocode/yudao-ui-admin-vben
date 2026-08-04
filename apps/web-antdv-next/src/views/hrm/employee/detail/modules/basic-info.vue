<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { Card } from 'antdv-next';

import CertificateList from './certificate-list.vue';
import ContactList from './contact-list.vue';
import DetailsInfo from './details-info.vue';
import EducationList from './education-list.vue';
import TrainingList from './training-list.vue';
import WorkList from './work-list.vue';

defineProps<{ employee: HrmEmployeeApi.Employee; employeeId: number }>();
</script>
<template>
  <Card :style="{ marginBottom: '15px' }">
    <DetailsInfo :employee="employee" />
  </Card>
  <Card title="教育经历" :style="{ marginBottom: '15px' }">
    <EducationList :employee-id="employeeId" />
  </Card>
  <Card title="工作经历" :style="{ marginBottom: '15px' }">
    <WorkList :employee-id="employeeId" />
  </Card>
  <Card title="证书/证件" :style="{ marginBottom: '15px' }">
    <CertificateList :employee-id="employeeId" />
  </Card>
  <Card title="培训经历" :style="{ marginBottom: '15px' }">
    <TrainingList :employee-id="employeeId" />
  </Card>
  <Card title="联系人" :style="{ marginBottom: '15px' }">
    <ContactList :employee-id="employeeId" />
  </Card>
</template>
