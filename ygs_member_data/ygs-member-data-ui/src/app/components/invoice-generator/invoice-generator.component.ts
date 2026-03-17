import { Component, inject, signal, TemplateRef, ViewChild, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { debounceTime, distinctUntilChanged, filter, Observable, tap, of } from 'rxjs';
import { ExportService } from '../../services/export.service';
import { MemberService } from '../../services/member.service';
import { ToastService } from '../../services/toast-service';

@Component({
  selector: 'app-invoice-generator',
  templateUrl: './invoice-generator.component.html',
  styleUrl: './invoice-generator.component.scss',
  standalone: false
})
export class InvoiceGeneratorComponent {

  loading = false;
  searchingMember = false;
  loadingTransactions = false;

  donationData$: Observable<any[]> | undefined;
  selectedDonarYear: any = null;
  donationSummary: any[] = [];
  transactions: any[] = [];
  memberForm: FormGroup | undefined;
  openSummaryModal = false;
  expandSummaryDetails = false;

  sortColumn = 'PaymentDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  months = [
    { value: 0, name: 'January' }, { value: 1, name: 'February' }, { value: 2, name: 'March' },
    { value: 3, name: 'April' }, { value: 4, name: 'May' }, { value: 5, name: 'June' },
    { value: 6, name: 'July' }, { value: 7, name: 'August' }, { value: 8, name: 'September' },
    { value: 9, name: 'October' }, { value: 10, name: 'November' }, { value: 11, name: 'December' }
  ];

  years: number[] = [];

  private modalService: NgbModal = inject(NgbModal);
  private toastService = inject(ToastService);
  closeResult: WritableSignal<string> = signal('');

  @ViewChild('content', { static: true }) content!: TemplateRef<any>;

  constructor(
    private router: Router,
    private memberDataService: MemberService,
    private exportService: ExportService,
    private formBuilder: FormBuilder) {
  }

  onSignout() {
    localStorage.removeItem('session-timeout');
    this.router.navigate(['/']);
  }

  async ngOnInit() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 5; i++) {
      this.years.push(i);
    }

    this.memberForm = this.formBuilder.group({
      memberId: [null, [Validators.required]],
      amount: [0, [Validators.required, Validators.min(1)]],
      name: ['', [Validators.required]],
      mobile: [''],
      paymentType: ['રોકડા', [Validators.required]],
      paymentNo: [''],
      fromMonth: [new Date().getMonth()],
      fromYear: [currentYear],
      toMonth: [new Date().getMonth()],
      toYear: [currentYear]
    });

    this.memberForm.controls.paymentNo.disable();
    this.setupAutoFetch();
    this.setupFeeCalculation();
  }

  setupFeeCalculation() {
    const calculationFields = ['fromMonth', 'fromYear', 'toMonth', 'toYear'];
    calculationFields.forEach(field => {
      this.memberForm?.get(field)?.valueChanges.subscribe(() => {
        this.calculateFee();
      });
    });
  }

  calculateFee() {
    const form = this.memberForm?.getRawValue();
    if (!form) return;

    const start = moment([form.fromYear, form.fromMonth]);
    const end = moment([form.toYear, form.toMonth]);

    if (end.isBefore(start)) {
      this.memberForm?.patchValue({ amount: 0 }, { emitEvent: false });
      return;
    }

    // Calculate difference in months (inclusive)
    const months = end.diff(start, 'months') + 1;
    const feePerMonth = 100;
    this.memberForm?.patchValue({ amount: months * feePerMonth }, { emitEvent: false });
  }

  setupAutoFetch() {
    this.memberForm?.get('memberId')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      filter(value => !!value)
    ).subscribe(value => {
      this.searchMember();
    });
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
          this.open(this.content);

        })
      ).subscribe();
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
  }

  compare(v1: string | number | null | undefined, v2: string | number | null | undefined) {
    if (v1 == null) v1 = '';
    if (v2 == null) v2 = '';

    if (typeof v1 === 'string' && typeof v2 === 'string') {
      const numericV1 = parseFloat(v1);
      const numericV2 = parseFloat(v2);
      if (!isNaN(numericV1) && !isNaN(numericV2) && v1.match(/^\d+/) && v2.match(/^\d+/)) {
        return numericV1 < numericV2 ? -1 : numericV1 > numericV2 ? 1 : 0;
      }
      return v1.localeCompare(v2, undefined, { numeric: true, sensitivity: 'base' });
    }
    return (v1 as any) < (v2 as any) ? -1 : (v1 as any) > (v2 as any) ? 1 : 0;
  }

  applySort() {
    if (this.sortColumn) {
      this.transactions.sort((a, b) => {
        const res = this.compare(a[this.sortColumn], b[this.sortColumn]);
        return this.sortDirection === 'asc' ? res : -res;
      });
    }
    this.donationData$ = of([...this.transactions]);
  }

  onSubmit() {
    const req = this.memberForm?.getRawValue();
    this.downloadSlip(req, 'Association Fee generated and added successfully!', false);
  }

  onReset(): void {
    this.memberForm!.reset();
    this.memberForm?.patchValue({
      paymentType: 'રોકડા',
      amount: 0,
      fromMonth: new Date().getMonth(),
      fromYear: new Date().getFullYear(),
      toMonth: new Date().getMonth(),
      toYear: new Date().getFullYear()
    })
  }

  exportTableData(): void {
    this.memberDataService.downloadDonationData();
  }

  async openSummary() {
    this.expandSummaryDetails = false;
    this.getTotalDonationSummary();
  }

  open(content: TemplateRef<any>, addDialog = false) {

    this.modalService.open(content, { size: 'xl', scrollable: true }).result.then(
      (result) => {
        this.closeResult.set(`Closed with: ${result}`);
      },
      (reason) => {
        this.closeResult.set(`Dismissed ${this.getDismissReason(reason)}`);
      },
    );
  }

  viewYearwiseSummary(year: any) {

    if (year != this.selectedDonarYear) {

      this.selectedDonarYear = year;

      this.expandSummaryDetails = !this.expandSummaryDetails ? true : this.expandSummaryDetails;
      this.loadingTransactions = true;
      this.memberDataService.getDonationData(year).subscribe(data => {
        this.transactions = data;
        this.applySort();
        let dialogElement: HTMLElement | null = document.querySelector('.modal-content');
        if (dialogElement) dialogElement.style.overflow = 'auto';
        this.loadingTransactions = false;
      });
    } else {
      this.expandSummaryDetails = !this.expandSummaryDetails;
    }

  }


  private getDismissReason(reason: any): string {
    switch (reason) {
      case ModalDismissReasons.ESC:
        return 'by pressing ESC';
      case ModalDismissReasons.BACKDROP_CLICK:
        return 'by clicking on a backdrop';
      default:
        return `with: ${reason}`;
    }
  }

  onMemberPage() {
    this.router.navigate(['/member']);
  }

  async generateSlip() {
    const req = this.memberForm?.getRawValue();
    this.downloadSlip(req, 'Association Fee slip generated successfully!');
  }

  downloadSlip(req: any, message, generateOnly = true) {
    this.loading = true;
    this.memberDataService.depositeAmount({ ...req, generateOnly: generateOnly })
      .pipe(
        tap((response: Blob) => {
          this.toastService.show({ template: message, classname: 'bg-success text-light', delay: 5000 });
          this.loading = false;
        }),
      ).subscribe(
        (response: Blob) => {
          const blob = new Blob([response], { type: 'image/jpeg' }); // or other file type
          const url = window.URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = `${req.name}.jpg`; // 📝 your custom filename here
          document.body.appendChild(a);
          a.click();

          // Cleanup
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        (error) => {
          console.error('Download error:', error);
        }
      );
  }

  onPaymentTypeChange(event) {
    const paymentType = event.target.value;
    if (paymentType === 'રોકડા') {
      this.memberForm?.get('paymentNo')?.setValue(null);
      this.memberForm?.controls.paymentNo.disable();
    }
    else {
      this.memberForm?.controls.paymentNo.enable();
    }
  }

  searchMember() {
    const memberId = this.memberForm?.get('memberId')?.value;
    this.searchingMember = true;
    this.memberDataService.getMemberByMemberId(memberId).subscribe({
      next: (data) => {
        if (data) {
          this.memberForm?.patchValue({
            name: data.Name,
            mobile: data.Mobile
          });
          this.toastService.show({ template: 'Member details fetched successfully!', classname: 'bg-success text-light', delay: 3000 });
        } else {
          this.onReset();
          this.memberForm?.patchValue({ memberId: memberId });
          this.toastService.show({ template: 'Member not found', classname: 'bg-warning text-dark', delay: 3000 });
        }
        this.searchingMember = false;
      },
      error: (err) => {
        console.error('Error fetching member:', err);
        this.onReset();
        this.memberForm?.patchValue({ memberId: memberId });
        this.toastService.show({ template: 'Error fetching member details', classname: 'bg-danger text-light', delay: 3000 });
        this.searchingMember = false;
      }
    });
  }
}
