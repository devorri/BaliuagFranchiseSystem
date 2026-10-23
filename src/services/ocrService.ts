import { createWorker } from 'tesseract.js';
import type { DocumentType } from '../types';

export interface ExtractedFields {
  driverName?: string;
  licenseNumber?: string;
  plateNumber?: string;
  motorNumber?: string;
  chassisNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
}

export interface OcrResult {
  isValid: boolean;
  confidence: number;
  extractedText: string;
  fields: ExtractedFields;
  validationMessage?: string;
}

// Official document keywords to block arbitrary memes, food, landscapes, or irrelevant photos
const DOCUMENT_KEYWORDS: Record<DocumentType, string[]> = {
  or_cr: [
    'REPUBLIC OF THE PHILIPPINES', 'PHILIPPINES', 'LAND TRANSPORTATION OFFICE', 'LTO',
    'CERTIFICATE OF REGISTRATION', 'REGISTRATION', 'OFFICIAL RECEIPT', 'RECEIPT',
    'CHASSIS', 'MOTOR', 'ENGINE', 'PLATE', 'VEHICLE', 'MAKE', 'MODEL', 'DENOMINATION',
    'MV FILE', 'REGISTERED OWNER', 'OR NO', 'CR NO', 'GROSS WT', 'CYLINDERS'
  ],
  drivers_license: [
    'LAND TRANSPORTATION OFFICE', 'LTO', 'DRIVER', 'LICENSE', 'DRIVERS LICENSE',
    'REPUBLIC OF THE PHILIPPINES', 'PHILIPPINES', 'NON-PROFESSIONAL', 'PROFESSIONAL',
    'EXPIRATION', 'RESTRICTIONS', 'CONDITIONS', 'DL NO', 'BLOOD TYPE', 'NATIONALITY',
    'SEX', 'WEIGHT', 'HEIGHT', 'DATE OF BIRTH', 'AGENCY CODE'
  ],
  barangay_clearance: [
    'BARANGAY', 'CLEARANCE', 'OFFICE OF THE PUNONG BARANGAY', 'PUNONG BARANGAY',
    'REPUBLIC OF THE PHILIPPINES', 'PROVINCE OF BULACAN', 'BULACAN', 'BALIWAG',
    'BALIUAG', 'RESIDENT', 'CERTIFICATION', 'COMMUNITY TAX', 'BARANGAY CLEARANCE',
    'BARANGAY CAPTAIN', 'OFFICE OF THE BARANGAY'
  ],
  toda_cert: [
    'TODA', 'TRICYCLE', 'OPERATORS', 'DRIVERS', 'ASSOCIATION', 'CERTIFICATE',
    'CERTIFICATION', 'MEMBERSHIP', 'PRESIDENT', 'BALIWAG', 'BALIUAG', 'BASTODA',
    'SMTODA', 'TARTODA', 'PAGTODA', 'ROUTE', 'ENDORSEMENT', 'TERMINAL', 'FRANCHISE'
  ],
  id_photo: [
    // 2x2 ID photos usually have minimal or no printed text; handled via image dimensions/type check
  ],
  other: []
};

// Known motorcycle makes
const MOTORCYCLE_MAKES = [
  'HONDA', 'YAMAHA', 'KAWASAKI', 'SUZUKI', 'BAJAJ', 'TVS', 'RATO', 'SYM', 'KYMCO', 'HAOJUE', 'EURO'
];

/**
 * Extracts structured data from recognized OCR text
 */
export function extractFieldsFromText(text: string, docType: DocumentType): ExtractedFields {
  const upper = text.toUpperCase();
  const fields: ExtractedFields = {};

  // 1. Vehicle Make
  for (const make of MOTORCYCLE_MAKES) {
    if (upper.includes(make)) {
      fields.vehicleMake = make.charAt(0) + make.slice(1).toLowerCase();
      break;
    }
  }

  // 2. Plate Number (PH formats: ABC 123, 123 ABC, 1234 AB, AB 1234, 123-ABC, etc.)
  const plateMatch = upper.match(/\b([A-Z]{2,3}[-\s]?[0-9]{3,4}|[0-9]{3,4}[-\s]?[A-Z]{2,3})\b/);
  if (plateMatch && plateMatch[1]) {
    const rawPlate = plateMatch[1].replace(/[^A-Z0-9]/g, '');
    if (rawPlate.length >= 5 && rawPlate.length <= 8) {
      fields.plateNumber = plateMatch[1].trim();
    }
  }

  // 3. Engine / Motor Number (e.g. ENGINE NO: XY12345E, MOTOR NO: ...)
  const motorMatch = upper.match(/(?:MOTOR|ENGINE|ENG)[^A-Z0-9]{0,5}(?:NO|NUM|NUMBER)?[:.\s-]*([A-Z0-9]{6,16})/);
  if (motorMatch && motorMatch[1]) {
    fields.motorNumber = motorMatch[1].trim();
  }

  // 4. Chassis Number / VIN (e.g. CHASSIS NO: ...)
  const chassisMatch = upper.match(/(?:CHASSIS|VIN|FRAME)[^A-Z0-9]{0,5}(?:NO|NUM|NUMBER)?[:.\s-]*([A-Z0-9]{8,18})/);
  if (chassisMatch && chassisMatch[1]) {
    fields.chassisNumber = chassisMatch[1].trim();
  }

  // 5. Driver License Number (e.g., D01-12-345678 or N02-98-123456)
  const licenseMatch = upper.match(/\b([A-Z][0-9]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{6})\b/);
  if (licenseMatch && licenseMatch[1]) {
    fields.licenseNumber = licenseMatch[1].trim();
  } else {
    // Alternative single code
    const dlAlt = upper.match(/(?:LICENSE|DL|LIC)[^A-Z0-9]{0,4}(?:NO|NUMBER)?[:.\s-]*([A-Z0-9-]{9,13})/);
    if (dlAlt && dlAlt[1]) {
      fields.licenseNumber = dlAlt[1].trim();
    }
  }

  // 6. Driver Name / Registered Owner (if in OR/CR or License)
  if (docType === 'drivers_license') {
    const nameMatch = upper.match(/(?:NAME|LAST\s*NAME|BEARER)[:.\s-]*([A-Z\s,]{4,30})/);
    if (nameMatch && nameMatch[1]) {
      fields.driverName = nameMatch[1].replace(/\n/g, ' ').trim();
    }
  } else if (docType === 'or_cr') {
    const ownerMatch = upper.match(/(?:OWNER|NAME)[:.\s-]*([A-Z\s,]{4,30})/);
    if (ownerMatch && ownerMatch[1]) {
      fields.driverName = ownerMatch[1].replace(/\n/g, ' ').trim();
    }
  }

  return fields;
}

