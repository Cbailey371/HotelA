import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';

const BarcodeScanner = ({ onScan, onClose }) => {
    const scannerRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                // Success callback
                onScan(decodedText);
                // Optional: Cleanup immediately or keep scanning?
                // Usually for receiving we might want to scan multiple items.
                // But let's let the parent decide if they want to close or show a toast.
            },
            (errorMessage) => {
                // Error callback (scanning in progress, no code found yet)
                // We can ignore this usually
                // console.log(errorMessage);
            }
        );

        scannerRef.current = scanner;

        // Cleanup function
        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
                } catch (e) {
                    console.error("Scanner cleanup error", e);
                }
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                        <Camera className="w-5 h-5 text-blue-500" />
                        Escanear Código
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 bg-black">
                    <div id="reader" className="overflow-hidden rounded-lg bg-white"></div>
                    {error && (
                        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}
                </div>

                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                    Apunta la cámara al código de barras o QR del producto.
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;
