"use client";

import Barcode from "react-barcode";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface BarcodeGeneratorProps {
  value: string;
  type: "barcode" | "qrcode" | "both";
  label?: string;
}

export function BarcodeGenerator({ value, type, label }: BarcodeGeneratorProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center p-4 border rounded-lg bg-card">
      <div className="print:block flex flex-col items-center gap-4">
        {label && <p className="font-bold text-sm text-center">{label}</p>}
        
        {(type === "barcode" || type === "both") && (
          <div className="bg-white p-2 rounded">
            <Barcode 
              value={value} 
              width={1.5} 
              height={40} 
              fontSize={14} 
              margin={0} 
              displayValue={true} 
            />
          </div>
        )}
        
        {(type === "qrcode" || type === "both") && (
          <div className="bg-white p-2 rounded">
            <QRCode 
              value={value} 
              size={80} 
            />
          </div>
        )}
      </div>
      
      <Button 
        onClick={handlePrint} 
        variant="outline" 
        size="sm" 
        className="mt-4 print:hidden gap-2"
      >
        <Printer className="w-4 h-4" />
        Print Label
      </Button>
    </div>
  );
}
