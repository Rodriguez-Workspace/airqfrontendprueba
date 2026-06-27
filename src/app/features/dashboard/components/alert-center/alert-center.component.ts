import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../core/services/notification.service';
import { ClientNotificationItem } from '../../../../core/models/notification.model';

@Component({
  selector: 'app-alert-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-center.component.html',
  styleUrl: './alert-center.component.css'
})
export class AlertCenterComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  notifications: ClientNotificationItem[] = [];
  filteredNotifications: ClientNotificationItem[] = [];
  
  activeFilter: 'ALL' | 'AI_ACTION' | 'HARDWARE_FAILURE' | 'UNREAD' = 'ALL';
  isLoading = true;
  private pollingInterval: any;

  ngOnInit(): void {
    this.loadNotifications();
    // Iniciar polling silencioso cada 5 segundos
    this.pollingInterval = setInterval(() => {
      this.fetchNotificationsSilently();
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.fetchNotificationsSilently();
  }

  private fetchNotificationsSilently(): void {
    this.notificationService.getNotifications().subscribe({
      next: (data) => {
        this.notifications = data;
        this.applyFilter(this.activeFilter);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching notifications', err);
        this.isLoading = false;
      }
    });
  }



  applyFilter(filter: 'ALL' | 'AI_ACTION' | 'HARDWARE_FAILURE' | 'UNREAD'): void {
    this.activeFilter = filter;
    
    switch (filter) {
      case 'AI_ACTION':
        this.filteredNotifications = this.notifications.filter(n => n.type === 'AI_ACTION');
        break;
      case 'HARDWARE_FAILURE':
        this.filteredNotifications = this.notifications.filter(n => n.type === 'HARDWARE_FAILURE');
        break;
      case 'UNREAD':
        this.filteredNotifications = this.notifications.filter(n => !n.isRead);
        break;
      default:
        this.filteredNotifications = [...this.notifications];
        break;
    }
  }

  markAsRead(id: number): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        // Update local state
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
          notification.isRead = true;
        }
        // Reapply current filter
        this.applyFilter(this.activeFilter);
      },
      error: console.error
    });
  }

  requestTechSupport(notification: ClientNotificationItem): void {
    // We could pass query params to the support form if needed
    // this.router.navigate(['/support'], { queryParams: { location: notification.location } });
    
    // As requested, this links to support. 
    // Wait, the client dashboard handles tabs using 'activeView'.
    // We need to emit an event or route if we are using Angular router.
    // In DashboardComponent, views are changed via activeView variable.
    // I will dispatch a custom event or we can just tell the parent to change view.
    
    // For now, let's just trigger a global custom event since we are inside a child component.
    const event = new CustomEvent('navigate-to-support', { 
      detail: { location: notification.location, description: notification.diagnosis } 
    });
    window.dispatchEvent(event);
  }
}
