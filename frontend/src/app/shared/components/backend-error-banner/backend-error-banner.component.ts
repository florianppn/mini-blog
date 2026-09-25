import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkStatusService } from '../../../core/services/network-status.service';

@Component({
  selector: 'app-backend-error-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './backend-error-banner.component.html'
})
export class BackendErrorBannerComponent {
  networkService = inject(NetworkStatusService);
}
