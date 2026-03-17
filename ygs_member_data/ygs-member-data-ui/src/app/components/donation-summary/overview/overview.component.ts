import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberService } from '../../../services/member.service';

@Component({
    selector: 'app-donation-overview',
    standalone: true,
    imports: [CommonModule],
    template: `
<div class="row g-4 mt-1" *ngIf="yearData">
    <!-- Summary Section -->
    <div class="col-12 mb-4">
        <div class="year-header d-flex align-items-center gap-2 mb-3">
            <i class="bi bi-calendar-check text-primary fs-4"></i>
            <h4 class="mb-0 fw-bold text-dark">Association Fee Report Summary - {{ yearData.year }}</h4>
            <div class="flex-grow-1 border-bottom ms-2 opacity-50"></div>
        </div>
        
        <div class="row g-3">
            <div class="col-md-4">
                <div class="stat-card entries">
                    <div class="card-icon"><i class="bi bi-people"></i></div>
                    <div class="card-info">
                        <span class="label">Total Entries</span>
                        <h3 class="value">{{ yearData.totalEntries || 0 }}</h3>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="stat-card amount">
                    <div class="card-icon"><i class="bi bi-currency-rupee"></i></div>
                    <div class="card-info">
                        <span class="label">Total Fees</span>
                        <h3 class="value">₹ {{ (yearData.totalDonation || 0).toLocaleString() }}</h3>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="stat-card average text-white">
                    <div class="card-icon"><i class="bi bi-graph-up-arrow"></i></div>
                    <div class="card-info">
                        <span class="label">Average Fee</span>
                        <h3 class="value">₹ {{ (yearData.avgDonation || 0).toFixed(2) }}</h3>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Month-wise Detail Table -->
    <div class="col-12">
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="card-header bg-white p-4 border-0">
                <h5 class="fw-bold m-0 d-flex align-items-center gap-2">
                    <i class="bi bi-calendar3-range text-primary"></i>
                    Month-wise Payment Breakdown
                </h5>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="bg-light">
                        <tr>
                            <th class="px-4 py-3">Month</th>
                            <th class="py-3 text-center">Total Entries</th>
                            <th class="px-4 py-3 text-end">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let m of yearData.months" [class.opacity-50]="m.totalEntries === 0">
                            <td class="px-4 py-3">
                                <div class="d-flex align-items-center gap-2">
                                    <div class="month-indicator" [class.active]="m.totalEntries > 0"></div>
                                    <span class="fw-bold">{{ getMonthName(m.month) }}</span>
                                </div>
                            </td>
                            <td class="py-3 text-center">
                                <span class="badge rounded-pill" [class.bg-primary]="m.totalEntries > 0" [class.bg-light]="m.totalEntries === 0" [class.text-dark]="m.totalEntries === 0">
                                    {{ m.totalEntries }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-end">
                                <span class="fw-bold" [class.text-success]="m.totalDonation > 0">
                                    ₹ {{ (m.totalDonation || 0).toLocaleString() }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot class="bg-light fw-bold">
                        <tr>
                            <td class="px-4 py-3">Year Total</td>
                            <td class="py-3 text-center">{{ yearData.totalEntries }}</td>
                            <td class="px-4 py-3 text-end text-primary">₹ {{ (yearData.totalDonation || 0).toLocaleString() }}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
</div>

<style>
    .month-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #e2e8f0;
    }
    .month-indicator.active {
        background: #3b82f6;
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
    }
    .year-header { padding-bottom: 5px; }
    .stat-card {
        background: white;
        border-radius: 16px;
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 20px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        border: 1px solid rgba(0,0,0,0.02);
        height: 100%;
    }
    .stat-card .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
    }
    .stat-card .label { color: #64748b; font-size: 14px; font-weight: 500; margin-bottom: 4px; display: block; }
    .stat-card .value { margin: 0; font-weight: 700; color: #1e293b; font-size: 24px; }
    .stat-card.entries .card-icon { background: #eff6ff; color: #3b82f6; }
    .stat-card.amount .card-icon { background: #ecfdf5; color: #10b981; }
    .stat-card.average { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; }
    .stat-card.average .card-icon { background: rgba(255,255,255,0.2); color: white; }
    .stat-card.average .label { color: rgba(255,255,255,0.8); }
    .stat-card.average .value { color: white; }
    
    .table thead th { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    .table tbody tr { transition: all 0.2s; }
    .table tbody tr:hover { background-color: #f8fafc; }
</style>
    `,
    styleUrl: '../donation-summary.component.scss'
})
export class DonationOverviewComponent implements OnInit {
    yearData: any;
    private memberDataService = inject(MemberService);

    ngOnInit() {
        this.memberDataService.selectedYear$.subscribe(year => {
            if (year) {
                this.loadYearDetails(year);
            }
        });
    }

    loadYearDetails(year: any) {
        this.memberDataService.getTotalDonation().subscribe(data => {
            if (data) {
                this.yearData = data.find(s => s.year === year);
            }
        });
    }

    getMonthName(monthIndex: number): string {
        return new Date(2000, monthIndex).toLocaleString('en-IN', { month: 'long' });
    }
}
