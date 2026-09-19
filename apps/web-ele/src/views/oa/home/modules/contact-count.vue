<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { IconifyIcon } from '@vben/icons';

import { getMyContactPage } from '#/api/oa/contact';

defineOptions({ name: 'OaHomeContactCount' });

const { push } = useRouter();
const loading = ref(false); // 区块加载中
const loadError = ref(false); // 区块加载失败
const count = ref(0); // 通讯录数量

/** 查询当前区块数据 */
async function getList() {
  if (loading.value) return;
  loading.value = true;
  loadError.value = false;
  try {
    count.value = (await getMyContactPage({ pageNo: 1, pageSize: 1 })).total;
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getList();
});
</script>

<template>
  <div
    v-loading="loading"
    class="relative flex min-h-[116px] cursor-pointer items-center gap-4 overflow-hidden rounded-lg bg-[linear-gradient(135deg,#67c23a,#85ce61)] p-5 text-white shadow-md transition-transform duration-200 hover:-translate-y-0.5"
    @click="push('/oa/contact')"
  >
    <!-- 数据区与图标区分开，窄屏时优先保留数据 -->
    <div class="min-w-0 flex-1">
      <div class="mb-1 text-sm opacity-90">我的联系人</div>
      <div
        v-if="loadError"
        class="mt-1 truncate text-xs opacity-85"
        @click.stop="getList"
      >
        加载失败，点击重试
      </div>
      <div v-else class="truncate text-[28px] font-semibold">{{ count }}</div>
      <div class="mt-1 truncate text-xs opacity-85">本人持有的联系人</div>
    </div>
    <div
      class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20"
    >
      <IconifyIcon icon="ep:postcard" class="text-[30px]" />
    </div>
  </div>
</template>
