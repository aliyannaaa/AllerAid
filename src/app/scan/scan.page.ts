import { Component } from '@angular/core';
import { ProductService } from '../service/product.service';
import { BarcodeService } from '../service/barcode.service';

@Component({
  selector: 'app-scan',
  templateUrl: './scan.page.html',
  styleUrls: ['./scan.page.scss'],
  standalone: false,
})
export class ScanPage {
  manualBarcode: string = '';
  productInfo: any = null;
  allergenStatus: 'safe' | 'warning' | null = null;
  ingredientsToWatch: string[] = [];

  // Hardcoded user allergen list (can later be dynamic)
  userAllergens: string[] = ['peanuts', 'shellfish', 'eggs', 'dairy', 'soy'];

  constructor(
    private productService: ProductService,
    private barcodeService: BarcodeService
  ) {}

  scanAndFetchProduct(barcode: string) {
    if (!barcode || barcode.trim() === '') {
      alert('Please enter a valid barcode.');
      return;
    }

    // Show loading state
    this.productInfo = null;
    this.allergenStatus = null;
    this.ingredientsToWatch = [];

    this.productService.getProduct(barcode).subscribe(async (data: any) => {
      if (data.status === 1) {
        const product = data.product;
        this.productInfo = product;

        // Use enhanced allergen detection
        const allergenResult = await this.barcodeService.checkProductForAllergens(barcode, this.userAllergens);
        
        // Map the new status to your existing UI
        switch (allergenResult.status) {
          case 'safe':
            this.allergenStatus = 'safe';
            this.ingredientsToWatch = [];
            break;
          case 'warning':
          case 'contains_allergen':
            this.allergenStatus = 'warning';
            this.ingredientsToWatch = allergenResult.matchingAllergens;
            break;
        }

        console.log('Allergen Status:', this.allergenStatus);
        console.log('Ingredients to watch:', this.ingredientsToWatch);
        console.log('Detection result:', allergenResult);
      } else {
        alert('Product not found in OpenFoodFacts.');
        this.productInfo = null;
        this.allergenStatus = null;
        this.ingredientsToWatch = [];
      }
    });
  }

  // Function to handle camera scanning
  async startCameraScan() {
    try {
      console.log('Starting camera scan...');
      
      const scannedBarcode = await this.barcodeService.scanBarcode();
      
      if (scannedBarcode) {
        console.log('Scanned barcode:', scannedBarcode);
        // Use the scanned barcode to fetch product info
        this.scanAndFetchProduct(scannedBarcode);
        // Also update the manual input field with the scanned code
        this.manualBarcode = scannedBarcode;
      } else {
        console.log('No barcode scanned or scan cancelled');
      }
    } catch (error) {
      console.error('Error during barcode scan:', error);
      // The error is already handled in the barcode service, so no need to show another alert here
    }
  }
}
