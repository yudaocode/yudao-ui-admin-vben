<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from '@/hooks/web/useI18n'
import { useDesign } from '@/hooks/web/useDesign'
import { BasicForm, useForm } from '@/components/Form'
import { BasicModal, useModalInner } from '@/components/Modal'
import { useUserStore } from '@/store/modules/user'
import { useLockStore } from '@/store/modules/lock'
import headerImg from '@/assets/images/header.jpg'

defineOptions({ name: 'LockModal' })

const { t } = useI18n()
const { prefixCls } = useDesign('header-lock-modal')
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
  <BasicModal :footer="null" width="25%" :title="t('layout.header.lockScreen')" v-bind="$attrs" :class="prefixCls" @register="register">
    <div :class="`${prefixCls}__entry`">
      <div :class="`${prefixCls}__header`">
        <img :src="avatar" :class="`${prefixCls}__header-img`">
        <p :class="`${prefixCls}__header-name`">
          {{ getRealName }}
        </p>
      </div>

      <BasicForm @register="registerForm" />

      <div :class="`${prefixCls}__footer`">
        <a-button type="primary" block class="mt-2" @click="handleLock">
          {{ t('layout.header.lockScreenBtn') }}
        </a-button>
      </div>
    </div>
  </BasicModal>
</template>

<style lang="less">
@prefix-cls: ~'@{namespace}-header-lock-modal';

.@{prefix-cls} {
  &__entry {
    position: relative;
    //height: 240px;
    padding: 130px 30px 30px;
    border-radius: 10px;
  }

  &__header {
    position: absolute;
    top: 0;
    left: calc(50% - 45px);
    width: auto;
    text-align: center;

    &-img {
      width: 70px;
      border-radius: 50%;
    }

    &-name {
      margin-top: 5px;
    }
  }

  &__footer {
    margin-top: 16px;
    text-align: center;
  }
}
</style>
