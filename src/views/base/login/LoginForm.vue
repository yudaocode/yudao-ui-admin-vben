<script lang="ts" setup>
import { computed, reactive, ref, unref } from 'vue'

import { Checkbox, Col, Divider, Form, Input, Row } from 'ant-design-vue'
import { AlipayCircleFilled, GithubFilled, WechatFilled } from '@ant-design/icons-vue'
import LoginFormTitle from './LoginFormTitle.vue'

import { LoginStateEnum, useFormRules, useFormValid, useLoginState } from './useLogin'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'

import { useUserStore } from '@/store/modules/user'
import { usePermissionStore } from '@/store/modules/permission'

import { useGlobSetting } from '@/hooks/setting'
import { useDesign } from '@/hooks/web/useDesign'

import * as authUtil from '@/utils/auth'

import { Verify } from '@/components/Verifition'
import { getTenantByWebsite, getTenantIdByName } from '@/api/base/login'

const FormItem = Form.Item
const InputPassword = Input.Password

const { t } = useI18n()
const { notification, createErrorModal } = useMessage()
const { prefixCls } = useDesign('login')
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const { tenantEnable, captchaEnable } = useGlobSetting()

const { setLoginState, getLoginState } = useLoginState()
const { getFormRules } = useFormRules()

const formRef = ref()
const loading = ref(false)
const rememberMe = ref(false)

const verify = ref()
const captchaType = ref('blockPuzzle') // blockPuzzle 滑块 clickWord 点击文字

const formData = reactive({
  tenantName: '芋道源码',
  username: 'admin',
  password: 'admin123',
  captchaVerification: '',
})

const { validForm } = useFormValid(formRef)

// onKeyStroke('Enter', handleLogin);

const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN)

// 获取验证码
async function getCode() {
  // 情况一，未开启：则直接登录
  if (captchaEnable === 'false') {
    await handleLogin({})
  }
  else {
    // 情况二，已开启：则展示验证码；只有完成验证码的情况，才进行登录
    // 弹出验证码
    verify.value.show()
  }
}

// 根据域名，获得租户信息 && 获取租户ID
async function getTenantId() {
  if (tenantEnable === 'true') {
    const website = location.host
    const tenant = await getTenantByWebsite(website)
    if (tenant) {
      formData.tenantName = tenant.name
      authUtil.setTenantId(tenant.id)
    }
    else {
      const res = await getTenantIdByName(formData.tenantName)
      authUtil.setTenantId(res)
    }
  }
}

async function handleLogin(params) {
  await getTenantId()
  const data = await validForm()
  if (!data)
    return
  try {
    loading.value = true
    const userInfo = await userStore.login({
      password: data.password,
      username: data.username,
      captchaVerification: params.captchaVerification,
      mode: 'none', // 不要默认的错误提示
    })
    if (userInfo) {
      await permissionStore.changePermissionCode(userInfo.permissions)
      notification.success({
        message: t('sys.login.loginSuccessTitle'),
        description: `${t('sys.login.loginSuccessDesc')}: ${userInfo.user.nickname}`,
        duration: 3,
      })
    }
  }
  catch (error) {
    createErrorModal({
      title: t('sys.api.errorTip'),
      content: (error as unknown as Error).message || t('sys.api.networkExceptionMsg'),
      getContainer: () => document.body.querySelector(`.${prefixCls}`) || document.body,
    })
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <LoginFormTitle v-show="getShow" class="enter-x" />
  <Form
    v-show="getShow" ref="formRef" class="enter-x p-4" :model="formData" :rules="getFormRules"
    @keypress.enter="handleLogin"
  >
    <FormItem name="tenantName" class="enter-x">
      <Input
        v-if="tenantEnable === 'true'"
        v-model:value="formData.tenantName"
        size="large"
        :placeholder="t('sys.login.tenantName')"
        class="fix-auto-fill"
      />
    </FormItem>
    <FormItem name="username" class="enter-x">
      <Input
        v-model:value="formData.username" size="large" :placeholder="t('sys.login.userName')"
        class="fix-auto-fill"
      />
    </FormItem>
    <FormItem name="password" class="enter-x">
      <InputPassword
        v-model:value="formData.password"
        size="large"
        visibility-toggle
        :placeholder="t('sys.login.password')"
        class="fix-auto-fill"
      />
    </FormItem>

    <Row class="enter-x">
      <Col :span="12">
        <FormItem>
          <!-- No logic, you need to deal with it yourself -->
          <Checkbox v-model:checked="rememberMe" size="small">
            {{ t('sys.login.rememberMe') }}
          </Checkbox>
        </FormItem>
      </Col>
      <Col :span="12">
        <FormItem :style="{ 'text-align': 'right' }">
          <!-- No logic, you need to deal with it yourself -->
          <a-button type="link" size="small" @click="setLoginState(LoginStateEnum.RESET_PASSWORD)">
            {{ t('sys.login.forgetPassword') }}
          </a-button>
        </FormItem>
      </Col>
    </Row>

    <FormItem class="enter-x">
      <a-button type="primary" size="large" block :loading="loading" @click="getCode">
        {{ t('sys.login.loginButton') }}
      </a-button>
      <!-- <a-button size="large" class="mt-4 enter-x" block @click="handleRegister">
        {{ t('sys.login.registerButton') }}
      </a-button> -->
    </FormItem>
    <Row class="enter-x" :gutter="[16, 16]">
      <Col :md="8" :xs="24">
        <a-button block @click="setLoginState(LoginStateEnum.MOBILE)">
          {{ t('sys.login.mobileSignInFormTitle') }}
        </a-button>
      </Col>
      <Col :md="8" :xs="24">
        <a-button block @click="setLoginState(LoginStateEnum.QR_CODE)">
          {{ t('sys.login.qrSignInFormTitle') }}
        </a-button>
      </Col>
      <Col :md="8" :xs="24">
        <a-button block @click="setLoginState(LoginStateEnum.REGISTER)">
          {{ t('sys.login.registerButton') }}
        </a-button>
      </Col>
    </Row>

    <Divider class="enter-x">
      {{ t('sys.login.otherSignIn') }}
    </Divider>

    <div class="enter-x flex justify-evenly" :class="`${prefixCls}-sign-in-way`">
      <GithubFilled />
      <WechatFilled />
      <AlipayCircleFilled />
      <!-- <GoogleCircleFilled /> -->
      <!-- <TwitterCircleFilled /> -->
    </div>

    <!-- 萌新必读 -->
    <Divider class="enter-x">
      萌新必读
    </Divider>
    <div class="enter-x flex justify-evenly" :class="`${prefixCls}-sign-in-way`">
      <a-button href="https://doc.iocoder.cn/" target="_blank" class="w-1/4">
        📚开发指南
      </a-button>
      <a-button href="https://doc.iocoder.cn/video/" target="_blank" class="w-1/4 pl-1">
        🔥视频教程
      </a-button>
      <a-button href="https://www.iocoder.cn/Interview/good-collection/" target="_blank" class="w-1/4 pl-1">
        ⚡面试手册
      </a-button>
      <a-button href="http://static.yudao.iocoder.cn/mp/xinyu370.jpeg" target="_blank" class="w-1/4 pl-1">
        🤝外包咨询
      </a-button>
    </div>
  </Form>
  <Verify ref="verify" mode="pop" :captcha-type="captchaType" :img-size="{ width: '360px', height: '180px' }" @success="handleLogin" />
</template>
