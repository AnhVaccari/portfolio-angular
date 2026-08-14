import { RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './pages/about/about';
import { ContactComponent } from './pages/contact/contact';
import { HomeComponent } from './pages/home/home';
import { ProjectsComponent } from './pages/projects/projects';
import { NgModule } from '@angular/core';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Anh Vaccari — Développeuse Full-Stack Angular · Node.js · Java' },
  { path: 'about', component: AboutComponent, title: 'À propos — Anh Vaccari, développeuse full-stack Angular · Node.js · Java' },
  { path: 'projects', component: ProjectsComponent, title: 'Projets — Anh Vaccari' },
  { path: 'contact', component: ContactComponent, title: 'Contact — Anh Vaccari' },
  { path: '**', redirectTo: '' }, // redirection si URL inconnue
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
