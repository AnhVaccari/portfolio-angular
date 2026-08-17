import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

const ORIGIN = 'https://www.anhvaccari.com';

/**
 * Met à jour <link rel="canonical"> et og:url à chaque navigation.
 *
 * Sans ça, la balise écrite en dur dans index.html est recopiée telle quelle
 * dans les quatre pages prérendues : /about, /projects et /contact déclarent
 * alors la page d'accueil comme version officielle, et Google les traite en
 * doublons plutôt que de les indexer.
 *
 * Le service tourne aussi côté prérendu : l'URL est donc figée dans le HTML
 * généré au build, sans dépendre de JavaScript côté navigateur.
 */
@Injectable({ providedIn: 'root' })
export class CanonicalService {
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  start(): void {
    this.apply(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.apply(event.urlAfterRedirects));
  }

  private apply(url: string): void {
    // Une seule forme d'URL par page : sans paramètres, sans ancre, et sans
    // slash final sauf pour la racine — deux URL différentes pour la même page
    // relanceraient le problème de doublon.
    const path = url.split(/[?#]/)[0].replace(/\/+$/, '');
    const canonical = path ? `${ORIGIN}${path}` : `${ORIGIN}/`;

    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', canonical);

    this.meta.updateTag({ property: 'og:url', content: canonical });
  }
}
