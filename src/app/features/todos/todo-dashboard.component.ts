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
            <h2>Pending Tasks ({{ pendingTodos().length }})</h2>
            <div class="task-list">
              <div class="task-card" *ngFor="let todo of pendingTodos()">
                <div class="task-content">
                  <h3>{{ todo.title }}</h3>
                  <p>{{ todo.description }}</p>
                  <small>Created: {{ todo.createdAt | date:'short' }}</small>
                </div>
                <div class="task-actions">
                  <button class="icon-btn success" (click)="completeTodo(todo.id)">✓ Complete</button>
                  <button class="icon-btn warning" (click)="editTodo(todo)">✎ Edit</button>
                  <button class="icon-btn danger" (click)="deleteTodo(todo.id)">✗ Delete</button>
                </div>
              </div>
              <div *ngIf="pendingTodos().length === 0" class="empty-state">
                <p>No pending tasks. Great job!</p>
              </div>
            </div>
          </div>

          <div class="tasks-section mt-4">
            <h2>Completed Tasks ({{ completedTodos().length }})</h2>
            <div class="task-list">
              <div class="task-card completed" *ngFor="let todo of completedTodos()">
                <div class="task-content">
                  <h3><del>{{ todo.title }}</del></h3>
                  <p><del>{{ todo.description }}</del></p>
                  <small>Updated: {{ todo.updatedAt | date:'short' }}</small>
                </div>
                <div class="task-actions">
                  <button class="icon-btn" (click)="pendingTodo(todo.id)">↺ Revert</button>
                  <button class="icon-btn danger" (click)="deleteTodo(todo.id)">✗ Delete</button>
                </div>
              </div>
              <div *ngIf="completedTodos().length === 0" class="empty-state">
                <p>No completed tasks yet.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class TodoDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private todoService = inject(TodoService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  todos = signal<Todo[]>([]);
  isEditing = signal(false);
  editingId = signal<number | null>(null);

  pendingTodos = computed(() => this.todos().filter(t => !t.isCompleted));
  completedTodos = computed(() => this.todos().filter(t => t.isCompleted));

  todoForm = this.fb.group({
    title: ['', Validators.required],
    description: ['']
  });

  ngOnInit() {
    this.loadTodos();
  }

  loadTodos() {
    this.todoService.getTodos().subscribe({
      next: (data) => this.todos.set(data),
      error: (err) => console.error(err)
    });
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
