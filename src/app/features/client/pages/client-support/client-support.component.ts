import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../../core/services/ticket.service';

@Component({
  selector: 'app-client-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-support.component.html',
  styleUrls: ['./client-support.component.css']
})
export class ClientSupportComponent implements OnInit {
  private ticketService = inject(TicketService);
  private cdr = inject(ChangeDetectorRef);

  ticketData = {
    category: '',
    issueDescription: ''
  };

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  recentTickets: any[] = [];
  isLoadingTickets = false;

  ngOnInit() {
    this.loadRecentTickets();
  }

  loadRecentTickets() {
    this.isLoadingTickets = true;
    this.ticketService.getClientTickets().subscribe({
      next: (tickets) => {
        this.recentTickets = tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.isLoadingTickets = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching recent tickets:', err);
        this.isLoadingTickets = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit() {
    if (!this.ticketData.category || !this.ticketData.issueDescription) {
      this.errorMessage = 'Por favor, complete todos los campos obligatorios.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.ticketService.createTicket(this.ticketData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = `Su ticket ha sido creado exitosamente. Número de Ticket: ${response.ticketNumber}`;
        // Limpiar el formulario
        this.ticketData = {
          category: '',
          issueDescription: ''
        };
        this.loadRecentTickets(); // Actualizar la lista
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = 'Ocurrió un error al intentar crear el ticket. Por favor intente más tarde.';
        console.error('Error creating ticket:', err);
        this.cdr.detectChanges();
      }
    });
  }

  getStatusBadge(status: string) {
    switch (status) {
      case 'OPEN': return { class: 'bg-secondary', label: 'Abierto' };
      case 'IN_PROGRESS': return { class: 'bg-info text-dark', label: 'En Progreso' };
      case 'RESOLVED': return { class: 'bg-success', label: 'Resuelto' };
      default: return { class: 'bg-secondary', label: status };
    }
  }
}
