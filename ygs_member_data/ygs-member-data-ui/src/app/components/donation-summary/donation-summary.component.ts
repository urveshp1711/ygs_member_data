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
  expandSummaryDetails = false

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

  viewYearwiseSummary(year: any) {

    if (year != this.selectedDonarYear) {

      this.selectedDonarYear = year;

      this.expandSummaryDetails = !this.expandSummaryDetails ? true : this.expandSummaryDetails;
      this.loading = true;
      this.donationData$ = this.memberDataService.getDonationData(year).pipe(
        tap(data => {
          let dialogElement: HTMLElement | null = document.querySelector('.modal-content');
          if (dialogElement) dialogElement.style.overflow = 'auto';
          this.loading = false;
        })
      );
    } else {
      this.expandSummaryDetails = !this.expandSummaryDetails;
    }

  }


  getTotalDonationSummary() {
    this.loading = true;
    this.memberDataService.getTotalDonation()
      .pipe(
        tap(data => {
          // Here we push the data into the array
          if ((data || []).length > 0) {
            this.donationSummary = data;
            this.donationSummary.forEach((item: any) => {
              //item.year = moment(item.year).format('DD-MM-YYYY');
            });
          }
          else {
            this.donationSummary = [{
              totalDonation: 0,
              totalEntries: 0,
              avgDonation: 0,
              year: null
            }];
          }

          this.loading = false;          

        })
      ).subscribe();
  }

  exportTableData(): void {
    this.memberDataService.downloadDonationData();
  }

}
