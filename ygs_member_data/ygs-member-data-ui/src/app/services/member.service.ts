import { Router } from '@angular/router';
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Service to handle the authentication of the user
 * This service is used to signup, signin and logout the user using basic authentication
 */
@Injectable()
export class MemberService {

    APIHost = environment.APIHost;
    constructor(
        public http: HttpClient,
        public router: Router
    ) { }

    getMemberMaster() {
        return this.http.get<any[]>(`${this.APIHost}/api/memberdata`).pipe(
            map(response => response)
        );
    }


    getDonationData(year) {
        return this.http.get<any[]>(`${this.APIHost}/api/memberdata/donationData?year=${year}`).pipe(
            map(response => response)
        );
    }

    getMemberInfo(id) {
        return this.http.get<any>(`${this.APIHost}/api/memberdata/${id}`);
    }

    getMemberByMemberId(memberId: string): Observable<any> {
        return this.http.get<any>(`${this.APIHost}/api/memberdata/fetchByMemberId/${memberId}`);
    }

    addUpdateMemberInfo(id, request: any, isAdd) {
        if (isAdd) {
            return this.http.post(`${this.APIHost}/api/memberdata`, request);
        }
        else {
            return this.http.put(`${this.APIHost}/api/memberdata/${id}`, request);
        }
    }


    getBloodGroupMaster() {
        return this.http.get<any[]>(`${this.APIHost}/api/memberdata/bloodGroup`).pipe(
            map(response => response)
        );
    }

    getRelationMaster() {
        return this.http.get<any[]>(`${this.APIHost}/api/memberdata/relation`).pipe(
            map(response => response)
        );
    }

    getMarriageStatusMaster() {
        return this.http.get<any[]>(`${this.APIHost}/api/memberdata/marriageStatus`).pipe(
            map(response => response)
        );
    }

    getProfessionMaster() {
        return this.http.get<any[]>(`${this.APIHost}/api/memberdata/profession`).pipe(
            map(response => response)
        );
    }

    getTotalDonation() {
        return this.http.get<any[]>(`${this.APIHost}/api/memberdata/getTotalDonation`).pipe(
            map(response => response)
        );
    }

    deleteMember(id) {
        return this.http.delete(`${this.APIHost}/api/memberdata/${id}`);
    }


    deleteDonation(id) {
        return this.http.delete(`${this.APIHost}/api/memberdata/donation/${id}`);
    }

    downloadDonationData() {
        return this.http.get(`${this.APIHost}/api/memberdata/downloadDonationData`, { responseType: 'blob' })
            .pipe(
                tap((response: Blob) => {
                }),
            ).subscribe(
                (response: Blob) => {
                    // Set correct MIME type for Excel
                    const blob = new Blob([response], {
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    });
                    const url = window.URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `donation_data.xlsx`; // 📝 correct file extension
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

    depositeAmount(request) {
        return this.http.post(`${this.APIHost}/api/memberdata/donation`, request, { responseType: 'blob' });
    }

}
