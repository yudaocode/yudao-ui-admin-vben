<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { DocAlert } from '#/components/doc-alert';
import { IFrame } from '#/components/iframe';

defineOptions({ name: 'GoView' });

const src = ref(import.meta.env.VITE_GOVIEW_URL);
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="大屏设计器"
        url="https://doc.iocoder.cn/report/screen/"
      />
    </template>

    <IFrame :src="src" />
  </Page>
</template>
