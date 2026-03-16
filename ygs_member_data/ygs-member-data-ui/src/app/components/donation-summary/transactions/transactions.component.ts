import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberService } from '~/services/member.service';
import { Observable, tap, of } from 'rxjs';
import { ToastService } from '~/services/toast-service';

@Component({
    selector: 'app-donation-transactions',
    standalone: true,
    imports: [CommonModule],
    template: `
<div *ngIf="loading" class="loader-container">
    <div class="loader"></div>
</div>

<div class="card border-0 shadow-sm bg-white p-4 main-transaction-card">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 header-section">
        <div>
            <h5 class="m-0 fw-bold text-dark d-flex align-items-center gap-2">
                <i class="bi bi-list-task text-primary"></i>
                Donation Transactions
            </h5>
            <p class="text-muted small mb-0 mt-1">Detailed view of all donations for the selected period</p>
        </div>
        
        <div class="d-flex align-items-center gap-3 filter-controls">
            <div class="select-wrapper">
                <span class="label">Select Year</span>
                <select class="form-select form-select-sm custom-select" (change)="onYearChange($any($event.target).value)" [value]="selectedYear">
                    <option *ngFor="let s of donationSummary" [value]="s.year">{{s.year}}</option>
                </select>
            </div>
        </div>
    </div>

    <div class="table-responsive custom-table-container">
        <table class="table table-hover align-middle">
            <thead>
                <tr>
                    <th scope="col" class="text-center">#</th>
                    <th scope="col" style="cursor: pointer;" (click)="onSort('Member Id')">
                        Member Id
                        <i class="bi" [ngClass]="{'bi-sort-alpha-down': sortColumn === 'Member Id' && sortDirection === 'asc', 'bi-sort-alpha-up': sortColumn === 'Member Id' && sortDirection === 'desc', 'bi-arrow-down-up': sortColumn !== 'Member Id'}" class="sort-icon"></i>
                    </th>
                    <th scope="col" style="cursor: pointer;" (click)="onSort('Name')">
                        Donar Name
                        <i class="bi" [ngClass]="{'bi-sort-alpha-down': sortColumn === 'Name' && sortDirection === 'asc', 'bi-sort-alpha-up': sortColumn === 'Name' && sortDirection === 'desc', 'bi-arrow-down-up': sortColumn !== 'Name'}" class="sort-icon"></i>
                    </th>
                    <th scope="col" style="cursor: pointer;" (click)="onSort('City')">
                        City
                        <i class="bi" [ngClass]="{'bi-sort-alpha-down': sortColumn === 'City' && sortDirection === 'asc', 'bi-sort-alpha-up': sortColumn === 'City' && sortDirection === 'desc', 'bi-arrow-down-up': sortColumn !== 'City'}" class="sort-icon"></i>
                    </th>
                    <th scope="col" style="cursor: pointer;" (click)="onSort('PaymentDate')">
                        Payment Date
                        <i class="bi" [ngClass]="{'bi-sort-numeric-down': sortColumn === 'PaymentDate' && sortDirection === 'asc', 'bi-sort-numeric-up': sortColumn === 'PaymentDate' && sortDirection === 'desc', 'bi-arrow-down-up': sortColumn !== 'PaymentDate'}" class="sort-icon"></i>
                    </th>
                    <th scope="col" class="text-center">Method</th>
                    <th scope="col" class="text-end" style="cursor: pointer;" (click)="onSort('Amount')">
                        Amount
                        <i class="bi" [ngClass]="{'bi-sort-numeric-down': sortColumn === 'Amount' && sortDirection === 'asc', 'bi-sort-numeric-up': sortColumn === 'Amount' && sortDirection === 'desc', 'bi-arrow-down-up': sortColumn !== 'Amount'}" class="sort-icon"></i>
                    </th>
                    <th scope="col" class="text-center">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr *ngFor="let donation of donationData$ | async; let i = index" class="transaction-row">
                    <td class="text-center text-muted small">{{ i + 1 }}</td>
                    <td class="fw-bold text-primary small">{{ donation['Member Id'] }}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-sm me-3" [style.background-color]="getAvatarColor(donation.Name)">
                                {{donation.Name.charAt(0)}}
                            </div>
                            <div>
                                <div class="fw-bold text-dark">{{ donation.Name }}</div>
                                <div class="text-muted extra-small">{{ donation.Mobile }}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center gap-1">
                            <i class="bi bi-geo-alt text-muted"></i>
                            {{ donation.City }}
                        </div>
                    </td>
                    <td>
                        <div class="d-flex flex-column">
                            <span class="fw-medium">{{ donation.PaymentDate | date: 'dd MMM, yyyy' }}</span>
                            <span class="text-muted extra-small">Ref: {{ donation.PaymentNo || 'N/A' }}</span>
                        </div>
                    </td>
                    <td class="text-center">
                        <span class="payment-badge" [ngClass]="donation.PaymentType.toLowerCase()">
                            {{ donation.PaymentType }}
                        </span>
                    </td>
                    <td class="text-end">
                        <span class="amount-text">₹{{ donation.Amount.toLocaleString() }}</span>
                    </td>
                    <td class="text-center">
                        <div class="action-buttons">
                            <button class="btn-action delete" (click)="onDelete(donation)" title="Delete Transaction">
                                <i class="bi bi-trash3"></i>
                            </button>
                        </div>
                    </td>
                </tr>
                <tr *ngIf="!(donationData$ | async)?.length">
                    <td colspan="8" class="text-center py-5 empty-state">
                        <div class="empty-icon-wrapper">
                            <i class="bi bi-clipboard-x fs-1"></i>
                        </div>
                        <h6 class="mt-3 fw-bold">No transactions found</h6>
                        <p class="text-muted small">We couldn't find any donation records for {{selectedYear}}</p>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<style>
    .main-transaction-card {
        border-radius: 20px;
    }
    .extra-small {
        font-size: 11px;
    }
    .avatar-sm {
        width: 36px;
        height: 36px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.9rem;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .select-wrapper {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .select-wrapper .label {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .custom-select {
        border-radius: 10px;
        border: 1.5px solid #e2e8f0;
        padding: 8px 16px;
        font-weight: 600;
        color: #1e293b;
        background-color: #f8fafc;
        transition: all 0.2s;
    }
    .custom-select:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    .custom-table-container {
        border: 1px solid #f1f5f9;
        border-radius: 15px;
        overflow: hidden;
    }
    .table thead th {
        background: #f8fafc;
        border-bottom: 2px solid #f1f5f9;
        color: #64748b;
        font-weight: 600;
        font-size: 13px;
        padding: 16px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .transaction-row {
        transition: all 0.2s;
        border-bottom: 1px solid #f8fafc;
    }
    .transaction-row:hover {
        background-color: #f1f5f9;
        transform: scale(1.002);
    }
    .transaction-row td {
        padding: 16px;
        color: #475569;
    }
    .sort-icon {
        font-size: 0.8rem;
        margin-left: 6px;
        color: #cbd5e1;
    }
    .payment-badge {
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
        display: inline-block;
        text-transform: capitalize;
    }
    .payment-badge.cash { background: #dcfce7; color: #166534; }
    .payment-badge.online { background: #dbeafe; color: #1e40af; }
    .payment-badge.cheque { background: #fef3c7; color: #92400e; }
    .amount-text {
        font-weight: 800;
        color: #0f172a;
        font-size: 15px;
    }
    .action-buttons {
        display: flex;
        justify-content: center;
        gap: 8px;
    }
    .btn-action {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        background: #f8fafc;
    }
    .btn-action.delete { color: #ef4444; }
    .btn-action.delete:hover {
        background: #fef2f2;
        transform: rotate(10deg);
    }
    .empty-icon-wrapper {
        width: 80px;
        height: 80px;
        background: #f8fafc;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        color: #cbd5e1;
    }
</style>
  `,
    styleUrl: '../donation-summary.component.scss'
})
export class DonationTransactionsComponent implements OnInit {
    memberDataService = inject(MemberService);
    toastService = inject(ToastService);

