import { Component, inject, signal, TemplateRef, ViewChild, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, tap } from 'rxjs';
import { ExportService } from '../../services/export.service';
import { MemberService } from '../../services/member.service';


@Component({
  selector: 'app-donation-summary',
  templateUrl: './donation-summary.component.html',
  styleUrl: './donation-summary.component.scss',
  standalone: false
})
export class DonationSummaryComponent {


  loading = false;

  donationData$: Observable<any[]> | undefined;
  selectedDonarYear: any = null;
  donationSummary: any[] = [];
  memberForm: FormGroup | undefined;
  openSummaryModal = false;
  expandSummaryDetails = false;

  private modalService = inject(NgbModal);
  closeResult: WritableSignal<string> = signal('');

  @ViewChild('content', { static: true }) content!: TemplateRef<any>;

  constructor(
    private memberDataService: MemberService,
  ) {
  }

  async ngOnInit() {
    this.getTotalDonationSummary();
  }

  getTotalDonationSummary() {
    this.loading = true;
    this.memberDataService.getTotalDonation()
      .pipe(
        tap(data => {
          this.donationSummary = data || [];
          if (this.donationSummary.length > 0) {
            const currentSelected = this.memberDataService.getSelectedYear();
            if (!currentSelected) {
              this.selectedDonarYear = this.donationSummary[0].year;
              this.memberDataService.setSelectedYear(this.selectedDonarYear);
            } else {
              this.selectedDonarYear = currentSelected;
            }
          }
          this.loading = false;
        })
      ).subscribe();
  }

  selectYear(year: any) {
    this.selectedDonarYear = year;
    this.memberDataService.setSelectedYear(year);
  }

  getSelectedYearData() {
    return this.donationSummary.find(s => s.year === this.selectedDonarYear);
  }

  exportTableData(): void {
    this.memberDataService.downloadDonationData();
  }

}
