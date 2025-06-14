import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, fromEvent } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SidenavService implements OnDestroy {
  private readonly isCollapsedSubject = new BehaviorSubject<boolean>(false);
  private readonly isMobileSubject = new BehaviorSubject<boolean>(false);
  private readonly isOpenSubject = new BehaviorSubject<boolean>(false);
  private readonly destroy$ = new Subject<void>();

  // Observable streams
  public isCollapsed$ = this.isCollapsedSubject.asObservable();
  public isMobile$ = this.isMobileSubject.asObservable();
  public isOpen$ = this.isOpenSubject.asObservable();

  // Navigation items
  public navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'home',
      route: '/dashboard',
    },
    {
      id: 'upload',
      label: 'Upload',
      icon: 'upload_2',
      route: '/upload',
    },
    {
      id: 'history',
      label: 'History',
      icon: 'history',
      route: '/history',
    },
    {
      id: 'help',
      label: 'Help',
      icon: 'help_outline',
      route: '/help',
    },
  ];

  public bottomNavItems: NavItem[] = [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      route: '/settings',
    },
  ];

  constructor() {
    this.initializeResponsiveListener();
  }

  // Getters for current state
  get isCollapsed(): boolean {
    return this.isCollapsedSubject.value;
  }

  get isMobile(): boolean {
    return this.isMobileSubject.value;
  }

  get isOpen(): boolean {
    return this.isOpenSubject.value;
  }

  // Toggle methods
  toggleCollapsed(): void {
    if (!this.isMobile) {
      this.isCollapsedSubject.next(!this.isCollapsed);
    }
  }

  toggleMobileMenu(): void {
    if (this.isMobile) {
      this.isOpenSubject.next(!this.isOpen);
    }
  }

  closeMobileMenu(): void {
    if (this.isMobile) {
      this.isOpenSubject.next(false);
    }
  }

  // Set active nav item based on current route
  setActiveRoute(route: string): void {
    // Reset all items
    this.navItems.forEach((item) => (item.isActive = false));
    this.bottomNavItems.forEach((item) => (item.isActive = false));

    // Set active item
    const allItems = [...this.navItems, ...this.bottomNavItems];
    const activeItem = allItems.find((item) => route.startsWith(item.route));
    if (activeItem) {
      activeItem.isActive = true;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Initialize responsive behavior
  private initializeResponsiveListener(): void {
    if (typeof window !== 'undefined') {
      this.checkScreenSize();

      // Use RxJS fromEvent with debounceTime for better performance and cleanup
      fromEvent(window, 'resize')
        .pipe(
          debounceTime(150), // 150ms debounce delay
          takeUntil(this.destroy$),
        )
        .subscribe(() => this.checkScreenSize());
    }
  }

  private checkScreenSize(): void {
    const isMobile = window.innerWidth < 768;
    this.isMobileSubject.next(isMobile);

    // Auto-close mobile menu when switching to desktop
    if (!isMobile && this.isOpen) {
      this.isOpenSubject.next(false);
    }

    // Auto-expand when switching to desktop if collapsed
    if (!isMobile && this.isCollapsed) {
      this.isCollapsedSubject.next(false);
    }
  }
}
