<script lang="ts" setup>
import { computed } from 'vue'
import { Badge, Tooltip } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { Icon } from '@/components/Icon'

import { useI18n } from '@/hooks/web/useI18n'
import { useErrorLogStore } from '@/store/modules/errorLog'
import { PageEnum } from '@/enums/pageEnum'

defineOptions({ name: 'ErrorAction' })

const { t } = useI18n()
const { push } = useRouter()
const errorLogStore = useErrorLogStore()

const getCount = computed(() => errorLogStore.getErrorLogListCount)

function handleToErrorList() {
  push(PageEnum.ERROR_LOG_PAGE).then(() => {
    errorLogStore.setErrorLogListCount(0)
  })
}
</script>

<template>
  <Tooltip :title="t('layout.header.tooltipErrorLog')" placement="bottom" :mouse-enter-delay="0.5" @click="handleToErrorList">
    <Badge :count="getCount" :offset="[0, 10]" :overflow-count="99">
      <Icon icon="ion:bug-outline" />
    </Badge>
  </Tooltip>
</template>
