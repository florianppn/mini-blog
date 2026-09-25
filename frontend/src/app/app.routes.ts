import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { ArticleListComponent } from './features/articles/article-list/article-list.component';
import { ArticleDetailComponent } from './features/articles/article-detail/article-detail.component';
import { ArticleFormComponent } from './features/articles/article-form/article-form.component';
import { MyDraftsComponent } from './features/drafts/my-drafts.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

export const routes: Routes = [
  { path: '', redirectTo: 'articles', pathMatch: 'full' },
  { path: 'articles', component: ArticleListComponent },
  { path: 'articles/nouveau', component: ArticleFormComponent, canActivate: [authGuard] },
  { path: 'articles/:id', component: ArticleDetailComponent },
  { path: 'articles/:id/editer', component: ArticleFormComponent, canActivate: [authGuard] },
  { path: 'mes-brouillons', component: MyDraftsComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: 'articles' }
];
