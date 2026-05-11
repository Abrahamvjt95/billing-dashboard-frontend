import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  UserResponse
} from '../models/auth.models';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = `${environment.apiUrl}/auth`;

  private readonly _currentUser = signal<UserResponse | null>(this.loadUserFromStorage());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  login(body: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.base}/login`, body).pipe(
      tap(res => this.storeSession(res))
    );
  }

  register(body: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.base}/register`, body).pipe(
      tap(res => this.storeSession(res))
    );
  }

  refresh(body: RefreshTokenRequest) {
    return this.http.post<AuthResponse>(`${this.base}/refresh`, body).pipe(
      tap(res => this.storeSession(res))
    );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('user');
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    this._currentUser.set(res.user);
  }

  private loadUserFromStorage(): UserResponse | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }
}
