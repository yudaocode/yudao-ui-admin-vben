<script setup lang="ts">
import type { PromotionCombinationProperty } from './config';

import type { MallCombinationActivityApi } from '#/api/mall/promotion/combination/combinationActivity';

import { onMounted, ref } from 'vue';

import { CommonStatusEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { useVModel } from '@vueuse/core';
import {
  Card,
  Checkbox,
  Form,
  FormItem,
  Input,
  RadioButton,
  RadioGroup,
  Slider,
  Switch,
  Tooltip,
} from 'ant-design-vue';

import { getCombinationActivityPage } from '#/api/mall/promotion/combination/combinationActivity';
import UploadImg from '#/components/upload/image-upload.vue';
// import CombinationShowcase from '#/views/mall/promotion/combination/components/combination-showcase.vue';
import { ColorInput } from '#/views/mall/promotion/components';

// 拼团属性面板
defineOptions({ name: 'PromotionCombinationProperty' });

const props = defineProps<{ modelValue: PromotionCombinationProperty }>();
const emit = defineEmits(['update:modelValue']);
const formData = useVModel(props, 'modelValue', emit);
// 活动列表
const activityList = ref<MallCombinationActivityApi.CombinationActivity[]>([]);
onMounted(async () => {
  const { list } = await getCombinationActivityPage({
    pageNo: 1,
    pageSize: 10,
    status: CommonStatusEnum.ENABLE,
  });
  activityList.value = list;
});
</script>

<template>
  <ComponentContainerProperty v-model="formData.style">
    <Form
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      :model="formData"
    >
      <Card title="拼团活动" class="property-group" :bordered="false">
        <CombinationShowcase v-model="formData.activityIds" />
      </Card>
      <Card title="商品样式" class="property-group" :bordered="false">
        <FormItem label="布局" prop="type">
          <RadioGroup v-model:value="formData.layoutType">
            <Tooltip title="单列大图" placement="bottom">
              <RadioButton value="oneColBigImg">
                <IconifyIcon
                  icon="fluent:text-column-one-24-filled"
                  class="size-6"
                />
              </RadioButton>
            </Tooltip>
            <Tooltip title="单列小图" placement="bottom">
              <RadioButton value="oneColSmallImg">
                <IconifyIcon
                  icon="fluent:text-column-two-left-24-filled"
                  class="size-6"
                />
              </RadioButton>
            </Tooltip>
            <Tooltip title="双列" placement="bottom">
              <RadioButton value="twoCol">
                <IconifyIcon
                  icon="fluent:text-column-two-24-filled"
                  class="size-6"
                />
              </RadioButton>
            </Tooltip>
          </RadioGroup>
        </FormItem>
        <FormItem label="商品名称" prop="fields.name.show">
          <div class="flex gap-2">
            <ColorInput v-model="formData.fields.name.color" />
            <Checkbox v-model:checked="formData.fields.name.show" />
          </div>
        </FormItem>
        <FormItem label="商品简介" prop="fields.introduction.show">
          <div class="flex gap-2">
            <ColorInput v-model="formData.fields.introduction.color" />
            <Checkbox v-model:checked="formData.fields.introduction.show" />
          </div>
        </FormItem>
        <FormItem label="商品价格" prop="fields.price.show">
          <div class="flex gap-2">
            <ColorInput v-model="formData.fields.price.color" />
            <Checkbox v-model:checked="formData.fields.price.show" />
          </div>
        </FormItem>
        <FormItem label="市场价" prop="fields.marketPrice.show">
          <div class="flex gap-2">
            <ColorInput v-model="formData.fields.marketPrice.color" />
            <Checkbox v-model:checked="formData.fields.marketPrice.show" />
          </div>
        </FormItem>
        <FormItem label="商品销量" prop="fields.salesCount.show">
          <div class="flex gap-2">
            <ColorInput v-model="formData.fields.salesCount.color" />
            <Checkbox v-model:checked="formData.fields.salesCount.show" />
          </div>
        </FormItem>
        <FormItem label="商品库存" prop="fields.stock.show">
          <div class="flex gap-2">
            <ColorInput v-model="formData.fields.stock.color" />
            <Checkbox v-model:checked="formData.fields.stock.show" />
          </div>
        </FormItem>
      </Card>
      <Card title="角标" class="property-group" :bordered="false">
        <FormItem label="角标" prop="badge.show">
          <Switch v-model:checked="formData.badge.show" />
        </FormItem>
        <FormItem label="角标" prop="badge.imgUrl" v-if="formData.badge.show">
          <UploadImg v-model="formData.badge.imgUrl" height="44px" width="72px">
            <template #tip> 建议尺寸：36 * 22</template>
          </UploadImg>
        </FormItem>
      </Card>
      <Card title="按钮" class="property-group" :bordered="false">
        <FormItem label="按钮类型" prop="btnBuy.type">
          <RadioGroup v-model:value="formData.btnBuy.type">
            <RadioButton value="text">文字</RadioButton>
            <RadioButton value="img">图片</RadioButton>
          </RadioGroup>
        </FormItem>
        <template v-if="formData.btnBuy.type === 'text'">
          <FormItem label="按钮文字" prop="btnBuy.text">
            <Input v-model:value="formData.btnBuy.text" />
          </FormItem>
          <FormItem label="左侧背景" prop="btnBuy.bgBeginColor">
            <ColorInput v-model="formData.btnBuy.bgBeginColor" />
          </FormItem>
          <FormItem label="右侧背景" prop="btnBuy.bgEndColor">
            <ColorInput v-model="formData.btnBuy.bgEndColor" />
          </FormItem>
        </template>
        <template v-else>
          <FormItem label="图片" prop="btnBuy.imgUrl">
            <UploadImg
              v-model="formData.btnBuy.imgUrl"
              height="56px"
              width="56px"
              :show-description="false"
            >
              <template #tip> 建议尺寸：56 * 56</template>
            </UploadImg>
          </FormItem>
        </template>
      </Card>
      <Card title="商品样式" class="property-group" :bordered="false">
        <FormItem label="上圆角" prop="borderRadiusTop">
          <Slider
            v-model:value="formData.borderRadiusTop"
            :max="100"
            :min="0"
          />
        </FormItem>
        <FormItem label="下圆角" prop="borderRadiusBottom">
          <Slider
            v-model:value="formData.borderRadiusBottom"
            :max="100"
            :min="0"
          />
        </FormItem>
        <FormItem label="间隔" prop="space">
          <Slider v-model:value="formData.space" :max="100" :min="0" />
        </FormItem>
      </Card>
    </Form>
  </ComponentContainerProperty>
</template>

<style scoped lang="scss"></style>
