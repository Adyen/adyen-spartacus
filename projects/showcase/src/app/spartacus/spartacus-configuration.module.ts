import { NgModule } from '@angular/core';
import { translationChunksConfig, translationsEn } from "@spartacus/assets";
import { 
  AuthConfig, 
  FeaturesConfig, 
  I18nConfig, 
  OccConfig, 
  provideConfig, 
  SiteContextConfig 
} from "@spartacus/core";
import { CartConfig } from "@spartacus/cart/base/root";
import { adyenCartValidationTranslationsEn } from "@adyen/adyen-spartacus";
import { defaultCmsContentProviders, layoutConfig, mediaConfig } from "@spartacus/storefront";

@NgModule({
  declarations: [],
  imports: [],
  providers: [
    provideConfig(layoutConfig), 
    provideConfig(mediaConfig), 
    ...defaultCmsContentProviders, 
    
    provideConfig(<OccConfig>{
      backend: {
        occ: {
          baseUrl: 'https://localhost:9002',
        }
      },
    }), 

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

    provideConfig(<SiteContextConfig>{
      context: {},
    }), 
    
    provideConfig(<I18nConfig>{
      i18n: {
        resources: { en: translationsEn },
        chunks: translationChunksConfig,
        fallbackLang: 'en'
      },
    }), 
    
    provideConfig(<FeaturesConfig>{
    }),

    // Static resources: merge the library's cart-validation texts into the `cart` chunk (see library README)
    provideConfig(<I18nConfig>{
      i18n: {
        resources: { en: { cart: adyenCartValidationTranslationsEn } }
      },
    }),

    // Required for the Adyen duplicate-subscription messages to surface on checkout start (see library README)
    provideConfig(<CartConfig>{
      cart: {
        validation: {
          enabled: true
        }
      }
    })
  ]
})
export class SpartacusConfigurationModule { }