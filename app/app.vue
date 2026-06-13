<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
useHead({
  link: [
    { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon.png' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
  ],
  meta: [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: 'GS Sim' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'theme-color', content: '#1a1a2e' },
    { name: 'msapplication-TileImage', content: '/icons/icon-144x144.png' },
    { name: 'msapplication-TileColor', content: '#1a1a2e' },
  ],
});
</script>
