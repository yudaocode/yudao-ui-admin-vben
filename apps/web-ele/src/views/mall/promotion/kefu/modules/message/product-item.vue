<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { fenToYuan } from '@vben/utils';

import { ElButton, ElImage } from 'element-plus';

defineProps({
  spuId: {
    type: Number,
    default: 0,
  },
  picUrl: {
    type: String,
    default: 'https://img1.baidu.com/it/u=1601695551,235775011&fm=26&fmt=auto',
  },
  title: {
    type: String,
    default: '',
  },
  price: {
    type: [String, Number],
    default: '',
  },
  salesCount: {
    type: [String, Number],
    default: '',
  },
  stock: {
    type: [String, Number],
    default: '',
  },
});

const { push } = useRouter();

/** 查看商品详情 */
function openDetail(spuId: number) {
  push({ name: 'ProductSpuDetail', params: { id: spuId } });
}
</script>

<template>
  <div
    class="mb-[10px] flex w-full cursor-pointer items-center rounded-lg bg-gray-500/30 p-[10px]"
    @click.stop="openDetail(spuId)"
  >
    <!-- 左侧商品图片-->
    <div class="mr-6 w-[70px]">
      <ElImage
        :initial-index="0"
        :preview-src-list="[picUrl]"
        :src="picUrl"
        class="h-full w-full rounded-lg"
        fit="contain"
        preview-teleported
        @click.stop
      />
    </div>
    <!-- 右侧商品信息 -->
    <div class="flex-1">
      <div class="line-clamp-1 w-full text-base font-bold">{{ title }}</div>
      <div class="my-1">
        <span class="mr-5">库存: {{ stock || 0 }}</span>
        <span>销量: {{ salesCount || 0 }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-[#ff3000]">￥{{ fenToYuan(price) }}</span>
        <ElButton size="small" text type="primary">详情</ElButton>
      </div>
    </div>
  </div>
</template>
