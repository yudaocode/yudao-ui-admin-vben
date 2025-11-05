<script setup lang="ts">
import type { CouponCardProperty } from './config';

import type { MallCouponTemplateApi } from '#/api/mall/promotion/coupon/couponTemplate';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import {
  CouponTemplateTakeTypeEnum,
  PromotionDiscountTypeEnum,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { floatToFixed2 } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import {
  Button,
  Card,
  Form,
  FormItem,
  RadioButton,
  RadioGroup,
  Slider,
  Tooltip,
  Typography,
} from 'ant-design-vue';

import * as CouponTemplateApi from '#/api/mall/promotion/coupon/couponTemplate';
import UploadImg from '#/components/upload/image-upload.vue';
import { ColorInput } from '#/views/mall/promotion/components';
import CouponSelect from '#/views/mall/promotion/coupon/components/select.vue';

import ComponentContainerProperty from '../../component-container-property.vue';

/** 优惠券卡片属性面板 */
defineOptions({ name: 'CouponCardProperty' });

const props = defineProps<{ modelValue: CouponCardProperty }>();

const emit = defineEmits(['update:modelValue']);

const { Text: ATypographyText } = Typography;

const formData = useVModel(props, 'modelValue', emit);

const couponList = ref<MallCouponTemplateApi.CouponTemplate[]>([]); // 已选择的优惠券列表

const [CouponSelectModal, couponSelectModalApi] = useVbenModal({
  connectedComponent: CouponSelect,
  destroyOnClose: true,
});

/** 添加优惠劵 */
const handleAddCoupon = () => {
  couponSelectModalApi.open();
};

/** 处理优惠劵选择 */
const handleCouponSelect = (
  selectedCoupons: MallCouponTemplateApi.CouponTemplate[],
) => {
  couponList.value = selectedCoupons;
  formData.value.couponIds = selectedCoupons.map((coupon) => coupon.id);
};

/** 监听优惠券 ID 变化，加载优惠券列表 */
watch(
  () => formData.value.couponIds,
  async () => {
    if (formData.value.couponIds?.length > 0) {
      couponList.value = await CouponTemplateApi.getCouponTemplateList(
        formData.value.couponIds,
      );
    }
  },
  {
    immediate: true,
    deep: true,
  },
);
</script>

<template>
  <ComponentContainerProperty v-model="formData.style">
    <Form :model="formData">
      <Card title="优惠券列表" class="property-group">
        <div
          v-for="(coupon, index) in couponList"
          :key="index"
          class="flex items-center justify-between"
        >
          <ATypographyText ellipsis class="text-base">
            {{ coupon.name }}
          </ATypographyText>
          <ATypographyText type="secondary" ellipsis>
            <span v-if="coupon.usePrice > 0">
              满{{ floatToFixed2(coupon.usePrice) }}元，
            </span>
            <span
              v-if="
                coupon.discountType === PromotionDiscountTypeEnum.PRICE.type
              "
            >
              减{{ floatToFixed2(coupon.discountPrice) }}元
            </span>
            <span v-else> 打{{ coupon.discountPercent }}折 </span>
          </ATypographyText>
        </div>
        <FormItem>
          <Button
            @click="handleAddCoupon"
            type="primary"
            ghost
            class="mt-2 w-full"
          >
            <template #icon>
              <IconifyIcon icon="ep:plus" />
            </template>
            添加
          </Button>
        </FormItem>
      </Card>
      <Card title="优惠券样式" class="property-group">
        <FormItem label="列数" name="type">
          <RadioGroup v-model:value="formData.columns">
            <Tooltip title="一列" placement="bottom">
              <RadioButton :value="1">
                <IconifyIcon icon="fluent:text-column-one-24-filled" />
              </RadioButton>
            </Tooltip>
            <Tooltip title="二列" placement="bottom">
              <RadioButton :value="2">
                <IconifyIcon icon="fluent:text-column-two-24-filled" />
              </RadioButton>
            </Tooltip>
            <Tooltip title="三列" placement="bottom">
              <RadioButton :value="3">
                <IconifyIcon icon="fluent:text-column-three-24-filled" />
              </RadioButton>
            </Tooltip>
          </RadioGroup>
        </FormItem>
        <FormItem label="背景图片" name="bgImg">
          <UploadImg
            v-model="formData.bgImg"
            height="80px"
            width="100%"
            class="min-w-[160px]"
            :show-description="false"
          />
        </FormItem>
        <FormItem label="文字颜色" name="textColor">
          <ColorInput v-model="formData.textColor" />
        </FormItem>
        <FormItem label="按钮背景" name="button.bgColor">
          <ColorInput v-model="formData.button.bgColor" />
        </FormItem>
        <FormItem label="按钮文字" name="button.color">
          <ColorInput v-model="formData.button.color" />
        </FormItem>
        <FormItem label="间隔" name="space">
          <Slider v-model:value="formData.space" :max="100" :min="0" />
        </FormItem>
      </Card>
    </Form>
  </ComponentContainerProperty>

  <!-- 优惠券选择 -->
  <CouponSelectModal
    :take-type="CouponTemplateTakeTypeEnum.USER.type"
    @success="handleCouponSelect"
  />
</template>
