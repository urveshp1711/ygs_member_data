import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-get-familty-tree',
  templateUrl: './get-familty-tree.component.html',
  styleUrl: './get-familty-tree.component.scss',
  standalone: false
})
export class GetFamiltyTreeComponent implements OnInit, AfterViewInit {

  @ViewChild('container', { static: true }) container: any;

  constructor(
    private router: Router) {
  }

  ngOnInit(): void {

  }

  familyObject = {

    name: 'Amrutlal',
    spouse: "Leelavati",
    children: [
      {
        name: 'Anil',
        spouse: 'Nita',
        children: [
          {
            name: 'Urvesh',
            spouse: 'Namrata',
            children: [
            ]
          },
          {
            name: 'Jay',
            spouse: 'Zalak',
            children: [{
              name: 'Pranshu',
            }]
          }
        ]
      },
      {
        name: 'Anil',
        spouse: 'Nita',
        children: [
          {
            name: 'Urvesh',
            spouse: 'Namrata',
            children: [
            ]
          },
          {
            name: 'Jay',
            spouse: 'Zalak',
            children: [{
              name: 'Pranshu',
            }]
          }
        ]
      },
      {
        name: 'Anil',
        spouse: 'Nita',
        children: [
          {
            name: 'Urvesh',
            spouse: 'Namrata',
            children: [
            ]
          },
          {
            name: 'Jay',
            spouse: 'Zalak',
            children: [{
              name: 'Pranshu',
            }]
          }
        ]
      },
      {
        name: 'Anil',
        spouse: 'Nita',
        children: [
          {
            name: 'Urvesh',
            spouse: 'Namrata',
            children: [
            ]
          },
          {
            name: 'Jay',
            spouse: 'Zalak',
            children: [{
              name: 'Pranshu',
            }]
          }
        ]
      },
      {
        name: 'Anil',
        spouse: 'Nita',
        children: [
          {
            name: 'Urvesh',
            spouse: 'Namrata',
            children: [
            ]
          },
          {
            name: 'Jay',
            spouse: 'Zalak',
            children: [{
              name: 'Pranshu',
            }]
          }
        ]
      },
      {
        name: 'Anil',
        spouse: 'Nita',
        children: [
          {
            name: 'Urvesh',
            spouse: 'Namrata',
            children: [
            ]
          },
          {
            name: 'Jay',
            spouse: 'Zalak',
            children: [{
              name: 'Pranshu',
            }]
          }
        ]
      },
      {
        name: 'Anil',
        spouse: 'Nita',
        children: [
          {
            name: 'Urvesh',
            spouse: 'Namrata',
            children: [
            ]
          },
          {
            name: 'Jay',
            spouse: 'Zalak',
            children: [{
              name: 'Pranshu',
            }]
          }
        ]
      },
      {
        name: 'Anil',
        spouse: 'Nita',
        children: [
          {
            name: 'Urvesh',
            spouse: 'Namrata',
            children: [
            ]
          },
          {
            name: 'Jay',
            spouse: 'Zalak',
            children: [{
              name: 'Pranshu',
            }]
          }
        ]
      },
      {
        name: 'Anil',
        spouse: 'Nita',
        children: [
          {
            name: 'Urvesh',
            spouse: 'Namrata',
            children: [
            ]
          },
          {
            name: 'Jay',
            spouse: 'Zalak',
            children: [{
              name: 'Pranshu',
            }]
          }
        ]
      },
      {
        name: 'Ashok',
        spouse: 'Ranjan',
        children: [
          {
            name: 'Bhavita',
            spouse: 'Dipak',
            children: [
              {
                name: 'Drashti'
              },
              {
                name: 'Mahi'
              }
            ]
          },
          {
            name: 'Gayatri',
            spouse: 'Sachin',
            children: [
              {
                name: 'Yash'
              },
              {
                name: 'Deepu'
              }
            ]
          }
        ]
      },
      {
        name: 'Kanu',
        spouse: 'Nayana',
        children: [
          {
            name: 'Dhaval',
            spouse: 'Alpa',
            children: [
              {
                name: 'Het'
              },
              {
                name: 'Krishna',
                spouse: 'Neel'
              },
              {
                name: 'Shivani',
                spouse: 'Ankit',
                children: [
                  {
                    name: 'SANTI'
                  }
                ]
              }
            ]
          },
          {
            name: 'Jgnesh',
            spouse: 'Minu',
            children: [
              {
                name: 'Jay'
              }
            ]
          }
        ]
      },
      {
        name: 'Navin',
        spouse: 'Sudha',
        children: [
          {
            name: 'Sunil',
            spouse: 'Dipali',
            children: [
              {
                name: 'Meet',
                spouse: 'Justina'
              },
              {
                name: 'Visha'
              }
            ]
          },
          {
            name: 'Falgun',
            spouse: 'Ami',
            children: [
              {
                name: 'Jenil'
              },
              {
                name: 'Rahi'
              }
            ]
          },
          {
            name: 'Apexa',
            spouse: 'Bhavik',
            children: [
              {
                name: 'Shiv'
              },
              {
                name: 'Dhruvi'
              }
            ]
          }
        ]
      }]
  };

  ngAfterViewInit() {

    const container: any = document.getElementById('container');
    container.scrollTo({
      top: (container.scrollHeight - container.clientHeight) / 2,
      left: (container.scrollWidth - container.clientWidth) / 2,
      behavior: 'smooth'
    });

  }

  onSignout() {
    localStorage.removeItem('session-timeout');
    this.router.navigate(['/']);
  }

}
