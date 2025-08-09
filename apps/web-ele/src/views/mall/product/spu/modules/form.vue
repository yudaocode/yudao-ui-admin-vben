<script lang="ts" setup>
import type { MallSpuApi } from '#/api/mall/product/spu';

import { onMounted, ref, unref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { cloneDeep, convertToInteger, formatToFraction } from '@vben/utils';

import { ElMessage } from 'element-plus';

import * as ProductSpuApi from '#/api/mall/product/spu';

import DeliveryForm from '../components/delivery-form.vue';
import DescriptionForm from '../components/description-form.vue';
import InfoForm from '../components/info-form.vue';
import OtherForm from '../components/other-form.vue';
import SkuForm from '../components/sku-form.vue';

const activeTab = ref('info');
const activeName = ref('info'); // Tag 激活的窗口

// SPU 表单数据
const formData = ref<MallSpuApi.Spu>({
  name: '', // 商品名称
  categoryId: undefined, // 商品分类
  keyword: '', // 关键字
  picUrl: '', // 商品封面图
  sliderPicUrls: [], // 商品轮播图
  introduction: '', // 商品简介
  deliveryTypes: [], // 配送方式数组
  deliveryTemplateId: undefined, // 运费模版
  brandId: undefined, // 商品品牌
  specType: false, // 商品规格
  subCommissionType: false, // 分销类型
  skus: [
    {
      price: 0, // 商品价格
      marketPrice: 0, // 市场价
      costPrice: 0, // 成本价
      barCode: '', // 商品条码
      picUrl: '', // 图片地址
      stock: 0, // 库存
      weight: 0, // 商品重量
      volume: 0, // 商品体积
      firstBrokeragePrice: 0, // 一级分销的佣金
      secondBrokeragePrice: 0, // 二级分销的佣金
    },
  ],
  description: '', // 商品详情
  sort: 0, // 商品排序
  giveIntegral: 0, // 赠送积分
  virtualSalesCount: 0, // 虚拟销量
});

const formLoading = ref(false); // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const { push } = useRouter(); // 路由
const { params } = useRoute(); // 查询参数
/** 获得详情 */
const getDetail = async () => {
  const id = params.id as unknown as number;
  if (id) {
    formLoading.value = true;
    try {
      const res = (await ProductSpuApi.getSpu(id)) as MallSpuApi.Spu;
      res.skus?.forEach((item: MallSpuApi.Sku) => {
        // 回显价格分转元
        item.price = formatToFraction(item.price);
        item.marketPrice = formatToFraction(item.marketPrice);
        item.costPrice = formatToFraction(item.costPrice);
        item.firstBrokeragePrice = formatToFraction(item.firstBrokeragePrice);
        item.secondBrokeragePrice = formatToFraction(item.secondBrokeragePrice);
      });
      formData.value = res;
    } finally {
      formLoading.value = false;
    }
  }
};

/** 提交按钮 */
const infoRef = ref<InstanceType<typeof InfoForm>>();
const skuRef = ref<InstanceType<typeof SkuForm>>();
const deliveryRef = ref<InstanceType<typeof DeliveryForm>>();
const descriptionRef = ref<InstanceType<typeof DescriptionForm>>();
const otherRef = ref<InstanceType<typeof OtherForm>>();
const submitForm = async () => {
  // 提交请求
  formLoading.value = true;
  try {
    // 校验各表单
    await unref(infoRef)?.validate();
    await unref(skuRef)?.validate();
    await unref(deliveryRef)?.validate();
    await unref(descriptionRef)?.validate();
    await unref(otherRef)?.validate();
    // 深拷贝一份, 这样最终 server 端不满足，不需要影响原始数据
    const deepCopyFormData = cloneDeep(unref(formData.value)) as MallSpuApi.Spu;
    deepCopyFormData.skus!.forEach((item) => {
      // 给sku name赋值
      item.name = deepCopyFormData.name;
      // sku相关价格元转分
      item.price = convertToInteger(item.price);
      item.marketPrice = convertToInteger(item.marketPrice);
      item.costPrice = convertToInteger(item.costPrice);
      item.firstBrokeragePrice = convertToInteger(item.firstBrokeragePrice);
      item.secondBrokeragePrice = convertToInteger(item.secondBrokeragePrice);
    });
    // 处理轮播图列表
    const newSliderPicUrls: any[] = [];
    deepCopyFormData.sliderPicUrls!.forEach((item: any) => {
      // 如果是前端选的图
      typeof item === 'object'
        ? newSliderPicUrls.push(item.url)
        : newSliderPicUrls.push(item);
    });
    deepCopyFormData.sliderPicUrls = newSliderPicUrls;
    // 校验都通过后提交表单
    const data = deepCopyFormData as MallSpuApi.Spu;
    const id = params.id as unknown as number;
    if (id) {
      await ProductSpuApi.updateSpu(data);
      ElMessage.success('更新成功');
    } else {
      await ProductSpuApi.createSpu(data);
      ElMessage.success('创建成功');
    }
    close();
  } finally {
    formLoading.value = false;
  }
};

/** 关闭按钮 */
const close = () => {
  push({ name: 'ProductSpu' });
};

/** 初始化 */
onMounted(async () => {
  await getDetail();
});
</script>

<template>
  <Page :auto-content-height="true">
    <ElTabs v-model="activeTab">
      <ElTabPane label="基础设置" name="info">
        <InfoForm
          :prop-form-data="formData"
          v-model:active-name="activeName"
          ref="infoRef"
        />
      </ElTabPane>
      <ElTabPane label="价格库存" name="sku">
        <SkuForm
          :prop-form-data="formData"
          v-model:active-name="activeName"
          ref="skuRef"
        />
      </ElTabPane>
      <ElTabPane label="物流设置" name="delivery">
        <DeliveryForm
          :prop-form-data="formData"
          v-model:active-name="activeName"
          ref="deliveryRef"
        />
      </ElTabPane>
      <ElTabPane label="商品详情" name="description">
        <DescriptionForm
          :prop-form-data="formData"
          v-model:active-name="activeName"
          ref="descriptionRef"
        />
      </ElTabPane>
      <ElTabPane label="其它设置" name="other">
        <OtherForm
          :prop-form-data="formData"
          v-model:active-name="activeName"
          ref="otherRef"
        />
      </ElTabPane>
    </ElTabs>
    <ElButton type="primary" :loading="formLoading" @click="submitForm">
      保存
    </ElButton>
    <ElButton @click="close">返回</ElButton>
  </Page>
</template>
