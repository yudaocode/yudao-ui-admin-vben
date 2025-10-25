<script setup lang="ts">
import type { MagicCubeProperty } from './config';

import { ref } from 'vue';

import { useVModel } from '@vueuse/core';

import ComponentContainerProperty from '../../component-container-property.vue';
import UploadImg from '#/components/upload/image-upload.vue';
