import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-family-node',
  templateUrl: './app-family-node.component.html',
  styleUrl: './app-family-node.component.scss',
  encapsulation: ViewEncapsulation.None,
  standalone: false
})
export class AppFamilyNodeComponent implements OnInit {
  @Input() member: any;

  ngOnInit() {    
  }
}
