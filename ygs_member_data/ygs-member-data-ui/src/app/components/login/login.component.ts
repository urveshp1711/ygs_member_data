import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { sessionPeriod } from '../../services/constant';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: false
})
export class LoginComponent implements OnInit {

  invalidCredential = false;
  loginForm!: FormGroup;

  constructor(private router: Router, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    // Get the token from localStorage (or wherever it's stored)
    const sessionTimeout = localStorage.getItem('session-timeout');
    const minutesDiff = moment().diff(moment(sessionTimeout), "minutes");

    if (!sessionTimeout || minutesDiff > sessionPeriod) {
      localStorage.removeItem('session-timeout');
    }
    else {
      this.router.navigate(['/member']);
    }
  }

  onSubmit() {
    this.invalidCredential = false;

    const loginData = this.loginForm.getRawValue();

    if ((!loginData.userName || !loginData.password) || loginData.userName?.toLowerCase() !== "admin" && loginData.password !== "Password26") {
      this.invalidCredential = true;
    }
    else {
      localStorage.setItem("session-timeout", Date().toString());
      this.router.navigate(['/member']);
    }
  }

}
