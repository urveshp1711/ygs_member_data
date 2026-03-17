import { Component, inject, PipeTransform, signal, TemplateRef, viewChild, ViewChild, WritableSignal } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, merge, Observable, of, OperatorFunction, Subject } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, finalize, map, startWith, tap } from 'rxjs/operators';
import { ModalDismissReasons, NgbDate, NgbDateStruct, NgbModal, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { MemberService } from '../../services/member.service';
import * as moment from 'moment';
import { ToastService } from '../../services/toast-service';
import { ExportService } from '../../services/export.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subhechhak-member-data',
  templateUrl: './subhechhak-member-data.component.html',
  styleUrl: './subhechhak-member-data.component.scss',
  standalone: false
})
export class SubhechhakMemberDataComponent {


  @ViewChild('successTpl', { static: true }) successTpl!: TemplateRef<any>;
  @ViewChild('content', { static: true }) content!: TemplateRef<any>;
  @ViewChild('iRelation', { static: true }) iRelation: NgbTypeahead | undefined;
  @ViewChild('iMarriageStatus', { static: true }) iMarriageStatus: NgbTypeahead | undefined;
  @ViewChild('iProfession', { static: true }) iProfession: NgbTypeahead | undefined;
  @ViewChild('iBloodGroup', { static: true }) iBloodGroup: NgbTypeahead | undefined;

  private toastService = inject(ToastService);
  private bloodGroup: any[] = [];
  private relation: any[] = [];
  private marriageStatus: any[] = [];
  private profession: any[] = [];
  private modalService: NgbModal = inject(NgbModal);
  private members: any[] = [];

  memberFormGroup: FormGroup = new FormGroup({});
  upsertMemberDataFormGroup: FormGroup = new FormGroup({});
  addMemberCall = false;
  closeResult: WritableSignal<string> = signal('');
  memberData$: Observable<any[]> | undefined;
  memberDataSubject$: BehaviorSubject<any[]> | undefined;
  filter = new FormControl('', { nonNullable: true });

  model: NgbDateStruct = new NgbDate(2000, 1, 1); // Make sure it's properly initialized;
  minDate: NgbDate | undefined;

  focusR$ = new Subject<string>();
  clickR$ = new Subject<string>();
  focusMR$ = new Subject<string>();
  clickMR$ = new Subject<string>();
  focusP$ = new Subject<string>();
  clickP$ = new Subject<string>();
  focusBG$ = new Subject<string>();
  clickBG$ = new Subject<string>();

  loading = false;
  modelLoading = false;

  editingRowId: any = null;
  editingMemberBackup: any = null;

  page = 1;
  pageSize = 10;
  collectionSize = 0;
  Math = Math;

