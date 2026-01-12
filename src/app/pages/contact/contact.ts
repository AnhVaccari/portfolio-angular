import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class ContactComponent {
  isLoading = false;
  showSuccessMessage = false;
  contactForm = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    subject: new FormControl('', Validators.required),
    message: new FormControl('', Validators.required),
  });

  onSubmit() {
    if (this.contactForm.valid) {
      this.isLoading = true;

      // Simulation d'envoi (2 secondes)
      setTimeout(() => {
        this.isLoading = false;
        this.showSuccessMessage = true;
        this.contactForm.reset();

        // Cache le message après 3 secondes
        setTimeout(() => {
          this.showSuccessMessage = false;
        }, 3000);
      }, 2000);
    }
  }
}
