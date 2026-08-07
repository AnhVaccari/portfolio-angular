import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { timeout } from 'rxjs';

/** Point d'envoi Formspree : les messages arrivent dans la boîte du compte. */
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/moqgwjvk';

/** Au-delà, on considère l'envoi perdu : mieux vaut le dire que faire attendre. */
const ENVOI_TIMEOUT_MS = 10_000;

/** Durée d'affichage de la confirmation : large de quoi la lire sans la rater. */
const CONFIRMATION_VISIBLE_MS = 10_000;

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class ContactComponent {
  private http = inject(HttpClient);

  // L'application tourne sans zone.js : une écriture faite dans la réponse
  // d'une requête ne redessine pas la vue toute seule. Les signaux, eux,
  // préviennent Angular — sans ça, un échec resterait invisible à l'écran.
  readonly isLoading = signal(false);
  readonly showSuccessMessage = signal(false);
  readonly errorMessage = signal('');

  /** Adresse affichée, copiable pour qui n'a pas de messagerie configurée :
      un lien mailto ne mène nulle part sur un poste sans client mail. */
  readonly email = 'anh.vaccari@gmail.com';

  /** 'repos' | 'copie' (réussi) | 'echec' (presse-papier refusé). */
  readonly copyState = signal<'repos' | 'copie' | 'echec'>('repos');

  async copyEmail() {
    // On ne signale la copie que si elle a vraiment eu lieu.
    const copie = await this.ecrireDansLePressePapier(this.email);
    this.copyState.set(copie ? 'copie' : 'echec');
    setTimeout(() => this.copyState.set('repos'), 2500);
  }

  private async ecrireDansLePressePapier(texte: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(texte);
      return true;
    } catch {
      // Presse-papier moderne indisponible : navigateur ancien, page servie
      // sans HTTPS, ou fenêtre sans focus. On retombe sur la vieille méthode.
      return this.copieHistorique(texte);
    }
  }

  private copieHistorique(texte: string): boolean {
    const zone = document.createElement('textarea');
    zone.value = texte;
    zone.setAttribute('readonly', '');
    zone.style.position = 'fixed';
    zone.style.opacity = '0';
    document.body.appendChild(zone);
    zone.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    document.body.removeChild(zone);
    return ok;
  }

  contactForm = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    subject: new FormControl('', Validators.required),
    message: new FormControl('', Validators.required),
  });

  private effacementConfirmation?: ReturnType<typeof setTimeout>;

  constructor() {
    // La confirmation s'efface au premier des deux : la fin du délai ci-dessus,
    // ou la reprise de la saisie. Le visiteur type n'écrit qu'une fois et s'en
    // va — sans minuterie, le message resterait à l'écran pour toujours.
    // Le message d'erreur, lui, n'a pas de minuterie : il doit rester tant que
    // le problème n'est pas traité.
    this.contactForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.showSuccessMessage.set(false);
      this.errorMessage.set('');
    });
  }

  onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.showSuccessMessage.set(false);

    // L'en-tête Accept demande une réponse JSON : sans elle, Formspree
    // répond par une redirection vers sa propre page de remerciement.
    this.http
      .post(FORMSPREE_ENDPOINT, this.contactForm.value, {
        headers: { Accept: 'application/json' },
      })
      .pipe(timeout(ENVOI_TIMEOUT_MS))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          // Vider le formulaire déclenche valueChanges, qui efface la
          // confirmation : on remet donc à zéro d'abord, on annonce ensuite.
          this.contactForm.reset();
          this.showSuccessMessage.set(true);
          clearTimeout(this.effacementConfirmation);
          this.effacementConfirmation = setTimeout(
            () => this.showSuccessMessage.set(false),
            CONFIRMATION_VISIBLE_MS
          );
        },
        error: () => {
          // Un échec doit se voir : sinon le visiteur repart en croyant avoir
          // écrit, et le message est perdu sans que personne le sache. Les
          // champs ne sont pas vidés, pour qu'il puisse réessayer.
          this.isLoading.set(false);
          this.errorMessage.set(
            "L'envoi a échoué. Réessayez, ou écrivez-moi directement à anh.vaccari@gmail.com."
          );
        },
      });
  }
}
