<script lang="ts" setup>
import type { MallRewardActivityApi } from '#/api/mall/promotion/reward/rewardActivity';

import { nextTick, onMounted, ref } from 'vue';

import { useVModel } from '@vueuse/core';
import { Button, Input } from 'ant-design-vue';

// import { CouponSelect } from '@/views/mall/promotion/coupon/components'; // TODO: 根据实际路径调整
// import * as CouponTemplateApi from '#/api/mall/promotion/coupon/couponTemplate'; // TODO: API
// import { discountFormat } from '@/views/mall/promotion/coupon/formatter'; // TODO: 根据实际路径调整

// TODO @puhui999：这里报错了。
defineOptions({ name: 'RewardRuleCouponSelect' });

const props = defineProps<{
  modelValue: MallRewardActivityApi.RewardRule;
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', v: any): void;
}>();

const rewardRule = useVModel(props, 'modelValue', emits);
const list = ref<any[]>([]); // TODO: 改为 GiveCouponVO[] 类型

const CouponTemplateTakeTypeEnum = {
  ADMIN: { type: 2 },
};

/** 选择优惠券 */
// const couponSelectRef = ref<InstanceType<typeof CouponSelect>>();
function selectCoupon() {
  // couponSelectRef.value?.open();
}

/** 选择优惠券后的回调 */
function handleCouponChange(val: any[]) {
  for (const item of val) {
    if (list.value.some((v) => v.id === item.id)) {
      continue;
    }
    list.value.push(item);
  }
}

/** 删除优惠券 */
function deleteCoupon(index: number) {
  list.value.splice(index, 1);
}

/** 初始化赠送的优惠券列表 */
async function initGiveCouponList() {
  // if (!rewardRule.value || !rewardRule.value.giveCouponTemplateCounts) {
  //   return;
  // }
  // const tempLateIds = Object.keys(rewardRule.value.giveCouponTemplateCounts);
  // const data = await CouponTemplateApi.getCouponTemplateList(tempLateIds);
  // if (!data) {
  //   return;
  // }
  // data.forEach((coupon) => {
  //   list.value.push({
  //     ...coupon,
  //     giveCount: rewardRule.value.giveCouponTemplateCounts![coupon.id],
  //   });
  // });
}

/** 设置赠送的优惠券 */
function setGiveCouponList() {
  if (!rewardRule.value) {
    return;
  }
  rewardRule.value.giveCouponTemplateCounts = {};
  list.value.forEach((rule) => {
    rewardRule.value.giveCouponTemplateCounts![rule.id] = rule.giveCount!;
  });
}

defineExpose({ setGiveCouponList });

onMounted(async () => {
  await nextTick();
  await initGiveCouponList();
});
</script>

<template>
  <div class="w-full">
    <Button type="link" class="ml-2" @click="selectCoupon">添加优惠劵</Button>

    <div
      v-for="(item, index) in list"
      :key="item.id"
      class="coupon-list-item mb-2 flex justify-between rounded-lg border border-dashed border-gray-300 p-2"
    >
      <div class="coupon-list-item-left flex flex-wrap items-center gap-2">
        <div>优惠券名称：{{ item.name }}</div>
        <div>
          范围：
          <!-- <DictTag :type="DICT_TYPE.PROMOTION_PRODUCT_SCOPE" :value="item.productScope" /> -->
          {{ item.productScope }}
        </div>
        <div class="flex items-center">
          优惠：
          <!-- <DictTag :type="DICT_TYPE.PROMOTION_DISCOUNT_TYPE" :value="item.discountType" /> -->
          <!-- {{ discountFormat(item) }} -->
          {{ item.discountType }}
        </div>
      </div>
      <div class="coupon-list-item-right flex items-center gap-2">
        <span>送</span>
        <Input
          v-model:value="item.giveCount"
          class="!w-150px"
          placeholder=""
          type="number"
        />
        <span>张</span>
        <Button type="link" danger @click="deleteCoupon(index)">删除</Button>
      </div>
    </div>

    <!-- 优惠券选择 -->
    <!-- <CouponSelect
      ref="couponSelectRef"
      :take-type="CouponTemplateTakeTypeEnum.ADMIN.type"
      @change="handleCouponChange"
    /> -->
  </div>
</template>
