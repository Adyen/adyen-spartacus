import { NgModule } from '@angular/core';
import { translationChunksConfig, translationsEn } from "@spartacus/assets";
import { 
  AuthConfig, // [!] Import AuthConfig
  FeaturesConfig, 
  I18nConfig, 
  OccConfig, 
  provideConfig, 
  SiteContextConfig 
} from "@spartacus/core";
import { defaultCmsContentProviders, layoutConfig, mediaConfig } from "@spartacus/storefront";

@NgModule({
  declarations: [],
  imports: [],
  providers: [
    provideConfig(layoutConfig), 
    provideConfig(mediaConfig), 
    ...defaultCmsContentProviders, 
    
    // 1. OCC Configuration
    provideConfig(<OccConfig>{
      backend: {
        occ: {
          baseUrl: 'https://localhost:9002',
        }
      },
    }), 

    // 2. Authentication Configuration (The Fix)
    provideConfig(<AuthConfig>{
      authentication: {
        client_id: 'mobile_android', 
        client_secret: 'secret',
        baseUrl: 'https://localhost:9002',

        tokenEndpoint: '/authorizationserver/oauth/token',
        loginUrl: '/authorizationserver/oauth/authorize',
        revokeEndpoint: '/authorizationserver/oauth/revoke',
        redirectUri: 'http://localhost:4200/electronics-spa/', 
        
        OAuthLibConfig: {
          responseType: 'code', 
          scope: 'openid basic', 
          
          oidc: true, 
          disablePKCE: false, 
          redirectUri: 'http://localhost:4200/electronics-spa/',
          
          customTokenParameters: ['token_format=jwt'], 
        }
      }
    }),

    // 3. Context Configuration
    provideConfig(<SiteContextConfig>{
      context: {},
    }), 
    
    // 4. I18n Configuration
    provideConfig(<I18nConfig>{
      i18n: {
        resources: { en: translationsEn },
        chunks: translationChunksConfig,
        fallbackLang: 'en'
      },
    }), 
    
    provideConfig(<FeaturesConfig>{
    })
  ]
})
export class SpartacusConfigurationModule { }