import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { SidenavComponent } from '../sidenav/sidenav.component';
import { SidenavService } from '../../services/sidenav.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, SidenavComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  private readonly sidenavService = inject(SidenavService);
  private readonly destroy$ = new Subject<void>();

  isCollapsed = false;
  isMobile = false;

  ngOnInit() {
    // Subscribe to sidenav state
    this.sidenavService.isCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe((collapsed) => (this.isCollapsed = collapsed));

    this.sidenavService.isMobile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mobile) => (this.isMobile = mobile));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
