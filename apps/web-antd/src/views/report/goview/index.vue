<script lang="ts" setup>
import { ref } from 'vue';

import { DocAlert, IFrame, Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

defineOptions({ name: 'GoView' });

const accessStore = useAccessStore();

const src = ref(
  `${import.meta.env.VITE_GOVIEW_URL}?accessToken=${accessStore.accessToken}&refreshToken=${accessStore.refreshToken}`,
);
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="GoView 大屏"
        url="https://doc.iocoder.cn/report/screen/"
      />
    </template>

    <IFrame :src="src" />
  </Page>
</template>
