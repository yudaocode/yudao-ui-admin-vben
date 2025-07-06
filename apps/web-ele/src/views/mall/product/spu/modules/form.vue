<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { onMounted, ref } from 'vue';
import type { MallSpuApi } from '#/api/mall/product/spu';
import { useRouter, useRoute } from 'vue-router';
import { floatToFixed2, formatToFraction } from '#/utils';
import * as ProductSpuApi from '#/api/mall/product/spu';

import InfoForm from '../components/info-form.vue';
import DeliveryForm from '../components/delivery-form.vue';
import DescriptionForm from '../components/description-form.vue';
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
const isDetail = ref(false); // 是否查看详情
const { push, currentRoute } = useRouter(); // 路由
const { params, name } = useRoute(); // 查询参数
/** 获得详情 */
const getDetail = async () => {
  if ('ProductSpuDetail' === name) {
    isDetail.value = true;
  }
  const id = params.id as unknown as number;
  if (id) {
    formLoading.value = true;
    try {
      const res = (await ProductSpuApi.getSpu(id)) as MallSpuApi.Spu;
      res.skus?.forEach((item: MallSpuApi.Sku) => {
        if (isDetail.value) {
          item.price = floatToFixed2(item.price);
          item.marketPrice = floatToFixed2(item.marketPrice);
          item.costPrice = floatToFixed2(item.costPrice);
          item.firstBrokeragePrice = floatToFixed2(item.firstBrokeragePrice);
          item.secondBrokeragePrice = floatToFixed2(item.secondBrokeragePrice);
        } else {
          // 回显价格分转元
          item.price = formatToFraction(item.price);
          item.marketPrice = formatToFraction(item.marketPrice);
          item.costPrice = formatToFraction(item.costPrice);
          item.firstBrokeragePrice = formatToFraction(item.firstBrokeragePrice);
          item.secondBrokeragePrice = formatToFraction(
            item.secondBrokeragePrice,
          );
        }
      });
      formData.value = res;
    } finally {
      formLoading.value = false;
    }
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
        <InfoForm :propFormData="formData" v-model:activeName="activeName" />
      </ElTabPane>
      <ElTabPane label="价格库存" name="sku">
        <SkuForm :propFormData="formData" v-model:activeName="activeName" />
      </ElTabPane>
      <ElTabPane label="物流设置" name="delivery">
        <DeliveryForm
          :propFormData="formData"
          v-model:activeName="activeName"
        />
      </ElTabPane>
      <ElTabPane label="商品详情" name="description">
        <DescriptionForm
          :propFormData="formData"
          v-model:activeName="activeName"
        />
      </ElTabPane>
      <ElTabPane label="其它设置" name="other">
        <OtherForm :propFormData="formData" v-model:activeName="activeName" />
      </ElTabPane>
    </ElTabs>
  </Page>
</template>
