import { Component } from '@angular/core';

@Component({
  selector: 'app-responder-dashboard',
  templateUrl: './responder-dashboard.page.html',
  styleUrls: ['./responder-dashboard.page.scss'],
  standalone: false,
})
export class ResponderDashboardPage {
  hasResponded: boolean = false;
  audio: HTMLAudioElement | null = null;

  responded() {
    if (!this.hasResponded) {
      this.hasResponded = true;
      console.log('User marked as responded.');
    }
  }

  cannotRespond() {
    alert('You have declined to respond.');
    console.log('User cannot respond to the emergency.');
  }

  navigate() {
    const mapUrl = 'https://www.google.com/maps?q=123+Main+St,+Makati+City';
    window.open(mapUrl, '_blank');
    console.log('Navigation opened:', mapUrl);
  }

  markResolved() {
    alert('Emergency marked as resolved.');
    this.hasResponded = false;
    console.log('Emergency resolved.');
  }

  playVoiceMessage() {
    const voiceURL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.audio = new Audio(voiceURL);
    this.audio.play();
    console.log('Playing voice message:', voiceURL);
  }

  speakAlert() {
    const message = new SpeechSynthesisUtterance(
      'Emergency from Juan Dela Cruz. Severe asthma attack. Location: 123 Main Street, Makati City. Bring inhaler, allergic to nuts.'
    );
    window.speechSynthesis.speak(message);
    console.log('Speaking emergency alert.');
  }
}