    loading = false;
    donationSummary: any[] = [];
    transactions: any[] = [];
    donationData$: Observable<any[]> | undefined;
    selectedYear: any = null;

    sortColumn = 'PaymentDate';
    sortDirection: 'asc' | 'desc' = 'desc';

    ngOnInit() {
        this.loadSummaryAndDefaultYear();
    }

    loadSummaryAndDefaultYear() {
        this.loading = true;
        this.memberDataService.getTotalDonation().subscribe(data => {
            this.donationSummary = data;
            if (this.donationSummary.length > 0) {
                this.selectedYear = this.donationSummary[0].year;
                this.onYearChange(this.selectedYear);
            }
            this.loading = false;
        });
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

    onYearChange(year: any) {
        this.selectedYear = year;
        this.loading = true;
        this.memberDataService.getDonationData(year).subscribe(data => {
            this.transactions = data;
            this.applySort();
            this.loading = false;
        });
    }

    onDelete(donation: any) {
        if (confirm(`Are you sure you want to delete donation entry for ${donation.Name}?`)) {
            this.loading = true;
            this.memberDataService.deleteDonation(donation.id).subscribe((res: any) => {
                const response = typeof res === 'string' ? JSON.parse(res) : res;
                this.toastService.show({ template: response.message || 'Record deleted successfully', classname: 'bg-success text-light', delay: 5000 });
                this.onYearChange(this.selectedYear);
            }, error => {
                const errorMsg = error.error?.message || 'Failed to delete donation record.';
                this.toastService.show({ template: errorMsg, classname: 'bg-danger text-light', delay: 5000 });
                this.loading = false;
            });
        }
    }

    getAvatarColor(name: string): string {
        const colors = [
            '#3b82f6', '#10b981', '#6366f1', '#f59e0b',
            '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
}
