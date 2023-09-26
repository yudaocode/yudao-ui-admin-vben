<script lang="ts" setup>
import { computed, reactive, ref, unref } from 'vue'
import { Form, Input } from 'ant-design-vue'
import LoginFormTitle from './LoginFormTitle.vue'
import { LoginStateEnum, useFormRules, useLoginState } from './useLogin'
import { CountdownInput } from '@/components/CountDown'
import { useI18n } from '@/hooks/web/useI18n'

const FormItem = Form.Item
const { t } = useI18n()
const { handleBackLogin, getLoginState } = useLoginState()
const { getFormRules } = useFormRules()

const formRef = ref()
const loading = ref(false)

const formData = reactive({
  account: '',
  mobile: '',
  sms: '',
})

const getShow = computed(() => unref(getLoginState) === LoginStateEnum.RESET_PASSWORD)

async function handleReset() {
  const form = unref(formRef)
  if (!form)
    return
  await form.resetFields()
}
</script>

<template>
  <template v-if="getShow">
    <LoginFormTitle class="enter-x" />
    <Form ref="formRef" class="enter-x p-4" :model="formData" :rules="getFormRules">
      <FormItem name="account" class="enter-x">
        <Input v-model:value="formData.account" size="large" :placeholder="t('sys.login.userName')" />
      </FormItem>

      <FormItem name="mobile" class="enter-x">
        <Input v-model:value="formData.mobile" size="large" :placeholder="t('sys.login.mobile')" />
      </FormItem>
      <FormItem name="sms" class="enter-x">
        <CountdownInput v-model:value="formData.sms" size="large" :placeholder="t('sys.login.smsCode')" />
      </FormItem>

      <FormItem class="enter-x">
        <a-button type="primary" size="large" block :loading="loading" @click="handleReset">
          {{ t('common.resetText') }}
        </a-button>
        <a-button size="large" block class="mt-4" @click="handleBackLogin">
          {{ t('sys.login.backSignIn') }}
        </a-button>
      </FormItem>
    </Form>
  </template>
</template>
