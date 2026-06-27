import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService, Ticket } from '../../../../core/services/ticket.service';
import { TechService } from '../../../../core/services/tech.service';

@Component({
  selector: 'app-ticket-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ticket-management.component.html',
  styleUrls: ['./ticket-management.component.css']
})
export class TicketManagementComponent implements OnInit {
  private ticketService = inject(TicketService);
  private techService = inject(TechService);
  private cdr = inject(ChangeDetectorRef);

  tickets: Ticket[] = [];
  technicians: any[] = [];
  isLoading = true;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.techService.getTechnicians().subscribe({
      next: (techs) => {
        this.technicians = techs;
        this.loadTickets();
      },
      error: (err) => {
        console.error('Error fetching technicians', err);
        this.loadTickets(); // Load tickets anyway
      }
    });
  }

  loadTickets() {
    this.ticketService.getTickets().subscribe({
      next: (data) => {
        // Mock data for display if the database is empty just so we can see the Kanban board.
        // In real usage, the backend will provide these.
        if (data.length === 0) {
          this.tickets = [
            {
              ticketId: '1',
              ticketNumber: '#TK-0042',
              clientName: 'Colegio San Marcos',
              category: 'Falla de Hardware',
              priority: 'Alto',
              issueDescription: 'Sensor de laboratorio no reporta datos',
              status: 'OPEN',
              createdAt: new Date().toISOString()
            },
            {
              ticketId: '2',
              ticketNumber: '#TK-0043',
              clientName: 'Instituto Delta',
              category: 'Soporte de Software',
              priority: 'Medio',
              issueDescription: 'No pueden acceder al dashboard',
              status: 'IN_PROGRESS',
              technicianId: this.technicians.length > 0 ? this.technicians[0].id : undefined,
              createdAt: new Date().toISOString()
            },
            {
              ticketId: '3',
              ticketNumber: '#TK-0044',
              clientName: 'Colegio San Marcos',
              category: 'Instalación',
              priority: 'Bajo',
              issueDescription: 'Instalación de 2 sensores nuevos',
              status: 'RESOLVED',
              createdAt: new Date().toISOString(),
              resolvedAt: new Date().toISOString()
            }
          ];
        } else {
          this.tickets = data;
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading tickets', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get openTickets() { return this.tickets.filter(t => t.status === 'OPEN'); }
  get inProgressTickets() { return this.tickets.filter(t => t.status === 'IN_PROGRESS'); }
  get resolvedTickets() { return this.tickets.filter(t => t.status === 'RESOLVED'); }

  assignTechnician(ticket: Ticket, techId: string) {
    if (!techId) return;
    // Update locally immediately for UX
    ticket.technicianId = techId;
    ticket.status = 'IN_PROGRESS';
    this.cdr.detectChanges();
    
    // In a real scenario we use real UUIDs. The mock data has '1', '2' which might fail in backend.
    if (ticket.ticketId.length > 10) {
      this.ticketService.assignTechnician(ticket.ticketId, techId).subscribe({
        next: () => console.log('Técnico asignado exitosamente'),
        error: (err) => console.error('Error al asignar técnico', err)
      });
    }
  }

  resolveTicket(ticket: Ticket) {
    // Update locally immediately for UX
    ticket.status = 'RESOLVED';
    ticket.resolvedAt = new Date().toISOString();
    this.cdr.detectChanges();

    if (ticket.ticketId.length > 10) {
      this.ticketService.resolveTicket(ticket.ticketId).subscribe({
        next: () => console.log('Ticket resuelto exitosamente'),
        error: (err) => console.error('Error al resolver ticket', err)
      });
    }
  }

  getPriorityColor(priority: string): string {
    switch(priority?.toLowerCase()) {
      case 'alto': return '#dc3545';
      case 'medio': return '#ffc107';
      case 'bajo': return '#28a745';
      default: return '#6c757d';
    }
  }
}
