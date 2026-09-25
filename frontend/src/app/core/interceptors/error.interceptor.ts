import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NetworkStatusService } from '../services/network-status.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const networkStatusService = inject(NetworkStatusService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Détection de panne du backend (statut 0 = connexion refusée/CORS bloqué/réseau coupé, 502/503/504 = gateway)
      if (error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504) {
        networkStatusService.setBackendDown(
          'Le serveur backend ne répond pas. Vérifiez que le service Docker Spring Boot est démarré.'
        );
      } else if (error.status === 401 && !req.url.includes('/api/auth/login')) {
        // Token expiré ou invalide
        authService.logout();
      } else if (error.status >= 200 && error.status < 300) {
        networkStatusService.setBackendUp();
      }

      return throwError(() => error);
    })
  );
};
