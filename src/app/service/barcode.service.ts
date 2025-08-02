import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { AlertController } from '@ionic/angular';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

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
      console.log('Starting barcode scan process...');
      
      // Request permissions first
      console.log('Requesting camera permissions...');
      const permissions = await BarcodeScanner.requestPermissions();
      console.log('Permission result:', permissions);
      
      if (permissions.camera !== 'granted') {
        await this.showAlert('Permission Required', 'Camera permission needed for scanning');
        return null;
      }

      console.log('Camera permission granted, checking module availability...');
      
      // Check if Google Barcode Scanner module is available
      const isAvailable = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
      console.log('Module available:', isAvailable);
      
      if (!isAvailable) {
        console.log('Installing Google Barcode Scanner module...');
        
        // Show installation progress alert
        const installAlert = await this.alertController.create({
          header: 'Installing Scanner',
          message: 'Installing barcode scanner module. This may take a moment and requires internet connection...',
          buttons: []
        });
        await installAlert.present();
        
        try {
          // Listen for installation progress
          const progressListener = await BarcodeScanner.addListener(
            'googleBarcodeScannerModuleInstallProgress',
            (event) => {
              console.log('Installation progress:', event.progress);
            }
          );
          
          await BarcodeScanner.installGoogleBarcodeScannerModule();
          progressListener.remove();
          await installAlert.dismiss();
          
          console.log('Module installed successfully');
          
          // Show success message
          await this.showAlert('Installation Complete', 'Barcode scanner installed. Tap scan again to start scanning.');
          return null; // Return null so user taps scan again
          
        } catch (installError) {
          await installAlert.dismiss();
          console.error('Failed to install module:', installError);
          await this.showAlert('Installation Failed', 'Failed to install barcode scanner. Please ensure you have a stable internet connection and Google Play Services is updated.');
          return null;
        }
      }

      console.log('Starting camera scan...');
      
      // Start scanning with camera UI
      const result = await BarcodeScanner.scan({
        formats: [], // Empty array means all formats are supported
      });
      
      console.log('Scan result:', result);
      
      if (result.barcodes && result.barcodes.length > 0) {
        console.log('Barcode found:', result.barcodes[0].rawValue);
        return result.barcodes[0].rawValue;
      }
      
      console.log('No barcode detected');
      return null;

    } catch (error) {
      console.error('Barcode scan error:', error);
      
      // Check if user cancelled
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as any).message.toLowerCase();
        if (errorMessage.includes('cancelled') || errorMessage.includes('canceled') || errorMessage.includes('user_canceled')) {
          console.log('User cancelled scan');
          return null;
        }
        
        // Handle specific error cases
        if (errorMessage.includes('module_not_available') || errorMessage.includes('module is not available')) {
          await this.showAlert('Module Installation Required', 'The barcode scanner module needs to be installed. Please tap "Tap to Scan" again to install it.');
          return null;
        }
        
        if (errorMessage.includes('permission')) {
          await this.showAlert('Permission Denied', 'Camera permission is required for barcode scanning.');
          return null;
        }
        
        if (errorMessage.includes('google play services')) {
          await this.showAlert('Google Play Services Required', 'Please update Google Play Services to use barcode scanning.');
          return null;
        }
      }
      
      await this.showAlert('Scan Failed', 'Barcode scanning failed. Please try again or ensure you have internet connection for first-time setup.');
      return null;
    }
  }

  /**
   * Check if product contains user's allergens using OpenFoodFacts API
   */
  async checkProductForAllergens(barcode: string, userAllergens: string[]): Promise<{
    status: 'safe' | 'warning' | 'contains_allergen';
    matchingAllergens: string[];
    productName?: string;
    ingredients?: string;
  }> {
    try {
      // Fetch product data from OpenFoodFacts API
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status !== 1) {
        // Product not found, return unknown status
        return {
          status: 'warning',
          matchingAllergens: [],
          productName: 'Unknown Product',
          ingredients: 'Product information not available'
        };
      }

      const product = data.product;
      const productName = product.product_name || 'Unnamed Product';
      const ingredients = product.ingredients_text || '';
      const allergens = product.allergens || '';
      
      // Combine ingredients and allergens for checking
      const productText = `${ingredients} ${allergens}`.toLowerCase();
      
      // Find matching allergens
      const matchingAllergens = userAllergens.filter(allergen => {
        const allergenLower = allergen.toLowerCase();
        return productText.includes(allergenLower) || 
               productText.includes(allergenLower.replace(/s$/, '')) || // singular form
               productText.includes(`${allergenLower}s`); // plural form
      });

      // Determine alert level
      let status: 'safe' | 'warning' | 'contains_allergen';
      
      if (matchingAllergens.length === 0) {
        status = 'safe';
      } else {
        // Check if it's a severe allergen (peanuts, shellfish, etc.)
        const severeAllergens = ['peanuts', 'shellfish', 'tree nuts', 'eggs', 'dairy', 'milk'];
        const hasSevereAllergen = matchingAllergens.some(allergen => 
          severeAllergens.some(severe => allergen.toLowerCase().includes(severe))
        );
        
        status = hasSevereAllergen ? 'contains_allergen' : 'warning';
      }

      // Show appropriate alert
      await this.showAllergenAlert(status, matchingAllergens, productName);

      return {
        status,
        matchingAllergens,
        productName,
        ingredients
      };

    } catch (error) {
      console.error('Error checking allergens:', error);
      await this.showAlert('Error', 'Unable to check product allergens. Please try again.');
      
      return {
        status: 'warning',
        matchingAllergens: [],
        productName: 'Unknown Product',
        ingredients: 'Error loading product data'
      };
    }
  }

  /**
   * Show allergen alert based on detection level
   */
  private async showAllergenAlert(status: 'safe' | 'warning' | 'contains_allergen', allergens: string[], productName: string): Promise<void> {
    let header: string;
    let message: string;
    let cssClass: string;

    switch (status) {
      case 'safe':
        header = '✅ SAFE TO CONSUME';
        message = `${productName} appears safe based on your allergy profile. No known allergens detected.`;
        cssClass = 'alert-success';
        break;

      case 'warning':
        header = '⚠️ WARNING - CHECK INGREDIENTS';
        message = `${productName} may contain: ${allergens.join(', ')}. Please check the full ingredient list carefully.`;
        cssClass = 'alert-warning';
        break;

      case 'contains_allergen':
        header = '🚨 DANGER - CONTAINS ALLERGENS';
        message = `${productName} contains known allergens: ${allergens.join(', ')}. DO NOT CONSUME!`;
        cssClass = 'alert-danger';
        break;
    }

    const alert = await this.alertController.create({
      header,
      message,
      cssClass,
      buttons: [
        {
          text: 'View Details',
          handler: () => {
            // Could open detailed ingredient view
            console.log('Show detailed ingredients for:', productName);
          }
        },
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
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
