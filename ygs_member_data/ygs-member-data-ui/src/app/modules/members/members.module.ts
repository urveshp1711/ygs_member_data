import { AsyncPipe, CommonModule, DecimalPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MemberDataComponent } from '../../components/member-data/member-data.component';
import { MemberService } from '../../services/member.service';
import { InvoiceGeneratorComponent } from '../../components/invoice-generator/invoice-generator.component';
import { GetFamiltyTreeComponent } from '../../components/get-familty-tree/get-familty-tree.component';
import { AppFamilyNodeComponent } from '../../components/common/app-family-node/app-family-node.component';
import { DonationSummaryComponent } from '../../components/donation-summary/donation-summary.component';

@NgModule({
  declarations: [MemberDataComponent, InvoiceGeneratorComponent, GetFamiltyTreeComponent, AppFamilyNodeComponent, DonationSummaryComponent],
  imports: [
    CommonModule,
    NgbModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
  ],
  exports: [
    MemberDataComponent,
    DonationSummaryComponent,
  ],
  providers: [
    MemberService
  ]
})
export class MembersModule { }
