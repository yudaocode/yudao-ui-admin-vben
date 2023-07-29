<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Button, Checkbox, Col, Form, Row } from 'ant-design-vue'

import { useFormValid } from './useLogin'
import { useI18n } from '@/hooks/web/useI18n'
import { useMessage } from '@/hooks/web/useMessage'

import { useDesign } from '@/hooks/web/useDesign'
import { authorize, getAuthorize } from '@/api/base/login'

const FormItem = Form.Item

const { t } = useI18n()
const { query } = useRoute()
const { notification, createErrorModal } = useMessage()
const { prefixCls } = useDesign('login')

const formRef = ref()
const loading = ref(false)

const loginForm = reactive({
  scopes: [] as any[], // 已选中的 scope 数组
})

// URL 上的 client_id、scope 等参数
const params = reactive({
  responseType: undefined as any,
  clientId: undefined as any,
  redirectUri: undefined as any,
  state: undefined as any,
  scopes: [] as any[], // 优先从 query 参数获取；如果未传递，从后端获取
})

// 客户端信息
let client = reactive({
  name: '',
  logo: '',
})

const { validForm } = useFormValid(formRef)

async function init() {
  // 解析参数
  // 例如说【自动授权不通过】：client_id=default&redirect_uri=https%3A%2F%2Fwww.iocoder.cn&response_type=code&scope=user.read%20user.write
  // 例如说【自动授权通过】：client_id=default&redirect_uri=https%3A%2F%2Fwww.iocoder.cn&response_type=code&scope=user.read
  params.responseType = query.response_type as any
  params.clientId = query.client_id as any
  params.redirectUri = query.redirect_uri as any
  params.state = query.state as any
  if (query.scope)
    params.scopes = (query.scope as any).split(' ')

  // 如果有 scope 参数，先执行一次自动授权，看看是否之前都授权过了。
  if (params.scopes.length > 0) {
    const res = await doAuthorize(true, params.scopes, [])
    const href = res
    if (!href) {
      console.log('自动授权未通过！')
      return
    }
    location.href = href
  }

  // 获取授权页的基本信息
  const res = await getAuthorize(params.clientId)
  client = res.client
  // 解析 scope
  let scopes
  // 1.1 如果 params.scope 非空，则过滤下返回的 scopes
  if (params.scopes.length > 0) {
    scopes = []
    for (const scope of res.scopes) {
      if (params.scopes.includes(scope.key))
        scopes.push(scope)
    }
    // 1.2 如果 params.scope 为空，则使用返回的 scopes 设置它
  }
  else {
    scopes = res.data.scopes
    for (const scope of scopes)
      params.scopes.push(scope.key)
  }
  // 生成已选中的 checkedScopes
  for (const scope of scopes) {
    if (scope.value)
      loginForm.scopes.push(scope.key)
  }
}

async function handleAuthorize(approved) {
  const data = await validForm()
  if (!data)
    return
  try {
    loading.value = true
    // 计算 checkedScopes + uncheckedScopes
    let checkedScopes
    let uncheckedScopes
    if (approved) {
      // 同意授权，按照用户的选择
      checkedScopes = loginForm.scopes
      uncheckedScopes = params.scopes.filter(item => !checkedScopes.includes(item))
    }
    else {
      // 拒绝，则都是取消
      checkedScopes = []
      uncheckedScopes = params.scopes
    }
    // 提交授权的请求
    const res = await doAuthorize(false, checkedScopes, uncheckedScopes)
    if (res) {
      const href = res
      if (!href)
        return

      location.href = href
      notification.success({
        message: t('sys.login.loginSuccessTitle'),
        description: `${t('sys.login.loginSuccessDesc')}`,
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
async function doAuthorize(autoApprove, checkedScopes, uncheckedScopes) {
  return await authorize(
    params.responseType,
    params.clientId,
    params.redirectUri,
    params.state,
    autoApprove,
    checkedScopes,
    uncheckedScopes,
  )
}

function formatScope(scope) {
  // 格式化 scope 授权范围，方便用户理解。
  // 这里仅仅是一个 demo，可以考虑录入到字典数据中，例如说字典类型 "system_oauth2_scope"，它的每个 scope 都是一条字典数据。
  switch (scope) {
    case 'user.read':
      return t('sys.login.ssoInfoDesc')
    case 'user.write':
      return t('sys.login.ssoEditDesc')
    default:
      return scope
  }
}

onMounted(() => {
  init()
})
</script>

<template>
  <h2 class="mb-3 text-2xl font-bold text-center xl:text-3xl enter-x xl:text-left">
    {{ client.name + t('sys.login.ssoSignInFormTitle') }}
  </h2>
  <Form ref="formRef" class="p-4 enter-x" :model="loginForm" @keypress.enter="handleAuthorize(true)">
    此第三方应用请求获取以下权限：
    <Row class="enter-x">
      <Col :span="12">
        <template v-for="scope in params.scopes" :key="scope">
          <FormItem>
            <!-- No logic, you need to deal with it yourself -->
            <Checkbox :checked="scope" size="small">
              <Button type="link" size="small">
                {{ formatScope(scope) }}
              </Button>
            </Checkbox>
          </FormItem>
        </template>
      </Col>
    </Row>

    <FormItem class="enter-x">
      <Button type="primary" size="large" block :loading="loading" @click="handleAuthorize(true)">
        {{ t('sys.login.loginButton') }}
      </Button>
      <Button size="large" class="mt-4 enter-x" block @click="handleAuthorize(false)">
        {{ t('common.cancelText') }}
      </Button>
    </FormItem>
  </Form>
</template>
