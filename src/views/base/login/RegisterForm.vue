<script lang="ts" setup>
import { computed, reactive, ref, unref } from 'vue'
import { Button, Checkbox, Form, Input } from 'ant-design-vue'
import LoginFormTitle from './LoginFormTitle.vue'
import { LoginStateEnum, useFormRules, useFormValid, useLoginState } from './useLogin'
import { StrengthMeter } from '@/components/StrengthMeter'
import { CountdownInput } from '@/components/CountDown'
import { useI18n } from '@/hooks/web/useI18n'

const FormItem = Form.Item
const InputPassword = Input.Password
const { t } = useI18n()
const { handleBackLogin, getLoginState } = useLoginState()

const formRef = ref()
const loading = ref(false)

const formData = reactive({
  account: '',
  password: '',
  confirmPassword: '',
  mobile: '',
  sms: '',
  policy: false,
})

const { getFormRules } = useFormRules(formData)
const { validForm } = useFormValid(formRef)

const getShow = computed(() => unref(getLoginState) === LoginStateEnum.REGISTER)

async function handleRegister() {
  const data = await validForm()
  if (!data)
    return
}
</script>

<template>
  <div v-if="getShow">
    <LoginFormTitle class="enter-x" />
    <Form ref="formRef" class="p-4 enter-x" :model="formData" :rules="getFormRules">
      <FormItem name="account" class="enter-x">
        <Input v-model:value="formData.account" class="fix-auto-fill" size="large" :placeholder="t('sys.login.userName')" />
      </FormItem>
      <FormItem name="mobile" class="enter-x">
        <Input v-model:value="formData.mobile" size="large" :placeholder="t('sys.login.mobile')" class="fix-auto-fill" />
      </FormItem>
      <FormItem name="sms" class="enter-x">
        <CountdownInput v-model:value="formData.sms" size="large" class="fix-auto-fill" :placeholder="t('sys.login.smsCode')" />
      </FormItem>
      <FormItem name="password" class="enter-x">
        <StrengthMeter v-model:value="formData.password" size="large" :placeholder="t('sys.login.password')" />
      </FormItem>
      <FormItem name="confirmPassword" class="enter-x">
        <InputPassword
          v-model:value="formData.confirmPassword"
          size="large"
          visibility-toggle
          :placeholder="t('sys.login.confirmPassword')"
        />
      </FormItem>

      <FormItem class="enter-x" name="policy">
        <!-- No logic, you need to deal with it yourself -->
        <Checkbox v-model:checked="formData.policy" size="small">
          {{ t('sys.login.policy') }}
        </Checkbox>
      </FormItem>

      <Button type="primary" class="enter-x" size="large" block :loading="loading" @click="handleRegister">
        {{ t('sys.login.registerButton') }}
      </Button>
      <Button size="large" block class="mt-4 enter-x" @click="handleBackLogin">
        {{ t('sys.login.backSignIn') }}
      </Button>
    </Form>
  </div>
</template>
