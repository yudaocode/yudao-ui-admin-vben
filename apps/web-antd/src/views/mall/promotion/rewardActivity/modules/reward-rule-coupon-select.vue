<script lang="ts" setup>
import type { MallCouponTemplateApi } from '#/api/mall/promotion/coupon/couponTemplate';
import type { MallRewardActivityApi } from '#/api/mall/promotion/reward/rewardActivity';

import { nextTick, onMounted, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { useVModel } from '@vueuse/core';
import { Button, Input } from 'ant-design-vue';

import { getCouponTemplateList } from '#/api/mall/promotion/coupon/couponTemplate';
import { DictTag } from '#/components/dict-tag';
import { CouponSelect } from '#/views/mall/promotion/coupon/components';
import { discountFormat } from '#/views/mall/promotion/coupon/formatter';

defineOptions({ name: 'RewardRuleCouponSelect' });

const props = defineProps<{
  modelValue: MallRewardActivityApi.RewardRule;
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', v: any): void;
}>();

/** 选择赠送的优惠类型拓展 */
interface GiveCoupon extends MallCouponTemplateApi.CouponTemplate {
  giveCount?: number;
}

const rewardRule = useVModel(props, 'modelValue', emits);
const list = ref<GiveCoupon[]>([]);

const CouponTemplateTakeTypeEnum = {
  ADMIN: { type: 2 },
};

/** 选择优惠券 */
const couponSelectRef = ref<InstanceType<typeof CouponSelect>>();
function selectCoupon() {
  couponSelectRef.value?.open();
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
  if (!rewardRule.value || !rewardRule.value.giveCouponTemplateCounts) {
    return;
  }
  const tempLateIds = Object.keys(
    rewardRule.value.giveCouponTemplateCounts,
  ) as unknown as number[];
  const data = await getCouponTemplateList(tempLateIds);
  if (!data) {
    return;
  }
  data.forEach((coupon) => {
    list.value.push({
      ...coupon,
      giveCount: rewardRule.value.giveCouponTemplateCounts![coupon.id],
    });
  });
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
          <DictTag
            :type="DICT_TYPE.PROMOTION_PRODUCT_SCOPE"
            :value="item.productScope"
          />
        </div>
        <div class="flex items-center">
          优惠：
          <DictTag
            :type="DICT_TYPE.PROMOTION_DISCOUNT_TYPE"
            :value="item.discountType"
          />
          {{ discountFormat(item) }}
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
    <CouponSelect
      ref="couponSelectRef"
      :take-type="CouponTemplateTakeTypeEnum.ADMIN.type"
      @change="handleCouponChange"
    />
  </div>
</template>
