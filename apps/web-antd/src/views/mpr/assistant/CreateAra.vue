<script lang="ts" setup>
import type { AssistantApi } from '#/api/mpr/assistant';
import type { AssistantConfigApi } from '#/api/mpr/assistantConfig';

import { ref, unref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Avatar, Button, message, Steps } from 'ant-design-vue';

import { getAssistantInfo } from '#/api/mpr/assistant';
import { $t } from '#/locales';

import AiPrompt from './modules/ai-prompt.vue';
import AutoContact from './modules/auto-contact.vue';
import GoodsFilter from './modules/goods-filter.vue';
import InputKeyword from './modules/input-keyword.vue';

const route = useRoute();
const router = useRouter();
const { push } = useRouter();
const loading = ref(false);
const currentStep = ref(0);
const formData = ref<AssistantApi.AssistantInfo>({
  id: undefined,
  assistant: {} as AssistantApi.Assistant,
  assistantConfig: {} as AssistantConfigApi.AssistantConfig,
});

/** 表单引用 */
const inputKeywordRef = ref<InstanceType<typeof InputKeyword>>();
const aiPromptRef = ref<InstanceType<typeof AiPrompt>>();
const goodsFilterRef = ref<InstanceType<typeof GoodsFilter>>();
const autoContactRef = ref<InstanceType<typeof AutoContact>>();

/** 获取详情数据 */
async function getDetail() {
  const id = route.query.id as any;
  if (!id) {
    return;
  }
  loading.value = true;
  try {
    formData.value = await getAssistantInfo(id);
    currentStep.value = formData.value.assistant.configStep;
  } finally {
    loading.value = false;
  }
}

function handlePay() {
  tabs.closeCurrentTab();
  push({ name: 'AraPayment', query: { id: formData.value.assistant.id } });
  // router.push('/infra/codegen');
}
function handleFinish() {
  tabs.closeCurrentTab();
  router.push('/mpr/assistant');
}
/** 提交表单 */
async function submitForm() {
  // 表单验证
  const basicInfoValid = await basicInfoRef.value?.validate();
  if (!basicInfoValid) {
    message.warn('保存失败，原因：基本信息表单校验失败请检查！！！');
    return;
  }
  const generateInfoValid = await generateInfoRef.value?.validate();
  if (!generateInfoValid) {
    message.warn('保存失败，原因：生成信息表单校验失败请检查！！！');
    return;
  }

  // 提交表单
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.updating'),
    key: 'action_process_msg',
  });
  try {
    // 拼接相关信息
    const basicInfo = await basicInfoRef.value?.getValues();
    const columns = columnInfoRef.value?.getData() || unref(formData).columns;
    const generateInfo = await generateInfoRef.value?.getValues();
    await updateCodegenTable({
      table: { ...unref(formData).table, ...basicInfo, ...generateInfo },
      columns,
    });
    // 关闭并提示
    message.success({
      content: $t('ui.actionMessage.operationSuccess'),
      key: 'action_key_msg',
    });
    close();
  } catch (error) {
    console.error('保存失败', error);
  } finally {
    hideLoading();
  }
}

const tabs = useTabs();

/** 返回列表 */
function close() {
  tabs.closeCurrentTab();
  router.push('/infra/codegen');
}

/** 下一步 */
async function nextStep() {
  if (currentStep.value === 0) {
    // 表单验证
    const inputKeywordValid = await inputKeywordRef.value?.validate();
    if (!inputKeywordValid) {
      message.warn('请输入关键词');
      return;
    }
  }
  if (currentStep.value === 3) return;
  currentStep.value += 1;
}

/** 上一步 */
function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value -= 1;
  }
}

/** 步骤配置 */
const steps = [
  {
    title: '关键词',
  },
  {
    title: '提示词',
  },
  {
    title: '商品筛选',
  },
  {
    title: '联系卖家',
  },
];

// 初始化
getDetail();
</script>

<template>
  <Page v-loading="loading">
    <div class="flex flex-col items-center justify-center duration-300">
      <Transition name="scale">
        <Avatar
          v-show="currentStep === 0"
          src="/static/images/Ara.png"
          :size="180"
        />
      </Transition>
      <div class="flex-col-center">
        <p
          class="text-foreground mt-8 text-2xl font-bold md:text-3xl lg:text-4xl"
        >
          {{ $t('创建你的智能助理 Ara') }}
        </p>
        <p class="text-muted-foreground md:text-md my-4 lg:text-lg">
          {{ $t('让我们⼀起完成以下步骤，打造您的专属助⼿') }}
        </p>
      </div>
    </div>
    <Steps
      type="navigation"
      v-model:current="currentStep"
      class="mx-20 mb-1 w-auto"
    >
      <Steps.Step
        v-for="(step, index) in steps"
        :key="index"
        :title="step.title"
      />
    </Steps>

    <div class="bg-card-none mx-20 flex h-[95%] flex-col rounded-md p-4">
      <div class="flex-1 overflow-auto py-4">
        <!-- 根据当前步骤显示对应的组件 -->
        <InputKeyword
          v-show="currentStep === 0"
          ref="inputKeywordRef"
          :assistant="formData.assistant"
          :assistant-config="formData.assistantConfig"
          @success="nextStep"
        />
        <AiPrompt
          v-show="currentStep === 1"
          ref="aiPromptRef"
          :assistant="formData.assistant"
          :assistant-config="formData.assistantConfig"
          @success="nextStep"
        />
        <GoodsFilter
          v-show="currentStep === 2"
          ref="goodsFilterRef"
          :assistant="formData.assistant"
          :assistant-config="formData.assistantConfig"
          @success="nextStep"
        />
        <AutoContact
          v-show="currentStep === 3"
          ref="autoContactRef"
          :assistant="formData.assistant"
          :assistant-config="formData.assistantConfig"
          @success="nextStep"
        />
        <div class="mb-12 text-center" v-show="currentStep === 4">
          <h1 class="text-dark mb-4 text-[clamp(1.8rem,4vw,2.8rem)] font-bold">
            Ara 配置已完成！
          </h1>
          <div v-show="formData.assistant.status !== 10">
            <h2 class="text-dark mb-4 text-2xl font-bold">
              只差最后一步，完成付款后 Ara 将立即开始工作！
            </h2>
            <p class="text-light-dark mx-auto max-w-2xl text-lg">
              点击去支付按钮，选择最适合您的套餐进行付款即可。
            </p>
          </div>
        </div>
      </div>

      <div class="mt-4 flex justify-end space-x-2">
        <Button
          size="large"
          type="default"
          v-show="currentStep > 0"
          @click="prevStep"
        >
          上一步
        </Button>
        <Button
          size="large"
          type="primary"
          v-show="currentStep < steps.length - 1"
          @click="nextStep"
        >
          下一步
        </Button>
        <Button
          v-show="
            currentStep >= steps.length - 1 && formData.assistant.status !== 10
          "
          size="large"
          type="primary"
          :loading="loading"
          @click="handlePay"
        >
          去支付
        </Button>
        <Button
          v-show="
            currentStep === steps.length - 1 && formData.assistant.status === 10
          "
          size="large"
          type="primary"
          :loading="loading"
          @click="handleFinish"
        >
          完成
        </Button>
        <Button
          v-if="false"
          size="large"
          type="primary"
          :loading="loading"
          @click="submitForm"
        >
          保存
        </Button>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.scale-enter-active,
.scale-leave-active {
  transition: all 0.5s ease;
}

.scale-enter-from,
.scale-leave-to {
  height: 0;
  opacity: 0;
  transform: scale(0.5); /* 消失时缩小 */
}
</style>
