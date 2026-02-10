<script lang="ts" setup>
/**
 * 移动端流程表单展示页面 - Ant Design Vue 版本
 * 使用 @form-create/ant-design-vue 渲染表单
 * 用于 UniApp 通过 iframe/webview 嵌入
 *
 * URL 参数说明：
 * - type: 环境类型（必填）'miniapp' 小程序（微信/支付宝/百度等） | 'h5' H5
 * - processInstanceId: 流程实例ID（查看已有流程时使用）
 * - taskId: 任务ID（可选）
 * - activityId: 活动节点ID（可选）
 * - token: 访问令牌（用于 API 认证）
 */
import { computed, nextTick, onMounted, ref, toRaw } from 'vue';
import { useRoute } from 'vue-router';

import { BpmFieldPermissionType, BpmModelFormType } from '@vben/constants';
import { updatePreferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';

import { Button, Empty, Spin } from 'ant-design-vue';

import { getApprovalDetail } from '#/api/bpm/processInstance';
import { setConfAndFields2 } from '#/components/form-create';

type EnvType = 'h5' | 'miniapp'; // 环境类型

// UniApp WebView 类型声明
interface UniWebView {
  postMessage: (options: { data: any }) => void;
  getEnv: (callback: (res: any) => void) => void;
  navigateTo: (options: {
    fail?: () => void;
    success?: () => void;
    url: string;
  }) => void;
  navigateBack: (options?: { delta?: number }) => void;
  switchTab: (options: { url: string }) => void;
  reLaunch: (options: { url: string }) => void;
  redirectTo: (options: { url: string }) => void;
}

declare global {
  interface Window {
    uni?: UniWebView;
  }
}

defineOptions({ name: 'BpmMobileFormPreview' });

const route = useRoute();
const accessStore = useAccessStore();

const envType = ref<EnvType>('h5'); // 环境类型
const loading = ref(true); // 页面加载状态
const error = ref<null | string>(null);

const processInstance = ref<any>(null);
const processDefinition = ref<any>(null);

const detailForm = ref<{
  option: any;
  rule: any[];
  value: Record<string, any>;
}>({
  option: {},
  rule: [],
  value: {},
}); // 流程实例的表单详情
const fApi = ref<any>(null); // form-create API 引用
const fieldPermissions = ref<Record<string, string>>({}); // 字段权限

// 是否有表单内容
const hasFormContent = computed(() => {
  return detailForm.value.rule && detailForm.value.rule.length > 0;
});

/**
 * 初始化 Token
 * 从 URL 参数获取 token 并设置到 store
 */
function initToken() {
  const token = route.query.token as string;
  if (token) {
    accessStore.setAccessToken(token);
  }
}

/**
 * 验证并初始化环境类型
 */
function initEnvType(): boolean {
  const type = route.query.type as string;

  if (!type) {
    error.value = '缺少必填参数: type';
    return false;
  }

  if (type !== 'h5' && type !== 'miniapp') {
    error.value = 'type 参数值无效，必须是 h5 或 miniapp';
    return false;
  }
  envType.value = type as EnvType;
  return true;
}

/**
 * 获取审批详情
 */
async function getDetail() {
  loading.value = true;
  error.value = null;

  try {
    const processInstanceId = route.query.processInstanceId as string;
    const taskId = route.query.taskId as string;
    const activityId = route.query.activityId as string;

    if (!processInstanceId) {
      throw new Error('缺少流程实例ID参数');
    }

    const data = await getApprovalDetail({
      processInstanceId,
      taskId,
      activityId,
    });

    if (!data) {
      throw new Error('查询不到审批详情信息');
    }

    if (!data.processDefinition || !data.processInstance) {
      throw new Error('查询不到流程信息');
    }

    processInstance.value = data.processInstance;
    processDefinition.value = data.processDefinition;

    // 设置普通表单信息
    if (data.processDefinition.formType === BpmModelFormType.NORMAL) {
      if (detailForm.value.rule?.length > 0) {
        // 避免刷新 form-create 显示不了
        detailForm.value.value = processInstance.value.formVariables;
      } else {
        setConfAndFields2(
          detailForm,
          processDefinition.value.formConf,
          processDefinition.value.formFields,
          processInstance.value.formVariables,
        );
      }
      await nextTick();
      fApi.value?.btn.show(false);
      fApi.value?.resetBtn.show(false);
      fApi.value?.disabled(true);
      // 设置表单字段权限
      if (data.formFieldsPermission) {
        Object.keys(data.formFieldsPermission).forEach((item) => {
          setFieldPermission(item, data.formFieldsPermission[item]);
        });
      }
    }
  } finally {
    loading.value = false;
  }
}

/**
 * 向父页面发送消息
 * 根据环境类型选择不同的通信方式
 */
function postMessageToParent(message: { data: any; type: string }) {
  const messageData = {
    source: 'bpm-mobile-form',
    type: message.type,
    data: message.data,
  };

  // 小程序环境：使用 uni.postMessage
  if (envType.value === 'miniapp') {
    if (window.uni?.postMessage) {
      // 传递的消息信息，必须写在 data 对象中
      window.uni.postMessage({ data: message.data });
    } else {
      console.error('小程序环境下 uni 对象未定义');
    }
    return;
  }

  // H5 环境：使用 window.postMessage
  if (envType.value === 'h5' && window.parent !== window) {
    window.parent.postMessage(messageData, '*');
  }
}

/**
 * 安全地克隆对象，移除不可序列化的属性
 */
function safeClone(obj: any): any {
  try {
    // 先使用 toRaw 移除 Vue 的响应式代理
    const raw = toRaw(obj);
    // 使用 JSON 序列化来移除函数、DOM 元素等不可序列化的内容
    // eslint-disable-next-line unicorn/prefer-structured-clone
    return JSON.parse(JSON.stringify(raw));
  } catch (error) {
    console.error('克隆对象失败:', error);
    return {};
  }
}

/** 设置表单权限 */
function setFieldPermission(field: string, permission: string) {
  fieldPermissions.value[field] = permission;
  if (permission === BpmFieldPermissionType.READ) {
    fApi.value?.disabled(true, field);
  }
  if (permission === BpmFieldPermissionType.WRITE) {
    fApi.value?.disabled(false, field);
  }
  if (permission === BpmFieldPermissionType.NONE) {
    fApi.value?.hidden(true, field);
  }
}

/**
 * 确定按钮点击事件
 * 获取表单数据并发送给父页面
 */
function handleConfirm() {
  // 获取最新的表单值（转换为普通对象，避免 Proxy 序列化问题）
  const rawValue = detailForm.value.value;
  const currentValue = safeClone(rawValue);

  // 发送表单数据给父页面
  postMessageToParent({
    type: 'FORM_SUBMIT',
    data: {
      formValue: currentValue,
      fieldPermissions: safeClone(fieldPermissions.value),
      processInstanceId: route.query.processInstanceId,
      taskId: route.query.taskId,
    },
  });
  window.uni?.navigateBack();
}

onMounted(() => {
  // 验证环境类型
  if (!initEnvType()) {
    loading.value = false;
    return;
  }

  // 1. 先加载微信 JSSDK（微信小程序需要）
  const wxScript = document.createElement('script');
  wxScript.type = 'text/javascript';
  wxScript.src = 'https://res.wx.qq.com/open/js/jweixin-1.4.0.js';

  wxScript.addEventListener('load', () => {
    // 2. 微信 SDK 加载完成后，加载 UniApp WebView SDK
    const uniScript = document.createElement('script');
    uniScript.type = 'text/javascript';
    uniScript.src = 'https://unpkg.com/@dcloudio/uni-webview-js@0.0.3/index.js';

    uniScript.addEventListener('load', () => {
      // 所有 SDK 加载完成后初始化
      initApp();
    });

    uniScript.addEventListener('error', () => {
      error.value = 'UniApp WebView SDK 加载失败';
      loading.value = false;
    });

    document.head.append(uniScript);
  });

  wxScript.addEventListener('error', () => {
    // 微信 SDK 加载失败，尝试只加载 UniApp SDK（可能是其他小程序）
    const uniScript = document.createElement('script');
    uniScript.type = 'text/javascript';
    uniScript.src = 'https://unpkg.com/@dcloudio/uni-webview-js@0.0.3/index.js';

    uniScript.addEventListener('load', () => {
      initApp();
    });

    uniScript.addEventListener('error', () => {
      error.value = 'SDK 加载失败';
      loading.value = false;
    });

    document.head.append(uniScript);
  });

  document.head.append(wxScript);

  // 初始化
  initApp();
});

/**
 * 初始化应用
 */
function initApp() {
  // 设置主题为 light 模式
  updatePreferences({
    theme: {
      mode: 'light',
    },
  });

  // 初始化 token
  initToken();

  // 加载数据
  if (route.query.processInstanceId) {
    getDetail();
  } else {
    loading.value = false;
    error.value = '缺少必要参数：processInstanceId';
  }
}
</script>

<template>
  <div class="mobile-form-preview-antd">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <Spin size="large" tip="加载中..." />
    </div>

    <!-- 错误状态 -->
    <Empty v-else-if="error" :description="error" />

    <!-- 表单内容 -->
    <template v-else>
      <!-- 有表单规则时渲染 form-create -->
      <div v-if="hasFormContent" class="mt-4">
        <form-create
          v-model="detailForm.value"
          v-model:api="fApi"
          :option="detailForm.option"
          :rule="detailForm.rule"
        />

        <!-- 确定按钮 -->
        <div class="form-footer">
          <Button type="primary" size="large" block @click="handleConfirm">
            确定
          </Button>
        </div>
      </div>

      <!-- 无表单内容时显示空状态 -->
      <Empty v-else description="暂无表单内容" />
    </template>
  </div>
</template>

<style scoped>
/* 响应式适配 */
@media (max-width: 768px) {
  .mobile-form-preview-antd {
    padding: 12px;
  }

  :deep(.ant-form-item) {
    margin-bottom: 20px;
  }
}

.mobile-form-preview-antd {
  min-height: 100px;
  padding: 16px;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.form-footer {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  box-shadow: 0 -2px 8px rgb(0 0 0 / 5%);
}

.form-footer :deep(.ant-btn) {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
}
</style>
