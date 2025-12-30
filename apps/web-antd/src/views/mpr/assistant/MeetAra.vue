<script lang="ts" setup>
import type { AssistantApi } from '#/api/mpr/assistant';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, VbenButton } from '@vben/common-ui';
import {
  Plus,
  SvgAvatar1Icon,
  SvgAvatar2Icon,
  SvgAvatar3Icon,
  SvgAvatar4Icon,
} from '@vben/icons';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  VbenCountToAnimator,
  VbenIcon,
} from '@vben-core/shadcn-ui';

import { EditOutlined, TransactionOutlined } from '@ant-design/icons-vue';
import { Avatar, Progress } from 'ant-design-vue';

import { createEmptyAssistant, getLastAssistant } from '#/api/mpr/assistant';
import { $t } from '#/locales';

const router = useRouter();
const loading = ref(false);
const lastAssistant = ref<AssistantApi.Assistant>();

async function createAra() {
  loading.value = true;
  try {
    const data = await createEmptyAssistant({});
    router.push({ name: 'CreateAra', query: { id: data } });
  } finally {
    loading.value = false;
  }
}
function editAra() {
  router.push({ name: 'CreateAra', query: { id: lastAssistant.value.id } });
}
/** 支付 */
function handlePay() {
  router.push({ name: 'AraPayment', query: { id: lastAssistant.value.id } });
}
async function getLastAra() {
  loading.value = true;
  try {
    lastAssistant.value = await getLastAssistant();
  } finally {
    loading.value = false;
  }
}

const image = ref('/static/images/Ara.png');

const items = [
  {
    icon: SvgAvatar1Icon,
    title: '实时搜索',
    desc: 'Ara 能够全天候监控市场，及时\n' + '发现新的⽬标商品，抢占先机！',
  },
  {
    icon: SvgAvatar2Icon,
    title: '精准筛选',
    desc: '深⼊分析商品数据，⾃动剔除⼲扰项提供专业的⻅解和决策建议',
  },
  {
    icon: SvgAvatar3Icon,
    title: '数据追踪',
    desc: '每⼀次搜索和交易，都是你未来谈判\n' + '的底⽓',
  },
  {
    icon: SvgAvatar4Icon,
    title: '效率沟通',
    desc: 'Ara 能够⾃动对意向商品主动发起\n' + '沟通，帮您快速达成交易',
  },
];

onMounted(() => {
  getLastAra();
  // console.warn('OAuth 2.0',$t('OAuth 2.0'))
});
</script>

