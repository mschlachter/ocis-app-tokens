import {
  defineWebApplication,
  ApplicationSetupOptions,
  Extension,
  AppMenuItemExtension
} from '@ownclouders/web-pkg'
import { urlJoin } from '@ownclouders/web-client'
import { RouteRecordRaw } from 'vue-router'
import { computed, h } from 'vue'
import { useGettext } from 'vue3-gettext'
import { AppTokensConfigSchema } from './types'
import App from './App.vue'

export default defineWebApplication({
  setup({ applicationConfig }: ApplicationSetupOptions) {
    const { $gettext } = useGettext()

    const appInfo = {
      id: 'ocis-app-tokens',
      name: $gettext('App Tokens'),
      icon: 'key-2',
      color: '#5A0001'
    }

    const { enableCustomLabels } = AppTokensConfigSchema.parse(applicationConfig);

    const routes: RouteRecordRaw[] = [
      {
        path: '/',
        redirect: `/${appInfo.id}/tokens`
      },
      {
        path: '/tokens',
        name: 'tokens',
        component: h(App, { enableCustomLabels }),
        meta: {
          authContext: 'user',
          title: $gettext('App Tokens')
        }
      }
    ]

    const extensions = computed<Extension[]>(() => {
      const menuItems: AppMenuItemExtension[] = [
        {
          id: `app.${appInfo.id}.menuItem`,
          type: 'appMenuItem',
          label: () => appInfo.name,
          color: appInfo.color,
          icon: appInfo.icon,
          path: urlJoin(appInfo.id)
        }
      ]
      return [...menuItems]
    })

    return {
      appInfo,
      routes,
      extensions: extensions
    }
  }
})
