<script lang="ts" setup>
import { computed } from 'vue'
import SSOForm from './SSOForm.vue'
import { AppDarkModeToggle, AppLocalePicker, AppLogo } from '@/components/Application'
import { useGlobSetting } from '@/hooks/setting'
import { useI18n } from '@/hooks/web/useI18n'
import { useDesign } from '@/hooks/web/useDesign'
import { useLocaleStore } from '@/store/modules/locale'

defineProps({
  sessionTimeout: {
    type: Boolean,
  },
})

const globSetting = useGlobSetting()
const { prefixCls } = useDesign('login')
const { t } = useI18n()
const localeStore = useLocaleStore()
const showLocale = localeStore.getShowPicker
const title = computed(() => globSetting?.title ?? '')
</script>

<template>
  <div :class="prefixCls" class="relative h-full w-full px-4">
    <div class="absolute right-4 top-4 flex items-center">
      <AppDarkModeToggle v-if="!sessionTimeout" class="enter-x mr-2" />
      <AppLocalePicker v-if="!sessionTimeout && showLocale" class="enter-x text-white xl:text-gray-600" :show-text="false" />
    </div>

    <span class="-enter-x xl:hidden">
      <AppLogo :always-show-title="true" />
    </span>

    <div class="relative mx-auto h-full py-2 container sm:px-10">
      <div class="h-full flex">
        <div class="mr-4 hidden min-h-full pl-4 xl:w-6/12 xl:flex xl:flex-col">
          <AppLogo class="-enter-x" />
          <div class="my-auto">
            <img :alt="title" src="@/assets/svg/login-box-bg.svg" class="-enter-x w-1/2 -mt-16">
            <div class="-enter-x mt-10 font-medium text-white">
              <span class="mt-4 inline-block text-3xl"> {{ t('sys.login.signInTitle') }}</span>
            </div>
            <div class="-enter-x mt-5 font-normal text-white dark:text-gray-500">
              {{ t('sys.login.signInDesc') }}
            </div>
          </div>
        </div>
        <div class="h-full w-full flex py-5 xl:my-0 xl:h-auto xl:w-6/12 xl:py-0">
          <!-- eslint-disable max-len -->
          <div
            :class="`${prefixCls}-form`"
            class="enter-x relative mx-auto my-auto w-full rounded-md px-5 py-8 shadow-md xl:ml-16 lg:w-2/4 sm:w-3/4 xl:w-auto xl:bg-transparent xl:p-4 sm:px-8 xl:shadow-none"
          >
            <SSOForm />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less">
@prefix-cls: ~'@{namespace}-login';
@logo-prefix-cls: ~'@{namespace}-app-logo';
@countdown-prefix-cls: ~'@{namespace}-countdown-input';
@dark-bg: #293146;

html[data-theme='dark'] {
  .@{prefix-cls} {
    background-color: @dark-bg;

    &::before {
      background-image: url('@/assets/svg/login-bg-dark.svg');
    }

    .ant-input,
    .ant-input-password {
      background-color: #232a3b;
    }

    .ant-btn:not(.ant-btn-link, .ant-btn-primary) {
      border: 1px solid #4a5569;
    }

    &-form {
      background: transparent !important;
    }

    .app-iconify {
      color: #fff;
    }
  }

  input.fix-auto-fill,
  .fix-auto-fill input {
    -webkit-text-fill-color: #c9d1d9 !important;
    box-shadow: inherit !important;
  }
}

.@{prefix-cls} {
  min-height: 100%;
  overflow: hidden;

  @media (max-width: @screen-xl) {
    background-color: #293146;

    .@{prefix-cls}-form {
      background-color: #fff;
    }
  }

  &::before {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin-left: -48%;
    content: '';
    background-image: url('@/assets/svg/login-bg.svg');
    background-repeat: no-repeat;
    background-position: 100%;
    background-size: auto 100%;

    @media (max-width: @screen-xl) {
      display: none;
    }
  }

  .@{logo-prefix-cls} {
    position: absolute;
    top: 12px;
    height: 30px;

    &__title {
      font-size: 16px;
      color: #fff;
    }

    img {
      width: 32px;
    }
  }

  .container {
    .@{logo-prefix-cls} {
      display: flex;
      width: 60%;
      height: 80px;

      &__title {
        font-size: 24px;
        color: #fff;
      }

      img {
        width: 48px;
      }
    }
  }

  &-sign-in-way {
    .anticon {
      font-size: 22px;
      color: #888;
      cursor: pointer;
    }
  }

  input:not([type='checkbox']) {
    min-width: 360px;

    @media (max-width: @screen-xl) {
      min-width: 320px;
    }

    @media (max-width: @screen-lg) {
      min-width: 260px;
    }

    @media (max-width: @screen-md) {
      min-width: 240px;
    }

    @media (max-width: @screen-sm) {
      min-width: 160px;
    }
  }

  .@{countdown-prefix-cls} input {
    min-width: unset;
  }

  .ant-divider-inner-text {
    font-size: 12px;
  }
}
</style>