<template>
  <Page v-loading="loading">
    <div
      class="size-full flex-col items-center justify-center p-5 duration-300"
    >
      <div class="flex flex-col items-center justify-center duration-300">
        <Avatar v-if="image" :src="image" :size="180" />
        <img v-if="false" :src="image" class="md:1/3 w-1/2 lg:w-1/4" />
        <div class="flex-col-center">
          <p
            class="text-foreground mt-8 text-2xl font-bold md:text-3xl lg:text-4xl"
          >
            {{ $t('认识你的智能助理Ara') }}
          </p>
          <p class="text-muted-foreground md:text-md my-4 lg:text-lg">
            {{ $t('让 Ara 成为您的专属助⼿，提升⼯作效率') }}
          </p>
          <div v-if="lastAssistant" class="flex-center my-4 w-[500px]">
            <div class="w-[140px]">
              {{
                lastAssistant.name
                  ? lastAssistant.name
                  : `Ara #${lastAssistant.id}`
              }}
              配置进度：
            </div>
            <Progress
              class="mt-2 w-[100px]"
              :percent="
                ((lastAssistant.configStep ? lastAssistant.configStep : 0) *
                  100) /
                4
              "
              :size="[55, 10]"
              :format="
                () =>
                  `${
                    lastAssistant.configStep ? lastAssistant.configStep : '0'
                  }/4`
              "
              :steps="4"
            />
            <VbenButton
              class="ml-auto"
              v-if="lastAssistant.configStep < 4"
              size="sm"
              @click="editAra"
            >
              <EditOutlined class="mr-1 size-4" />
              {{ $t('继续完善') }}
            </VbenButton>
            <VbenButton
              class="ml-auto"
              v-if="lastAssistant.configStep >= 4 && lastAssistant.status === 0"
              size="sm"
              @click="handlePay"
            >
              <TransactionOutlined class="mr-1 size-4" />
              {{ $t('支付') }}
            </VbenButton>
          </div>
          <VbenButton size="lg" @click="createAra">
            <Plus class="mr-2 size-4" />
            {{ $t('创建我的助理') }}
          </VbenButton>
        </div>
      </div>
      <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <template v-for="item in items" :key="item.title">
          <Card :title="item.title" class="w-full">
            <CardHeader class="items-center text-center">
              <VbenIcon :icon="item.icon" class="size-8 flex-shrink-0" />
              <CardTitle class="items-center text-xl font-bold">
                {{ item.title }}
              </CardTitle>
            </CardHeader>

            <CardContent class="flex items-center justify-between">
              <span>{{ item.desc }}</span>
            </CardContent>
            <CardFooter v-if="false" class="justify-between">
              <span>{{ item.totalTitle }}</span>
              <VbenCountToAnimator
                :end-val="item.totalValue"
                :start-val="1"
                prefix=""
              />
            </CardFooter>
          </Card>
        </template>
      </div>
      <div class="mt-5">
        <!-- 水平排列容器 -->
        <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
          <!-- 左侧：为什么选择Ara -->
          <div class="rounded-lg bg-white p-6 shadow-sm">
            <div class="mb-6 flex items-center gap-2">
              <div class="h-6 w-6 text-blue-500">
                <!-- 使用svg灯泡图标 -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707-.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-gray-800">为什么选择 Ara?</h2>
            </div>

            <ul class="space-y-3">
              <li class="flex items-start gap-2">
                <span class="mt-1 text-green-500">✓</span>
                <span class="text-gray-600">
                  专业的业务分析能力，提供数据驱动的决策支持
                </span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-green-500">✓</span>
                <span class="text-gray-600">
                  24/7 全天候服务，随时响应您的需求
                </span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-1 text-green-500">✓</span>
                <span class="text-gray-600">
                  持续学习和进步，助力您的业务成长
                </span>
              </li>
            </ul>
          </div>

          <!-- 右侧：使用步骤 -->
          <div class="rounded-lg bg-white p-6 shadow-sm">
            <h2 class="mb-6 text-xl font-bold text-gray-800">
              开始使用 Ara 的三个简单步骤
            </h2>

            <div class="space-y-6">
              <!-- 步骤1 -->
              <div class="flex gap-4">
                <div
                  class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white"
                >
                  1
                </div>
                <div>
                  <h3 class="mb-1 text-base font-semibold text-gray-800">
                    创建您的 Ara 助理
                  </h3>
                  <p class="text-sm text-gray-600">
                    点击"创建我的助理"按钮，为您的业务定制专属的 AI 助理
                  </p>
                </div>
              </div>

              <!-- 步骤2 -->
              <div class="flex gap-4">
                <div
                  class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white"
                >
                  2
                </div>
                <div>
                  <h3 class="mb-1 text-base font-semibold text-gray-800">
                    设置业务偏好
                  </h3>
                  <p class="text-sm text-gray-600">
                    根据您的具体需求，为 Ara 设置个性化的业务参数和工作重点
                  </p>
                </div>
              </div>

              <!-- 步骤3 -->
              <div class="flex gap-4">
                <div
                  class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white"
                >
                  3
                </div>
                <div>
                  <h3 class="mb-1 text-base font-semibold text-gray-800">
                    开始智能协作
                  </h3>
                  <p class="text-sm text-gray-600">
                    与 Ara 展开对话，让她协助您处理日常工作事务
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>
