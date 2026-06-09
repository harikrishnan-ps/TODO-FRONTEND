import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'todos', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) 
  },
  { 
    path: 'todos', 
    loadComponent: () => import('./features/todos/todo-dashboard.component').then(m => m.TodoDashboardComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'todos' }
];
