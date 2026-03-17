/// <reference types="@angular/localize" />

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { APP_CONFIG, AppConfig } from './app/app.config.service';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';


if (environment.production) {
  enableProdMode();
}

const appConfig = new AppConfig();
appConfig.applicationInsight = {
    instrumentationKey: "instrumentationKey",
    app: "WebApp"
}

platformBrowserDynamic([{ provide: APP_CONFIG, useValue: appConfig }])
    .bootstrapModule(AppModule).catch(err => console.error(err));
