import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/auth.model';

export interface EmailChangeRequest {
  newEmail: string;
  currentPassword: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AccountDeleteRequest {
  currentPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  changeEmail(request: EmailChangeRequest): Observable<AuthResponse> {
    return this.http.patch<AuthResponse>('/api/account/email', request).pipe(
      tap(response => this.authService.handleAuthSuccess(response))
    );
  }

  changePassword(request: PasswordChangeRequest): Observable<AuthResponse> {
    return this.http.patch<AuthResponse>('/api/account/password', request).pipe(
      tap(response => this.authService.handleAuthSuccess(response))
    );
  }

  deleteAccount(request: AccountDeleteRequest): Observable<void> {
    return this.http.delete<void>('/api/account', { body: request }).pipe(
      tap(() => this.authService.logout())
    );
  }
}
