<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { useUserStore } from '@/store/modules/user'
import { useLockStore } from '@/store/modules/lock'
import headerImg from '@/assets/images/header.jpg'

defineOptions({ name: 'LockModal' })

const { t } = useI18n()
const userStore = useUserStore()
const lockStore = useLockStore()

const getRealName = computed(() => userStore.getUserInfo?.user.nickname)
const [register, { closeModal }] = useModalInner()

const [registerForm, { validateFields, resetFields }] = useForm({
  showActionButtonGroup: false,
  schemas: [
    {
      field: 'password',
      label: t('layout.header.lockScreenPassword'),
      colProps: {
        span: 24,
      },
      component: 'InputPassword',
      required: true,
    },
  ],
})

async function handleLock() {
  const values = (await validateFields()) as any
  const password: string | undefined = values.password
  closeModal()

  lockStore.setLockInfo({
    isLock: true,
    pwd: password,
  })
  await resetFields()
}

const avatar = computed(() => {
  const { avatar } = userStore.getUserInfo.user
  return avatar || headerImg
})
</script>

<template>
  <BasicModal :footer="null" width="25%" :title="t('layout.header.lockScreen')" v-bind="$attrs" @register="register">
    <div class="relative rounded-10 px-8 pb-8 pt-30">
      <div class="absolute left-[calc(50%-45px)] top-0 w-auto text-center">
        <img :src="avatar" class="w-18 rounded-50%">
        <p class="mt-2">
          {{ getRealName }}
        </p>
      </div>

      <BasicForm @register="registerForm" />

      <div class="mt-4 text-center">
        <a-button type="primary" block class="mt-2" @click="handleLock">
          {{ t('layout.header.lockScreenBtn') }}
        </a-button>
      </div>
    </div>
  </BasicModal>
</template>
