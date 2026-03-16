import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { sessionPeriod } from '~/services/constant';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  constructor(private router: Router, private formBuilder: FormBuilder) { }

  invalidCredential = false;
  loginForm: FormGroup = new FormGroup({});

  async ngOnInit() {


    // Get the token from localStorage (or wherever it's stored)
    const sessionTimeout = localStorage.getItem('session-timeout');
    const minutesDiff = moment().diff(moment(sessionTimeout), "minutes");

    if (!sessionTimeout || minutesDiff > sessionPeriod) {
      localStorage.removeItem('session-timeout');
      this.loginForm = this.formBuilder.group({
        userName: ['', [Validators.required]],
        password: ['', [Validators.required]],
      });
    }
    else {
      this.router.navigate(['/member']);  // Adjust the route path to your needs
    }


  }

  onSubmit() {

    this.invalidCredential = false;

    const loginData = this.loginForm.getRawValue();

    if ((!loginData.userName || !loginData.password) || loginData.userName?.toLowerCase() !== "ubs-admin" && loginData.password !== "password@ubs") {
      this.invalidCredential = true;
    }
    else {
      localStorage.setItem("session-timeout", Date().toString());
      this.router.navigate(['/member']);  // Adjust the route path to your needs
    }

  }

}
