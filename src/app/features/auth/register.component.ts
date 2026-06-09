import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Register for Todo App</h2>
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          
          <div class="form-group">
            <label for="name">Name</label>
            <input id="name" type="text" formControlName="name" placeholder="Enter your name" />
            <div class="error" *ngIf="registerForm.get('name')?.touched && registerForm.get('name')?.invalid">
              Name is required.
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email" placeholder="Enter your email" />
            <div class="error" *ngIf="registerForm.get('email')?.touched && registerForm.get('email')?.invalid">
              Valid email is required.
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password" placeholder="Min 8 characters" />
            <div class="error" *ngIf="registerForm.get('password')?.touched && registerForm.get('password')?.invalid">
              Password must be at least 8 characters long.
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" type="password" formControlName="confirmPassword" placeholder="Confirm password" />
            <div class="error" *ngIf="registerForm.get('confirmPassword')?.touched && registerForm.hasError('passwordMismatch')">
              Passwords do not match.
            </div>
          </div>

          <div class="error main-error" *ngIf="errorMessage">{{ errorMessage }}</div>

          <button type="submit" [disabled]="registerForm.invalid || isLoading">
            {{ isLoading ? 'Registering...' : 'Register' }}
          </button>

          <p class="auth-link">
            Already have an account? <a routerLink="/login">Login here</a>
          </p>
        </form>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  isLoading = false;
  errorMessage = '';

  passwordMatchValidator(g: any) {
    return g.get('password').value === g.get('confirmPassword').value
      ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.router.navigate(['/todos']);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Registration failed.';
          this.isLoading = false;
        }
      });
    }
  }
}
