import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class BarcodeService {

  constructor(private alertController: AlertController) {}

  /**
   * Scan barcode and return result
   */
  async scanBarcode(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      await this.showAlert('Not Available', 'Barcode scanning only works on mobile devices');
      return null;
    }

    try {
      // Check if the package is available
      const BarcodeScanner = await this.getBarcodeScanner();
      if (!BarcodeScanner) {
        await this.showAlert('Package Missing', 'Please install @capacitor-mlkit/barcode-scanning package first');
        return null;
      }
      
      // Request permissions
      const permissions = await BarcodeScanner.requestPermissions();
      if (permissions.camera !== 'granted') {
        await this.showAlert('Permission Required', 'Camera permission needed for scanning');
        return null;
      }

      // Start scanning
      await BarcodeScanner.startScan();

      // Listen for results
      return new Promise((resolve) => {
        const listener = BarcodeScanner.addListener('barcodeScanned', async (result: any) => {
          await BarcodeScanner.stopScan();
          listener.remove();
          resolve(result.barcode.rawValue);
        });
      });

    } catch (error) {
      console.error('Barcode scan error:', error);
      await this.showAlert('Scan Failed', 'Please try scanning again');
      return null;
    }
  }

  /**
   * Safely get BarcodeScanner without compile errors
   */
  private async getBarcodeScanner(): Promise<any> {
    try {
      // Use eval to prevent TypeScript from checking this at compile time
      const packageName = '@capacitor-mlkit/barcode-scanning';
      const module = await eval(`import('${packageName}')`);
      return module.BarcodeScanner;
    } catch (error) {
      console.warn('Barcode scanning package not available:', error);
      return null;
    }
  }

  /**
   * Check if product contains user's allergens (basic check)
   */
  async checkProductForAllergens(barcode: string, userAllergens: string[]): Promise<void> {
    // Mock allergen database - replace with real API
    const productAllergens: { [key: string]: string[] } = {
      '123456789012': ['wheat', 'eggs', 'dairy'],
      '098765432109': ['peanuts'],
      '456789012345': ['soy', 'dairy']
    };

    const foundAllergens = productAllergens[barcode] || [];
    const matchingAllergens = userAllergens.filter(allergen => 
      foundAllergens.some(product => product.includes(allergen.toLowerCase()))
    );

    if (matchingAllergens.length > 0) {
      await this.showAlert(
        '⚠️ ALLERGEN ALERT!', 
        `This product contains: ${matchingAllergens.join(', ')}`
      );
    } else {
      await this.showAlert('✅ Safe', 'No known allergens detected');
    }
  }

  private async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
