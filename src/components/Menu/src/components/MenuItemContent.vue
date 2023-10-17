<script lang="ts" setup>
import { computed } from 'vue'
import { contentProps } from '../props'
import { Icon } from '@/components/Icon'
import { useI18n } from '@/hooks/web/useI18n'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'MenuItemContent' })

const props = defineProps(contentProps)

const { t } = useI18n()

const { prefixCls } = useDesign('basic-menu-item-content')
const getI18nName = computed(() => t(props.item?.name))
const getIcon = computed(() => (props.item?.img ? undefined : props.item?.icon))
const getImg = computed(() => props.item?.img)
</script>

<template>
  <span :class="`${prefixCls}- flex items-center `">
    <img v-if="getImg" :src="getImg" class="mr-2 h-18px w-18px align-top">
    <Icon v-if="getIcon" :icon="getIcon" :size="18" :class="`${prefixCls}-wrapper__icon mr-2`" />
    {{ getI18nName }}
  </span>
</template>
