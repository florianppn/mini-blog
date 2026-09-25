import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Role } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/admin/users');
  }

  updateUserRole(userId: number, role: Role): Observable<User> {
    return this.http.patch<User>(`/api/admin/users/${userId}/role`, { role });
  }
}
