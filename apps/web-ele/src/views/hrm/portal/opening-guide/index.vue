<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import { ElButton, ElCard, ElResult, ElStep, ElSteps } from 'element-plus';

import { redirectBoundEmployeeFromOpeningGuide } from '#/views/hrm/utils/employee';

defineOptions({ name: 'HrmPortalOpeningGuide' });

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const visible = ref(false);

const canCreateEmployee = hasAccessByCodes(['hrm:employee:create']);
const description = canCreateEmployee
  ? '请先在员工管理中创建员工档案，并将绑定用户设置为当前后台账号。'
  : '请联系公司管理员在员工管理中创建员工档案，并绑定当前后台账号。';

/** 前往员工档案列表 */
function goEmployee() {
  router.push({ name: 'HrmEmployee' });
}

/** 返回首页 */
function goHome() {
  router.push('/');
}

/** 初始化 */
onMounted(async () => {
  visible.value = !(await redirectBoundEmployeeFromOpeningGuide(router));
});
</script>

<template>
  <Page v-if="visible">
    <ElCard class="min-h-[calc(100vh-130px)]" shadow="never">
      <ElResult
        icon="warning"
        :sub-title="description"
        title="当前账号尚未开通员工端"
      >
        <template #extra>
          <ElButton v-if="canCreateEmployee" type="primary" @click="goEmployee">
            前往员工档案
          </ElButton>
          <ElButton @click="goHome">返回首页</ElButton>
        </template>
      </ElResult>

      <div
        v-if="canCreateEmployee"
        class="mx-auto mb-12 w-full max-w-[760px] rounded border px-8 py-7"
      >
        <div class="mb-7 text-center text-base font-semibold">
          完成员工端开通
        </div>
        <ElSteps :active="0" direction="vertical">
          <ElStep
            description="前往员工管理的员工档案列表"
            title="进入员工档案"
          />
          <ElStep
            description="新增员工时绑定当前后台账号"
            title="新增并绑定账号"
          />
          <ElStep
            description="完善必填信息并保存后即可进入员工端"
            title="保存员工档案"
          />
        </ElSteps>
      </div>
    </ElCard>
  </Page>
</template>
