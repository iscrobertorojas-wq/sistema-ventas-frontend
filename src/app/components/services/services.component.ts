import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule
  ],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent implements OnInit {
  services: any[] = [];
  displayedColumns: string[] = ['id', 'description', 'price', 'actions'];

  newService = {
    description: '',
    price: 0
  };

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices() {
    this.api.getServices().subscribe({
      next: (data) => this.services = data,
      error: (err) => console.error('Error loading services', err)
    });
  }

  addService() {
    if (!this.newService.description) return;

    this.api.createService(this.newService).subscribe({
      next: (res) => {
        this.loadServices();
        this.newService = { description: '', price: 0 };
      },
      error: (err) => console.error('Error creating service', err)
    });
  }
}
