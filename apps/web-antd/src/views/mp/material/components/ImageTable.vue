<script lang="ts" setup>
import { useAccess } from '@vben/access';
import { IconifyIcon } from '@vben/icons';

import { Spin } from 'ant-design-vue';

const props = defineProps<{
  list: any[];
  loading: boolean;
}>();

const emit = defineEmits<{
  delete: [v: number];
}>();

const { hasAccessByCodes } = useAccess();
</script>

<template>
  <Spin :spinning="props.loading">
    <div class="waterfall">
      <div v-for="item in props.list" :key="item.id" class="waterfall-item">
        <a :href="item.url" target="_blank">
          <img :src="item.url" class="material-img" />
          <div class="item-name">{{ item.name }}</div>
        </a>
        <div class="flex justify-center">
          <a-button
            v-if="hasAccessByCodes(['mp:material:delete'])"
            danger
            shape="circle"
            type="primary"
            @click="emit('delete', item.id)"
          >
            <template #icon>
              <IconifyIcon icon="mdi:delete" />
            </template>
          </a-button>
        </div>
      </div>
    </div>
  </Spin>
</template>

<style lang="scss" scoped>
@media (width >= 992px) and (width <= 1300px) {
  .waterfall {
    column-count: 3;
  }
}

@media (width >= 768px) and (width <= 991px) {
  .waterfall {
    column-count: 2;
  }
}

@media (width <= 767px) {
  .waterfall {
    column-count: 1;
  }
}

.waterfall {
  column-gap: 10px;
  width: 100%;
  margin-top: 10px;
  column-count: 5;
}

.waterfall-item {
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #eaeaea;
  break-inside: avoid;
}

.material-img {
  width: 100%;
}

.item-name {
  line-height: 30px;
}
</style>
