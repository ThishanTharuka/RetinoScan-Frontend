import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';

import { SidenavService, NavItem } from '../../services/sidenav.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    RouterModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent implements OnInit, OnDestroy {
  private readonly sidenavService = inject(SidenavService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // State properties
  isCollapsed = false;
  isMobile = false;
  isOpen = false;
  navItems: NavItem[] = [];
  bottomNavItems: NavItem[] = [];
  ngOnInit() {
    // Subscribe to sidenav state
    this.sidenavService.isCollapsed$
      .pipe(takeUntil(this.destroy$))
      .subscribe((collapsed: boolean) => (this.isCollapsed = collapsed));

    this.sidenavService.isMobile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((mobile: boolean) => (this.isMobile = mobile));

    this.sidenavService.isOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe((open: boolean) => (this.isOpen = open));

    // Get navigation items
    this.navItems = this.sidenavService.navItems;
    this.bottomNavItems = this.sidenavService.bottomNavItems;

    // Listen to route changes to update active item
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((event: NavigationEnd) => {
        this.sidenavService.setActiveRoute(event.url);
      });

    // Set initial active route
    this.sidenavService.setActiveRoute(this.router.url);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidenav() {
    if (this.isMobile) {
      this.sidenavService.toggleMobileMenu();
    } else {
      this.sidenavService.toggleCollapsed();
    }
  }

  closeMobileMenu() {
    this.sidenavService.closeMobileMenu();
  }

  onNavItemClick() {
    if (this.isMobile) {
      this.closeMobileMenu();
    }
  }

  async handleSignOut() {
    try {
      await this.authService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  getToggleIcon(): string {
    if (this.isMobile) {
      return this.isOpen ? 'close' : 'menu';
    }
    return this.isCollapsed ? 'menu_open' : 'menu';
  }

  getToggleTooltip(): string {
    if (this.isMobile) {
      return this.isOpen ? 'Close Menu' : 'Open Menu';
    }
    return this.isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar';
  }
}
