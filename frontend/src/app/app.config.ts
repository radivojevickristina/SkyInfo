import {ApplicationConfig,provideBrowserGlobalErrorListeners,provideZoneChangeDetection} from '@angular/core'
import {provideRouter,withInMemoryScrolling} from '@angular/router'
import {provideHttpClient} from '@angular/common/http'
import {provideTranslateService} from '@ngx-translate/core'
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader'

import {routes} from './app.routes'

export const appConfig:ApplicationConfig={
  providers:[
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({eventCoalescing:true}),

    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration:'top'
      })
    ),

    provideHttpClient(),

    provideTranslateService({
      loader:provideTranslateHttpLoader({
        prefix:'/assets/i18n/',
        suffix:'.json'
      }),
      fallbackLang:'sr',
      lang:'sr'
    })
  ]
}