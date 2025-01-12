import React, { useState, useRef, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

const ConfigSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('simple');
  const dropdownRef = useRef(null);

  // Cerrar el menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVerificationChange = (value) => {
    setVerificationMethod(value);
    toast.success(`Método de verificación actualizado a ${value === 'simple' ? 'Simple' : 'NFC'}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
      >
        <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Configuración
            </h3>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Método de Verificación
              </p>
              <div className="space-y-2">
                {/* Opción Simple */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative flex items-center">
                    <input
                      type="radio"
                      className="before:content[''] peer relative h-5 w-5 cursor-pointer appearance-none rounded-full border border-gray-300 dark:border-gray-600 text-blue-600 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-blue-600 checked:before:bg-blue-600 hover:before:opacity-10"
                      name="verification"
                      value="simple"
                      checked={verificationMethod === 'simple'}
                      onChange={(e) => handleVerificationChange(e.target.value)}
                    />
                    <span className="absolute text-blue-600 transition-opacity opacity-0 pointer-events-none peer-checked:opacity-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mt-0.5 ml-0.5" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="8" cy="8" r="4"/>
                      </svg>
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Verificación Simple
                  </span>
                </label>

                {/* Opción NFC */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative flex items-center">
                    <input
                      type="radio"
                      className="before:content[''] peer relative h-5 w-5 cursor-pointer appearance-none rounded-full border border-gray-300 dark:border-gray-600 text-blue-600 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity checked:border-blue-600 checked:before:bg-blue-600 hover:before:opacity-10"
                      name="verification"
                      value="nfc"
                      checked={verificationMethod === 'nfc'}
                      onChange={(e) => handleVerificationChange(e.target.value)}
                    />
                    <span className="absolute text-blue-600 transition-opacity opacity-0 pointer-events-none peer-checked:opacity-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mt-0.5 ml-0.5" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="8" cy="8" r="4"/>
                      </svg>
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Verificación NFC
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigSettings;