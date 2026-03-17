import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MemberDataComponent } from './components/member-data/member-data.component';
import { LoginComponent } from './components/login/login.component';
import { InvoiceGeneratorComponent } from './components/invoice-generator/invoice-generator.component';
import { GetFamiltyTreeComponent } from './components/get-familty-tree/get-familty-tree.component';
import { DonationSummaryComponent } from './components/donation-summary/donation-summary.component';
import { DonationOverviewComponent } from './components/donation-summary/overview/overview.component';
import { DonationTransactionsComponent } from './components/donation-summary/transactions/transactions.component';

const routes: Routes = [
    { path: '', component: LoginComponent, data: { hideMenu: true } }, // Default route
    { path: 'member', component: MemberDataComponent },
    {
        path: 'donation-summary',
        component: DonationSummaryComponent,
        children: [
            { path: '', redirectTo: 'overview', pathMatch: 'full' },
            { path: 'overview', component: DonationOverviewComponent },
            { path: 'transactions', component: DonationTransactionsComponent },
        ]
    },
    { path: 'mng-donation', component: InvoiceGeneratorComponent },
    { path: 'family-tree', component: GetFamiltyTreeComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
