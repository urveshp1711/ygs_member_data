import { Component, inject } from '@angular/core';
import { MemberService } from '~/services/member.service';
import { ExportService } from '~/services/export.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent {
  private memberService = inject(MemberService);
  private exportService = inject(ExportService);

  loading = false;

  reports = [
    {
      title: 'Member List Report',
      desc: 'Download the complete list of all registered members in Excel format.',
      icon: 'bi-people-fill',
      type: 'member'
    },
    {
      title: 'Shubhechhak List Report',
      desc: 'Download the complete list of all Shubhechhaks (Well-wishers) in Excel format.',
      icon: 'bi-person-heart',
      type: 'shubhechhak'
    }
  ];

  downloadReport(type: string) {
    this.loading = true;
    if (type === 'member') {
      this.memberService.getMemberMaster()
        .pipe(finalize(() => this.loading = false))
        .subscribe(data => {
          this.exportData(data, 'UBS-Member-List');
        });
    } else if (type === 'shubhechhak') {
      this.memberService.getShubhechhakMemberMaster()
        .pipe(finalize(() => this.loading = false))
        .subscribe(data => {
          this.exportData(data, 'UBS-Shubhechhak-List');
        });
    }
  }

  private exportData(data: any[], fileName: string) {
    if (!data || data.length === 0) return;
    
    // Create a temporary table to use exportService.exportToExcel
    // or better, use XLSX directly if possible. 
    // Since exportService depends on tableId, I'll create a hidden table.
    
    const table = document.createElement('table');
    table.id = 'temp-report-table';
    table.style.display = 'none';
    
    const headers = Object.keys(data[0]);
    const headerRow = table.insertRow();
    headers.forEach(h => {
      const th = document.createElement('th');
      th.innerText = h;
      headerRow.appendChild(th);
    });
    
    data.forEach(item => {
      const row = table.insertRow();
      headers.forEach(h => {
        const cell = row.insertCell();
        cell.innerText = item[h] || '';
      });
    });
    
    document.body.appendChild(table);
    this.exportService.exportToExcel(table.id, fileName);
    document.body.removeChild(table);
  }
}
