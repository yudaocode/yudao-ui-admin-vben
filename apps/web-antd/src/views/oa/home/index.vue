<script lang="ts" setup>
import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import { Col, Row } from 'ant-design-vue';

import OaHomeAnnouncement from './modules/announcement.vue';
import OaHomeAttendance from './modules/attendance.vue';
import OaHomeCalendar from './modules/calendar.vue';
import OaHomeContactCount from './modules/contact-count.vue';
import OaHomeDiscussionCount from './modules/discussion-count.vue';
import OaHomeNote from './modules/note.vue';
import OaHomePlan from './modules/plan.vue';
import OaHomeTaskCount from './modules/task-count.vue';
import OaHomeTaskStatistics from './modules/task-statistics.vue';

defineOptions({ name: 'OaHome' });

const { hasAccessByCodes } = useAccess();
</script>

<template>
  <Page>
    <!-- 各区块独立请求，首页仅负责布局 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <OaHomeAttendance />
      <OaHomeContactCount v-if="hasAccessByCodes(['oa:contact:query'])" />
      <OaHomeDiscussionCount
        v-if="hasAccessByCodes(['oa:discussion:query'])"
      />
      <OaHomeTaskCount />
    </div>
    <Row :gutter="16" class="mt-4">
      <Col :lg="16" :md="24">
        <div class="flex flex-col gap-4">
          <OaHomeAnnouncement
            v-if="hasAccessByCodes(['oa:announcement:query'])"
          />
          <OaHomePlan v-if="hasAccessByCodes(['oa:plan:query'])" />
        </div>
      </Col>
      <Col :lg="8" :md="24" class="max-lg:mt-4">
        <div class="flex flex-col gap-4">
          <OaHomeTaskStatistics />
          <OaHomeCalendar v-if="hasAccessByCodes(['oa:schedule:query'])" />
          <OaHomeNote v-if="hasAccessByCodes(['oa:note:query'])" />
        </div>
      </Col>
    </Row>
  </Page>
</template>
