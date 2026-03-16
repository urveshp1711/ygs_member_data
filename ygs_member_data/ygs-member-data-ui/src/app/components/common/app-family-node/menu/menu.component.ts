import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {

  activeMenu = 'members';

  constructor(
    private router: Router,
  ) { }

  onSignout() {
    localStorage.removeItem('session-timeout');
    this.router.navigate(['/']);
  }

  onMenuBtnClick(type) {
    if (type === 'donation'){
      this.activeMenu = 'donation';
      this.router.navigate(['/mng-donation']);
    }
    else if (type === 'members'){
      this.activeMenu = 'members';
      this.router.navigate(['/member']);
    }
    else if (type === 'shubhechhak') {
      this.activeMenu = 'shubhechhak';
      this.router.navigate(['/s-member']);
    }
    else if (type === 'donation-summary') {
      this.activeMenu = 'donation-summary';
      this.router.navigate(['/donation-summary']);
    }
    else if (type === 'report') {
      this.activeMenu = 'report';
      this.router.navigate(['/reports']);
    }
  }

}
