// A simple test to verify testing setup
import { describe, expect, it } from '@jest/globals';

// Utility functions to test (we'll extract these from POS in a real app)
function calculateTotal(netWeight: number, goldRate: number, makingCharges: number) {
  return (netWeight * goldRate) + makingCharges;
}

function calculateGST(subtotal: number, gstRate: number = 0.03) {
  return subtotal * gstRate;
}

describe('Billing Calculations', () => {
  it('should calculate the item total correctly', () => {
    const netWeight = 10;
    const goldRate = 6000;
    const makingCharges = 2000;
    
    const total = calculateTotal(netWeight, goldRate, makingCharges);
    expect(total).toBe(62000); // (10 * 6000) + 2000
  });

  it('should calculate 3% GST correctly', () => {
    const subtotal = 100000;
    const gst = calculateGST(subtotal);
    expect(gst).toBe(3000);
  });
});