  sortColumn = 'Member Id';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private router: Router,
    private exportService: ExportService,
    private memberDataService: MemberService,
    private formBuilder: FormBuilder) {
    const currentDate = moment("1900-01-01").toDate();
    this.minDate = new NgbDate(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
  }

  async ngOnInit() {

    this.loading = true;
    this.loadGrid();

    this.getBloodGroupMaster();
    this.getRelationMaster();
    this.getMarriageStatusMaster();
    this.getProfessionMaster();
  }

  searchRelation: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.clickR$.pipe(filter(() => !this.iRelation?.isPopupOpen()));
    const inputFocus$ = this.focusR$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map((term) =>
        (term === '' ? this.relation : this.relation.filter((v) => v.toLowerCase().indexOf(term.toLowerCase()) > -1)).slice(0, 1000),
      ),
    );
  };

  searchBloodGroup: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.clickBG$.pipe(filter(() => !this.iBloodGroup?.isPopupOpen()));
    const inputFocus$ = this.focusBG$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map((term) =>
        (term === '' ? this.bloodGroup : this.bloodGroup.filter((v) => v.toLowerCase().indexOf(term.toLowerCase()) > -1)).slice(0, 1000),
      ),
    );
  };

  searchMarriageStatus: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.clickMR$.pipe(filter(() => !this.iMarriageStatus?.isPopupOpen()));
    const inputFocus$ = this.focusMR$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map((term) =>
        (term === '' ? this.marriageStatus : this.marriageStatus.filter((v) => v.toLowerCase().indexOf(term.toLowerCase()) > -1)).slice(0, 1000),
      ),
    );
  };

  searchProfession: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.clickP$.pipe(filter(() => !this.iMarriageStatus?.isPopupOpen()));
    const inputFocus$ = this.focusP$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map((term) =>
        (term === '' ? this.profession : this.profession.filter((v) => v.toLowerCase().indexOf(term.toLowerCase()) > -1)).slice(0, 1000),
      ),
    );
  };

  search(text: string): any[] {
    if (!text) {
      return this.members;
    }
    else {
      return this.members.filter((member) => {
        const term = text.toLowerCase();
        return (
          (member.Name ? member.Name.toLowerCase().includes(term) : false) ||
          (member.Mobile ? member.Mobile.toLowerCase().includes(term) : false) ||
          (member.Relation ? member.Relation.toLowerCase().includes(term) : false) ||
          (member.Profession ? member.Profession.toLowerCase().includes(term) : false) ||
          (member['Member Id'] ? member['Member Id'].toLowerCase().includes(term) : false)
        );
      });
    }
  }

  loadGrid() {
    this.memberDataService.getShubhechhakMemberMaster()
      .pipe(
        tap(data => {
          this.members = data;
          this.loading = false;
          this.refreshTable();
        })
      ).subscribe();

    this.memberFormGroup = this.formBuilder.group({
      name: '',
      // relation: '',
      dob: '',
      dateOfBirth: null,
      marriageStatus: '',
      profession: '',
      designation: '',
      company: '',
      mobile: '',
      bloodGroup: '',
      // gender: '',
      city: '',
    });
  }

  filterData() {
    this.page = 1;
    this.refreshTable();
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.refreshTable();
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
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  }

  refreshTable() {
    const term = this.filter.value.toLocaleLowerCase();
    let filtered = this.members.filter((member) => (
      (member.Name ? member.Name.toLowerCase().includes(term) : false) ||
      (member.Relation ? member.Relation.toLowerCase().includes(term) : false) ||
      (member.Mobile ? member.Mobile.toLowerCase().includes(term) : false) ||
      (member['Member Id'] ? member['Member Id'].toLowerCase().includes(term) : false)
    ));

    // Apply Sorting
    if (this.sortColumn) {
      filtered.sort((a, b) => {
        const res = this.compare(a[this.sortColumn], b[this.sortColumn]);
        return this.sortDirection === 'asc' ? res : -res;
      });
    }

    this.collectionSize = filtered.length;
    const paged = filtered.slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);

    this.memberData$ = of(paged);
  }

  async getBloodGroupMaster() {
    this.memberDataService.getBloodGroupMaster()
      .pipe(
        tap(data => {
          // Here we push the data into the array
          this.bloodGroup = (data || []).map(item => item.bloodGroup);
        })
      ).subscribe();
  }

  async getMarriageStatusMaster() {
    this.memberDataService.getMarriageStatusMaster()
      .pipe(
        tap(data => {
          // Here we push the data into the array
          this.marriageStatus = (data || []).map(item => item.marriageStatus);
        })
      ).subscribe();
  }

  async getProfessionMaster() {
    this.memberDataService.getProfessionMaster()
      .pipe(
        tap(data => {
          // Here we push the data into the array
          this.profession = (data || []).map(item => item.profession);
        })
      ).subscribe();
  }

  async getRelationMaster() {
    this.memberDataService.getRelationMaster()
      .pipe(
        tap(data => {
          // Here we push the data into the array
          this.relation = (data || []).map(item => item.relation);
        })
      ).subscribe();
  }

  createUpdateNewMember(id, member, reloadGrid = true) {

    this.modelLoading = true;

    const request = !!member ? member : this.upsertMemberDataFormGroup.getRawValue();
    console.log(request);

    if (request.dateOfBirth) {
      if (typeof request.dateOfBirth === 'object' && request.dateOfBirth.year) {
        request.dateOfBirth = request.dob = moment(`${request.dateOfBirth?.year}-${request.dateOfBirth?.month}-${request.dateOfBirth?.day}`).format("yyyy-MM-DD");
      } else {
        request.dateOfBirth = request.dob = moment(request.dateOfBirth).format("yyyy-MM-DD");
      }
    }
    else {
      request.dateOfBirth = null;
    }

    this.loading = true;
    this.memberDataService.addUpdateShubhechhakMemberInfo(id, request, this.addMemberCall)
      .pipe(
        tap((response: any) => {

          this.modelLoading = false;
          this.loading = false;

          if (reloadGrid) {
            this.toastService.show({ template: response.message, classname: 'bg-success text-light', delay: 5000 });
            this.loadGrid();
          } else {
            this.toastService.show({ template: response.message || 'Updated successfully', classname: 'bg-success text-light', delay: 5000 });
          }

          this.upsertMemberDataFormGroup.reset();
          this.modalService.dismissAll("Updated!");

        })
      ).subscribe();

  }

  deleteMember(member) {
    const res = confirm(`Are you sure you want to delete this member - ${member.Name} ?`);
    if (!!res) {
      this.loading = true;
      this.memberDataService.deleteShubhechhakMember(member.Id)
        .pipe(
          tap((data: any) => {
            this.toastService.show({ template: data.message, classname: 'bg-danger text-light', delay: 5000 });
            this.loadGrid();
          })
        ).subscribe();
    }
  }

  createModelForm() {
    this.upsertMemberDataFormGroup = this.formBuilder.group({
      id: [''],
      memberId: [''],
      name: ['', [Validators.required]],
      // relation: ['', [Validators.required]],
      dob: null,
      dateOfBirth: null,
      marriageStatus: '',
      profession: '',
      designation: '',
      leadMember: '',
      address: '',
      company: '',
      mobile: ['', [Validators.required]],
      bloodGroup: '',
      gender: '',
      city: ''
    });

    this.upsertMemberDataFormGroup.get('relation')?.valueChanges.subscribe(value => {
      if (value?.toLowerCase() == "self") {
        this.upsertMemberDataFormGroup.get('memberId')?.disable();
        this.upsertMemberDataFormGroup.get('memberId')?.setValidators([]);
        if (this.addMemberCall) {
          this.upsertMemberDataFormGroup.get('memberId')?.setValue('');
        }
      }
      else if (value != null && value != '') {
        this.upsertMemberDataFormGroup.get('memberId')?.enable();
        this.upsertMemberDataFormGroup.get('memberId')?.setValidators([Validators.required]);
      }

      this.upsertMemberDataFormGroup?.get('memberId')?.updateValueAndValidity();

    });

  }

  editMemberInfo(memberId) {

    this.createModelForm();

    this.loading = true;
    this.memberDataService.getMemberInfo(memberId)
      .pipe(
        tap(data => {
          // Here we push the data into the array
          const mDate = moment(data["Table"][0]['Date Of Birth']);
          const ngDate = new NgbDate(mDate.year(), mDate.month() + 1, mDate.date())
          const memberInfo = {
            id: data["Table"][0]["Id"],
            memberId: data["Table"][0]["Member Id"] || '',
            leadMember: data["Table"][0]['Lead'] || '',
            address: data["Table"][0]["Address"] || '',
            name: data["Table"][0]['Name'] || '',
            relation: data["Table"][0]['Relation'] || '',
            dateOfBirth: data["Table"][0]['Date Of Birth'] ? ngDate : null,
            dob: data["Table"][0]['Date Of Birth'] ? ngDate : null,
            marriageStatus: data["Table"][0]['Married'] || '',
            profession: data["Table"][0]['Profession'] || '',
            designation: data["Table"][0]['Designation'] || '',
            company: data["Table"][0]['Company'] || '',
            mobile: data["Table"][0]['Mobile'] || '',
            bloodGroup: data["Table"][0]['Blood Group'] || '',
            gender: data["Table"][0]["Gender"] || '',
            city: data["Table"][0]['City'] || ''
          };

          this.upsertMemberDataFormGroup.patchValue(memberInfo);
          this.loading = false;
          this.open(this.content);
        })
      ).subscribe();
  }

  relationChanged(event) {
    console.log(event);
  }

  openModelDialog() {

    this.createModelForm();
    this.open(this.content, true);
  }

  open(content: TemplateRef<any>, addDialog = false) {

    this.addMemberCall = addDialog;

    if (addDialog) {
      this.upsertMemberDataFormGroup.reset();
    }

    this.modalService.open(content, { size: 'lg', ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {
        //this.closeResult.set(`Closed with: ${result}`);
      },
      (reason) => {
        //this.closeResult.set(`Dismissed ${this.getDismissReason(reason)}`);
      },
    );
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

  exportTableData(): void {
    this.exportService.exportToExcel('ubs-members', 'UBS-Member-Data');
  }

  onSignout() {
    localStorage.removeItem('session-timeout');
    this.router.navigate(['/']);
  }

  startInlineEdit(member: any, fieldName: string = 'Name') {
    this.editingRowId = member.Id;
    this.editingMemberBackup = { ...member };

    setTimeout(() => {
      const element = document.getElementById(`inline-edit-${fieldName.replace(/\s+/g, '-')}-${member.Id}`);
      if (element) {
        element.focus();
        if (element instanceof HTMLInputElement) {
          element.select();
        }
      }
    }, 100);
  }

  onCellDblClick(event: MouseEvent, member: any) {
    if (this.editingRowId === member.Id) return;

    const target = event.target as HTMLElement;
    const td = target.closest('td');
    if (td) {
      const field = td.getAttribute('data-field');
      if (field) {
        this.startInlineEdit(member, field);
      }
    }
  }

  cancelInlineEdit(member: any) {
    if (this.editingMemberBackup) {
      Object.assign(member, this.editingMemberBackup);
    }
    this.editingRowId = null;
    this.editingMemberBackup = null;
  }

  updateInlineRow(member: any) {
    this.createUpdateNewMember(member.Id, member, false);
    this.editingRowId = null;
    this.editingMemberBackup = null;
  }

  onRowFocusOut(event: FocusEvent, member: any) {
    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;

    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }

    setTimeout(() => {
      // Focus out handled by explicit buttons now
    }, 200);
  }


}