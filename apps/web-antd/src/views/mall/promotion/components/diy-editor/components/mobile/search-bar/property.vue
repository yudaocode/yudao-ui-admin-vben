<script setup lang="ts">
import type { SearchProperty } from './config';

import { watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { isString } from '@vben/utils';

import { useVModel } from '@vueuse/core';
