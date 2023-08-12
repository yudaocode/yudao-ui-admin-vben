<script lang="ts" setup>
import { computed, ref } from 'vue'
import { Input } from 'ant-design-vue'
import { LockOutlined } from '@ant-design/icons-vue'
import { useNow } from './useNow'
import { useUserStore } from '@/store/modules/user'
import { useLockStore } from '@/store/modules/lock'
import { useI18n } from '@/hooks/web/useI18n'
import { useDesign } from '@/hooks/web/useDesign'
import headerImg from '@/assets/images/header.jpg'

const InputPassword = Input.Password

const password = ref('')
const loading = ref(false)
const errMsg = ref(false)
const showDate = ref(true)

const { prefixCls } = useDesign('lock-page')
const lockStore = useLockStore()
const userStore = useUserStore()

const { hour, month, minute, meridiem, year, day, week } = useNow(true)

const { t } = useI18n()

const userinfo = computed(() => {
  return userStore.getUserInfo || {}
})

/**
 * @description: unLock
 */
async function unLock() {
  if (!password.value)
    return

  const pwd = password.value
  try {
    loading.value = true
    const res = await lockStore.unLock(pwd)
    errMsg.value = !res
  }
  finally {
    loading.value = false
  }
}

function goLogin() {
  userStore.logout(true)
  lockStore.resetLockInfo()
}

function handleShowForm(show = false) {
  showDate.value = show
}
</script>

<template>
  <div :class="prefixCls" class="fixed inset-0 flex h-screen w-screen bg-black items-center justify-center" @click="handleShowForm(false)">
    <!-- eslint-disable max-len -->
    <div
      v-show="showDate"
      :class="`${prefixCls}__unlock`"
      class="absolute top-0 left-1/2 flex pt-5 h-16 items-center justify-center sm:text-md xl:text-xl flex-col cursor-pointer transform translate-x-1/2"
    >
      <LockOutlined />
      <span>{{ t('sys.lock.unlock') }}</span>
    </div>

    <div class="flex w-screen h-screen justify-center items-center">
      <div :class="`${prefixCls}__hour`" class="relative mr-5 md:mr-20 w-2/5 h-2/5 md:h-4/5">
        <span>{{ hour }}</span>
        <span v-show="showDate" class="meridiem absolute left-5 top-5 text-md xl:text-xl">
          {{ meridiem }}
        </span>
      </div>
      <div :class="`${prefixCls}__minute w-2/5 h-2/5 md:h-4/5 `">
        <span> {{ minute }}</span>
      </div>
    </div>
    <transition name="fade-slide">
      <div v-show="!showDate" :class="`${prefixCls}-entry`">
        <div :class="`${prefixCls}-entry-content`">
          <div :class="`${prefixCls}-entry__header enter-x`">
            <img :src="userinfo.user.avatar || headerImg" :class="`${prefixCls}-entry__header-img`">
            <p :class="`${prefixCls}-entry__header-name`">
              {{ userinfo.user.nickname }}
            </p>
          </div>
          <InputPassword v-model:value="password" :placeholder="t('sys.lock.placeholder')" class="enter-x" />
          <span v-if="errMsg" :class="`${prefixCls}-entry__err-msg enter-x`">
            {{ t('sys.lock.alert') }}
          </span>
          <div :class="`${prefixCls}-entry__footer enter-x`">
            <a-button type="link" size="small" class="mt-2 mr-2 enter-x" :disabled="loading" @click="handleShowForm(true)">
              {{ t('common.back') }}
            </a-button>
            <a-button type="link" size="small" class="mt-2 mr-2 enter-x" :disabled="loading" @click="goLogin">
              {{ t('sys.lock.backToLogin') }}
            </a-button>
            <a-button class="mt-2" type="link" size="small" :loading="loading" @click="unLock()">
              {{ t('sys.lock.entry') }}
            </a-button>
          </div>
        </div>
      </div>
    </transition>

    <div class="absolute bottom-5 w-full text-gray-300 xl:text-xl 2xl:text-3xl text-center enter-y">
      <div v-show="!showDate" class="text-5xl mb-4 enter-x">
        {{ hour }}:{{ minute }} <span class="text-3xl">{{ meridiem }}</span>
      </div>
      <div class="text-2xl">
        {{ year }}/{{ month }}/{{ day }} {{ week }}
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-lock-page';

.@{prefix-cls} {
  z-index: @lock-page-z-index;

  &__unlock {
    transform: translate(-50%, 0);
  }

  &__hour,
  &__minute {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #bababa;
    background-color: #141313;
    border-radius: 30px;

    @media screen and (max-width: @screen-md) {
      span:not(.meridiem) {
        font-size: 160px;
      }
    }

    @media screen and (min-width: @screen-md) {
      span:not(.meridiem) {
        font-size: 160px;
      }
    }

    @media screen and (max-width: @screen-sm) {
      span:not(.meridiem) {
        font-size: 90px;
      }
    }

    @media screen and (min-width: @screen-lg) {
      span:not(.meridiem) {
        font-size: 220px;
      }
    }

    @media screen and (min-width: @screen-xl) {
      span:not(.meridiem) {
        font-size: 260px;
      }
    }

    @media screen and (min-width: @screen-2xl) {
      span:not(.meridiem) {
        font-size: 320px;
      }
    }
  }

  &-entry {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: rgb(0 0 0 / 50%);
    backdrop-filter: blur(8px);

    &-content {
      width: 260px;
    }

    &__header {
      text-align: center;

      &-img {
        width: 70px;
        margin: 0 auto;
        border-radius: 50%;
      }

      &-name {
        margin-top: 5px;
        font-weight: 500;
        color: #bababa;
      }
    }

    &__err-msg {
      display: inline-block;
      margin-top: 10px;
    }

    &__footer {
      display: flex;
      justify-content: space-between;
    }
  }
}
</style>
