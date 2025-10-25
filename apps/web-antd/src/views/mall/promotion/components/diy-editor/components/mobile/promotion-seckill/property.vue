<script setup lang="ts">
import type { PromotionSeckillProperty } from './config';

import type { MallSeckillActivityApi } from '#/api/mall/promotion/seckill/seckillActivity';

import { onMounted, ref } from 'vue';

import { CommonStatusEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { useVModel } from '@vueuse/core';
