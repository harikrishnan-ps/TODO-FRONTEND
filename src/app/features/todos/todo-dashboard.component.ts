import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TodoService } from '../../core/services/todo.service';
import { AuthService } from '../../core/services/auth.service';
import { Todo } from '../../core/models/todo.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-todo-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dashboard-layout">
      <header class="app-header">
        <h1>Todo Application</h1>
        <div class="user-info">
          <span>Welcome, {{ authService.currentUser()?.name }}</span>
          <button class="logout-btn" (click)="logout()">Logout</button>
        </div>
      </header>

      <main class="dashboard-content">
        <div class="left-panel">
          <div class="card">
            <h2>{{ isEditing() ? 'Edit Task' : 'Add Task' }}</h2>
            <form [formGroup]="todoForm" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label>Title</label>
                <input formControlName="title" placeholder="Task title" />
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea formControlName="description" placeholder="Task description"></textarea>
              </div>
              
              <div class="form-actions">
                <button type="submit" [disabled]="todoForm.invalid" class="primary-btn">
                  {{ isEditing() ? 'Update Task' : 'Add Task' }}
                </button>
                <button type="button" *ngIf="isEditing()" (click)="cancelEdit()" class="secondary-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="right-panel">
          <div class="tasks-section">
            <div class="view-toggles">
              <button 
                [class.active]="viewMode() === 'pending'" 
                (click)="setViewMode('pending')" 
                class="toggle-btn">
                Pending ({{ pendingTodos().length }})
              </button>
              <button 
                [class.active]="viewMode() === 'completed'" 
                (click)="setViewMode('completed')" 
                class="toggle-btn">
                Completed ({{ completedTodos().length }})
              </button>
            </div>

            <div class="task-list">
              <div class="task-card" [class.completed]="viewMode() === 'completed'" *ngFor="let todo of paginatedTodos()">
                <div class="task-content">
                  <h3 *ngIf="viewMode() === 'pending'">{{ todo.title }}</h3>
                  <h3 *ngIf="viewMode() === 'completed'"><del>{{ todo.title }}</del></h3>
                  
                  <p *ngIf="viewMode() === 'pending'">{{ todo.description }}</p>
                  <p *ngIf="viewMode() === 'completed'"><del>{{ todo.description }}</del></p>
                  
                  <small *ngIf="viewMode() === 'pending'">Created: {{ todo.createdAt | date:'short' }}</small>
                  <small *ngIf="viewMode() === 'completed'">Updated: {{ todo.updatedAt | date:'short' }}</small>
                </div>
                
                <div class="task-actions" *ngIf="viewMode() === 'pending'">
                  <button class="icon-btn success" (click)="completeTodo(todo.id)">✓ Complete</button>
                  <button class="icon-btn warning" (click)="editTodo(todo)">✎ Edit</button>
                  <button class="icon-btn danger" (click)="deleteTodo(todo.id)">✗ Delete</button>
                </div>
                
                <div class="task-actions" *ngIf="viewMode() === 'completed'">
                  <button class="icon-btn" (click)="pendingTodo(todo.id)">↺ Revert</button>
                  <button class="icon-btn danger" (click)="deleteTodo(todo.id)">✗ Delete</button>
                </div>
              </div>
              
              <div *ngIf="paginatedTodos().length === 0" class="empty-state">
                <p *ngIf="viewMode() === 'pending'">No pending tasks. Great job!</p>
                <p *ngIf="viewMode() === 'completed'">No completed tasks yet.</p>
              </div>
            </div>

            <!-- Pagination Controls -->
            <div class="pagination-controls" *ngIf="totalPages() > 0">
              <button 
                class="pagination-btn" 
                [disabled]="currentPage() === 1" 
                (click)="prevPage()">
                Back
              </button>
              <span>Page {{ currentPage() }} of {{ totalPages() }}</span>
              <button 
                class="pagination-btn" 
                [disabled]="currentPage() === totalPages()" 
                (click)="nextPage()">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .view-toggles {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .toggle-btn {
      flex: 1;
      padding: 0.75rem;
      border: 2px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      color: #64748b;
      transition: all 0.2s ease;
    }
    .toggle-btn.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }
    .toggle-btn:hover:not(.active) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    .pagination-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }
    .pagination-btn {
      padding: 0.5rem 1rem;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      color: #475569;
      transition: all 0.2s;
    }
    .pagination-btn:not(:disabled):hover {
      background: #e2e8f0;
      color: #1e293b;
    }
    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class TodoDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private todoService = inject(TodoService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  todos = signal<Todo[]>([]);
  isEditing = signal(false);
  editingId = signal<number | null>(null);

  // Pagination & Filters
  viewMode = signal<'pending' | 'completed'>('pending');
  currentPage = signal(1);
  pageSize = 4;

  pendingTodos = computed(() => this.todos().filter(t => !t.isCompleted));
  completedTodos = computed(() => this.todos().filter(t => t.isCompleted));
  
  filteredTodos = computed(() => {
    return this.viewMode() === 'pending' ? this.pendingTodos() : this.completedTodos();
  });

  totalPages = computed(() => Math.ceil(this.filteredTodos().length / this.pageSize));

  paginatedTodos = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return this.filteredTodos().slice(startIndex, startIndex + this.pageSize);
  });

  todoForm = this.fb.group({
    title: ['', Validators.required],
    description: ['']
  });

  ngOnInit() {
    this.loadTodos();
  }

  loadTodos() {
    this.todoService.getTodos().subscribe({
      next: (data) => {
        this.todos.set(data);
        // Adjust current page if it's out of bounds after data update
        if (this.currentPage() > this.totalPages() && this.totalPages() > 0) {
          this.currentPage.set(this.totalPages());
        }
      },
      error: (err) => console.error(err)
    });
  }

  setViewMode(mode: 'pending' | 'completed') {
    this.viewMode.set(mode);
    this.currentPage.set(1); // Reset to first page when changing tabs
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  onSubmit() {
    if (this.todoForm.invalid) return;

    if (this.isEditing() && this.editingId() !== null) {
      this.todoService.updateTodo(this.editingId()!, this.todoForm.value as any).subscribe({
        next: () => {
          this.loadTodos();
          this.cancelEdit();
        }
      });
    } else {
      this.todoService.createTodo(this.todoForm.value as any).subscribe({
        next: () => {
          this.loadTodos();
          this.todoForm.reset();
          // Switch to pending view when adding new tasks
          if (this.viewMode() === 'completed') {
            this.setViewMode('pending');
          }
        }
      });
    }
  }

  editTodo(todo: Todo) {
    this.isEditing.set(true);
    this.editingId.set(todo.id);
    this.todoForm.patchValue({
      title: todo.title,
      description: todo.description
    });
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.todoForm.reset();
  }

  completeTodo(id: number) {
    this.todoService.completeTodo(id).subscribe(() => this.loadTodos());
  }

  pendingTodo(id: number) {
    this.todoService.pendingTodo(id).subscribe(() => this.loadTodos());
  }

  deleteTodo(id: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.todoService.deleteTodo(id).subscribe(() => this.loadTodos());
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
