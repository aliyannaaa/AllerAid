import { Component } from '@angular/core';
import { ProductService } from '../service/product.service';

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

  constructor(private productService: ProductService) {}

  scanAndFetchProduct(barcode: string) {
    if (!barcode || barcode.trim() === '') {
      alert('Please enter a valid barcode.');
      return;
    }

    this.productService.getProduct(barcode).subscribe((data: any) => {
      if (data.status === 1) {
        const product = data.product;
        this.productInfo = product;

        const ingredientsText = product.ingredients_text?.toLowerCase() || '';
        this.ingredientsToWatch = [];

        const matchedAllergens = this.userAllergens.filter(allergen =>
          ingredientsText.includes(allergen.toLowerCase())
        );

        if (matchedAllergens.length > 0) {
          this.allergenStatus = 'warning';
          this.ingredientsToWatch = matchedAllergens;
        } else {
          this.allergenStatus = 'safe';
        }

        // You can now display this in your template or modal
        console.log('Allergen Status:', this.allergenStatus);
        console.log('Ingredients to watch:', this.ingredientsToWatch);
      } else {
        alert('Product not found in OpenFoodFacts.');
        this.productInfo = null;
        this.allergenStatus = null;
        this.ingredientsToWatch = [];
      }
    });
  }
}
