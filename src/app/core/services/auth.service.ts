import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/api/auth';
  
  isAuthenticated = signal<boolean>(this.hasToken());
  currentUser = signal<{name: string, email: string} | null>(this.getUserFromStorage());

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  private getUserFromStorage() {
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    if (name && email) return { name, email };
    return null;
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.setSession(res))
    );
  }

  login(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(res => this.setSession(res))
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  private setSession(res: AuthResponse) {
    localStorage.setItem('token', res.token);
    localStorage.setItem('userName', res.name);
    localStorage.setItem('userEmail', res.email);
    this.isAuthenticated.set(true);
    this.currentUser.set({ name: res.name, email: res.email });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