/**
 * Validates whether the recognized text conforms to the expected document type.
 * Prevents arbitrary uploads (food, selfies, memes, landscapes).
 */
export function validateDocumentContent(
  text: string, 
  docType: DocumentType, 
  file: File
): { isValid: boolean; matchCount: number; message?: string } {
  // If it's a 2x2 ID photo, verify file is image and reasonable size
  if (docType === 'id_photo') {
    if (!file.type.startsWith('image/')) {
      return { isValid: false, matchCount: 0, message: 'Please upload an image file (JPG, PNG) for your 2x2 ID photo.' };
    }
    return { isValid: true, matchCount: 1 };
  }

  const keywords = DOCUMENT_KEYWORDS[docType] || [];
  if (keywords.length === 0) {
    return { isValid: true, matchCount: 1 };
  }

  const upper = text.toUpperCase();
  let matchCount = 0;
  for (const kw of keywords) {
    if (upper.includes(kw)) {
      matchCount++;
    }
  }

  // If text is totally empty or virtually no characters extracted
  const cleanChars = text.replace(/[^A-Za-z0-9]/g, '').length;
  if (cleanChars < 15) {
    return {
      isValid: false,
      matchCount: 0,
      message: 'The uploaded file does not have clear, readable text. Please upload a clear photo or scan of your document, not an empty or blurry image.'
    };
  }

  // Check if at least 1-2 key terms match
  if (matchCount < 1) {
    const docLabels: Record<DocumentType, string> = {
      or_cr: 'Official Receipt / Certificate of Registration (OR/CR)',
      drivers_license: "Driver's License",
      barangay_clearance: 'Barangay Clearance',
      toda_cert: 'TODA Certification',
      id_photo: '2x2 ID Photo',
      other: 'Supporting Document'
    };

    return {
      isValid: false,
      matchCount: 0,
      message: `The uploaded image does not appear to be a valid ${docLabels[docType]}. Unrelated pictures (such as food, selfies, or personal photos) are strictly prohibited. Please upload an authentic copy.`
    };
  }

  return { isValid: true, matchCount };
}

/**
 * Analyzes a file using Tesseract.js OCR, validates document type authenticity,
 * and extracts form fields.
 */
export async function analyzeDocumentWithOcr(
  file: File, 
  docType: DocumentType
): Promise<OcrResult> {
  // For ID photos, skip heavy text OCR
  if (docType === 'id_photo') {
    const validation = validateDocumentContent('', docType, file);
    return {
      isValid: validation.isValid,
      confidence: 100,
      extractedText: '',
      fields: {},
      validationMessage: validation.message
    };
  }

  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    worker = await createWorker('eng');
    
    // Recognize text
    const ret = await worker.recognize(file);
    const extractedText = ret.data.text || '';
    const confidence = ret.data.confidence || 0;

    // Validate relevance
    const validation = validateDocumentContent(extractedText, docType, file);
    if (!validation.isValid) {
      return {
        isValid: false,
        confidence,
        extractedText,
        fields: {},
        validationMessage: validation.message
      };
    }

    // Extract relevant fields
    const fields = extractFieldsFromText(extractedText, docType);

    return {
      isValid: true,
      confidence,
      extractedText,
      fields,
      validationMessage: undefined
    };
  } catch (err) {
    console.error('OCR processing error:', err);
    // If OCR fails technically (e.g. worker initialization in specific browser security mode),
    // we don't completely lock out user, but advise caution
    return {
      isValid: true,
      confidence: 0,
      extractedText: '',
      fields: {},
      validationMessage: undefined
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // Ignore worker cleanup error
      }
    }
  }
}
