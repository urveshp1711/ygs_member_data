import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule, } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AsyncPipe, DecimalPipe, LocationStrategy, PathLocationStrategy } from '@angular/common';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from './components/login/login.component';
import { AuthInterceptor } from './interceptor/http-interceptor';
import { MembersModule } from './modules/members/members.module';
import { MenuComponent } from './components/common/app-family-node/menu/menu.component';
import { ToastsContainer } from './components/common/toasts-container.component';

@NgModule({
    imports: [
        MembersModule,
        BrowserModule,
        FormsModule,
        AppRoutingModule,
        HttpClientModule,
        BrowserAnimationsModule,
        NgbModule,
        ReactiveFormsModule,
        ToastsContainer,
    ],
    declarations: [AppComponent, LoginComponent, MenuComponent],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        {
            provide: LocationStrategy,
            useClass: PathLocationStrategy,
        },
        DecimalPipe,
        AsyncPipe,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    bootstrap: [AppComponent],
})
export class AppModule { }
