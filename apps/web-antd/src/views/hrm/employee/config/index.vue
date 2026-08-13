<script lang="ts" setup>
import { ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { Button, Tabs } from 'ant-design-vue';

import ArchiveFieldConfig from './modules/archive-field-config.vue';
import CreateFieldConfig from './modules/create-field-config.vue';

defineOptions({ name: 'HrmEmployeeConfig' });

const activeTab = ref('create');
const saving = ref(false);
const createFieldConfigRef = ref<InstanceType<typeof CreateFieldConfig>>();
const archiveFieldConfigRef = ref<InstanceType<typeof ArchiveFieldConfig>>();

async function submitForm() {
  saving.value = true;
  try {
    if (activeTab.value === 'create') {
      await createFieldConfigRef.value?.submitForm();
      return;
    }
    await archiveFieldConfigRef.value?.submitForm();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【员工】员工管理"
        url="https://doc.iocoder.cn/hrm/employee/"
      />
    </template>
    <Tabs v-model:active-key="activeTab" :destroy-inactive-tab-pane="false">
      <template #tabBarExtraContent>
        <Button
          v-access:code="['hrm:employee:config:update']"
          :loading="saving"
          type="primary"
          @click="submitForm"
        >
          保存
        </Button>
      </template>
      <Tabs.TabPane key="create" tab="新建员工字段设置" force-render>
        <CreateFieldConfig ref="createFieldConfigRef" />
      </Tabs.TabPane>
      <Tabs.TabPane key="archive" tab="员工档案设置" force-render>
        <ArchiveFieldConfig ref="archiveFieldConfigRef" />
      </Tabs.TabPane>
    </Tabs>
  </Page>
</template>
