<script lang="ts" setup>
import { ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { ElButton, ElTabPane, ElTabs } from 'element-plus';

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
    <div class="relative">
      <ElTabs v-model="activeTab">
        <ElTabPane label="新建员工字段设置" name="create">
          <CreateFieldConfig ref="createFieldConfigRef" />
        </ElTabPane>
        <ElTabPane label="员工档案设置" name="archive">
          <ArchiveFieldConfig ref="archiveFieldConfigRef" />
        </ElTabPane>
      </ElTabs>
      <!-- ElButton 自带 position:relative，需包一层定位到 Tab 右上角 -->
      <div class="absolute right-0 top-0 z-10">
        <ElButton
          v-access:code="['hrm:employee:config:update']"
          :loading="saving"
          type="primary"
          @click="submitForm"
        >
          保存
        </ElButton>
      </div>
    </div>
  </Page>
</template>
