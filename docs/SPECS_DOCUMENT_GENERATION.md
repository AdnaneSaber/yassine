# Feature Specification: Document Generation & Printing

## Overview
Implement automated document generation for student requests with print-ready PDF outputs. This allows admins to generate official certificates and students to download/print their approved documents.

---

## 1. User Stories

### As a Student:
- **US-1**: I want to download my approved certificates as PDF so I can print them
- **US-2**: I want to see a preview of my document before downloading
- **US-3**: I want documents to include my personal information automatically
- **US-4**: I want to print documents directly from the browser

### As an Admin:
- **US-5**: I want to generate official documents from templates
- **US-6**: I want documents to auto-fill with student and request data
- **US-7**: I want to customize document templates
- **US-8**: I want to add digital signatures or stamps to documents
- **US-9**: I want to track which documents were generated and when
- **US-10**: I want to regenerate documents if needed

### As a System:
- **US-11**: Documents should follow official university formatting
- **US-12**: Documents should include security features (watermark, QR code)
- **US-13**: Documents should be archived for audit purposes

---

## 2. Technical Architecture

### 2.1 Technology Stack

**Option A: React-PDF (Recommended)**
- Library: `@react-pdf/renderer`
- Pros: React components, full control, client/server rendering
- Cons: Learning curve for PDF-specific components

**Option B: Puppeteer**
- Library: `puppeteer`
- Pros: HTML to PDF, familiar syntax
- Cons: Heavy, requires headless browser

**Option C: PDFKit**
- Library: `pdfkit`
- Pros: Lightweight, Node-native
- Cons: Low-level API, harder to template

**DECISION**: Use `@react-pdf/renderer` for maintainability and React integration

### 2.2 System Architecture

```
┌─────────────────┐
│   Student/Admin │
│      Portal     │
└────────┬────────┘
         │
         │ 1. Request PDF
         ▼
┌─────────────────┐
│  API Endpoint   │
│  /api/demandes/ │
│  [id]/generate  │
└────────┬────────┘
         │
         │ 2. Fetch Data
         ▼
┌─────────────────┐
│   Database      │
│   (Demande +    │
│    Student)     │
└────────┬────────┘
         │
         │ 3. Return Data
         ▼
┌─────────────────┐
│ PDF Generator   │
│ Service         │
│ (React-PDF)     │
└────────┬────────┘
         │
         │ 4. Select Template
         ▼
┌─────────────────┐
│ Template Engine │
│ - Scolarite     │
│ - Releve Notes  │
│ - etc.          │
└────────┬────────┘
         │
         │ 5. Fill Data
         ▼
┌─────────────────┐
│ PDF Document    │
│ (with metadata) │
└────────┬────────┘
         │
         │ 6. Add Security
         ▼
┌─────────────────┐
│ - Watermark     │
│ - QR Code       │
│ - Serial Number │
└────────┬────────┘
         │
         │ 7. Generate PDF
         ▼
┌─────────────────┐
│ PDF Binary      │
│ (Stream/Buffer) │
└────────┬────────┘
         │
         │ 8. Store & Return
         ▼
┌─────────────────┐
│ S3/Storage +    │
│ Download Link   │
└─────────────────┘
```

---

## 3. Database Schema Changes

### 3.1 New Collection: `document_templates`

```typescript
interface IDocumentTemplate {
  _id: ObjectId;
  code: TypeDemandeCode; // Links to demande type
  nom: string;
  version: number; // Template versioning
  contenu: {
    header: {
      logo: string; // URL or base64
      institution: string;
      adresse: string;
      contact: string;
    };
    body: {
      titre: string;
      paragraphes: string[]; // With variable placeholders
    };
    footer: {
      signature: {
        nom: string;
        titre: string;
        image?: string; // Digital signature image
      };
      mentions: string[]; // Legal text
    };
    styles: {
      fontFamily: string;
      fontSize: number;
      colors: {
        primary: string;
        secondary: string;
        text: string;
      };
      margins: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
    };
  };
  variables: string[]; // Available placeholders
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 New Collection: `generated_documents`

```typescript
interface IGeneratedDocument {
  _id: ObjectId;
  demandeId: ObjectId;
  templateId: ObjectId;
  documentType: TypeDemandeCode;
  numeroDocument: string; // Unique document number
  etudiant: {
    id: ObjectId;
    nom: string;
    prenom: string;
    matricule: string;
  };
  metadata: {
    generePar: ObjectId; // Admin who generated
    dateGeneration: Date;
    dateExpiration?: Date; // For time-limited docs
    qrCode: string; // Verification QR code
    serialNumber: string; // Unique serial
  };
  fichier: {
    nom: string;
    url: string; // S3 or local path
    taille: number;
    hash: string; // SHA-256 for integrity
  };
  statut: 'GENERE' | 'ENVOYE' | 'TELECHARGE' | 'ANNULE';
  telechargements: {
    date: Date;
    ip: string;
    userAgent: string;
  }[];
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.3 Updates to Existing Schema

**Add to `IDemande`:**
```typescript
interface IDemande {
  // ... existing fields
  documentGenere?: {
    id: ObjectId; // Reference to generated_documents
    numeroDocument: string;
    dateGeneration: Date;
    url: string;
  };
}
```

---

## 4. API Endpoints

### 4.1 Generate Document

**Endpoint**: `POST /api/demandes/[id]/generate-document`

**Auth**: Admin or Student (own demandes only)

**Request**:
```typescript
{
  templateId?: string; // Optional, uses default for type
  includeWatermark?: boolean; // Default: true for preview
  language?: 'fr' | 'ar' | 'en'; // Default: fr
}
```

**Response**:
```typescript
{
  success: boolean;
  document?: {
    id: string;
    numeroDocument: string;
    url: string;
    downloadUrl: string;
    expiresAt?: Date;
  };
  error?: string;
}
```

**Business Rules**:
- Only demandes with status `VALIDE` or `TRAITE` can generate documents
- Students can only generate for approved requests
- Admins can regenerate documents
- Each generation creates audit log entry

### 4.2 Download Document

**Endpoint**: `GET /api/documents/[id]/download`

**Auth**: Admin or Student (owner)

**Query Params**:
```
?inline=true  // View in browser vs download
&watermark=false  // Admin only: remove watermark
```

**Response**: PDF binary stream

**Headers**:
```
Content-Type: application/pdf
Content-Disposition: inline|attachment; filename="document.pdf"
Cache-Control: private, max-age=3600
```

### 4.3 Preview Document

**Endpoint**: `GET /api/demandes/[id]/preview-document`

**Auth**: Admin or Student (owner)

**Response**: PDF with watermark "PREVIEW - NON OFFICIEL"

### 4.4 List Templates

**Endpoint**: `GET /api/templates`

**Auth**: Admin only

**Response**:
```typescript
{
  templates: {
    id: string;
    code: TypeDemandeCode;
    nom: string;
    version: number;
    actif: boolean;
  }[];
}
```

### 4.5 Create/Update Template

**Endpoint**: `POST /api/templates` | `PUT /api/templates/[id]`

**Auth**: Admin (SUPER_ADMIN for production)

**Request**: `IDocumentTemplate` schema

---

## 5. Component Structure

### 5.1 React Components

```
components/
├── documents/
│   ├── document-generator.tsx          # Main generator component
│   ├── document-preview-modal.tsx      # Preview dialog
│   ├── document-download-button.tsx    # Download action button
│   └── templates/
│       ├── base-template.tsx           # Common layout
│       ├── attestation-scolarite.tsx   # Enrollment cert template
│       ├── releve-notes.tsx            # Transcript template
│       ├── attestation-reussite.tsx    # Completion cert template
│       ├── duplicata-carte.tsx         # ID card template
│       └── convention-stage.tsx        # Internship agreement template
└── admin/
    └── template-editor.tsx             # Template CRUD UI (future)
```

### 5.2 Service Layer

```
lib/
├── pdf/
│   ├── generator.ts                    # Main PDF generation logic
│   ├── templates.ts                    # Template loader
│   ├── watermark.ts                    # Watermark overlay
│   ├── qr-code.ts                      # QR code generation
│   └── variables.ts                    # Variable replacement engine
└── storage/
    └── documents.ts                    # File storage handler (S3/local)
```

---

## 6. Template Variables

### 6.1 Available Variables

**Student Variables**:
- `{{student.nom}}` - Last name
- `{{student.prenom}}` - First name
- `{{student.nomComplet}}` - Full name
- `{{student.matricule}}` - Student ID
- `{{student.email}}` - Email
- `{{student.dateNaissance}}` - Birth date
- `{{student.niveauEtude}}` - Study level
- `{{student.filiere}}` - Major/field

**Demande Variables**:
- `{{demande.numero}}` - Request number
- `{{demande.dateCreation}}` - Creation date
- `{{demande.dateValidation}}` - Approval date
- `{{demande.anneeUniversitaire}}` - Academic year

**Document Variables**:
- `{{document.numero}}` - Document serial number
- `{{document.dateGeneration}}` - Generation date
- `{{document.qrCode}}` - QR code image

**System Variables**:
- `{{universite.nom}}` - University name
- `{{universite.adresse}}` - Address
- `{{universite.telephone}}` - Phone
- `{{signataire.nom}}` - Signatory name
- `{{signataire.titre}}` - Signatory title

### 6.2 Formatting Helpers

```typescript
// Date formatting
{{student.dateNaissance|date:'DD/MM/YYYY'}}
{{demande.dateCreation|date:'DD MMMM YYYY'}}

// Text transformation
{{student.nom|uppercase}}
{{student.prenom|capitalize}}

// Conditional
{{#if student.niveauEtude}}
  Niveau: {{student.niveauEtude}}
{{/if}}
```

---

## 7. Security Features

### 7.1 Watermark

**Implementation**:
- Semi-transparent diagonal text
- "COPIE NON OFFICIELLE" for previews
- University logo watermark for official docs
- Position: Center, 45° angle, 30% opacity

### 7.2 QR Code

**Content**:
```
https://universite.tn/verify/{{document.serialNumber}}
```

**Verification Page**:
- Shows document details
- Validates authenticity
- Shows generation date
- Checks if document is active/revoked

### 7.3 Serial Number

**Format**: `UNI-2024-ATTEST-000123`
- `UNI` - University code
- `2024` - Year
- `ATTEST` - Document type code
- `000123` - Sequential number

**Generation**: Auto-increment per type per year

### 7.4 Digital Signature (Future)

- PDF digital signature using certificates
- Timestamp from trusted authority
- Verification through PDF readers

---

## 8. File Storage Strategy

### 8.1 Storage Options

**Option A: Database (Not Recommended)**
- Store as Base64 in MongoDB
- Pros: Simple
- Cons: DB bloat, slow queries

**Option B: Local Filesystem**
- Store in `/public/documents/` or `/uploads/`
- Pros: Simple, no cost
- Cons: Not scalable, backup issues

**Option C: Cloud Storage (Recommended)**
- AWS S3, Google Cloud Storage, or Cloudinary
- Pros: Scalable, CDN, backups
- Cons: Cost, complexity

**DECISION**: Start with local filesystem, migrate to S3 later

### 8.2 File Organization

```
/uploads/documents/
  ├── 2024/
  │   ├── 01/
  │   │   ├── ATTEST_SCOLARITE_123456.pdf
  │   │   └── RELEVE_NOTES_123457.pdf
  │   └── 02/
  └── 2025/
```

**Naming Convention**: `{TYPE}_{NUMERO_DEMANDE}_{TIMESTAMP}.pdf`

### 8.3 Access Control

- Private files (not in `/public`)
- Served through API endpoint with auth
- Signed URLs with expiration (1 hour)
- IP logging for downloads

---

## 9. Print Optimization

### 9.1 PDF Settings

```typescript
const documentSettings = {
  size: 'A4',
  orientation: 'portrait',
  margins: {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50,
  },
  compression: true, // Reduce file size
  pdfVersion: '1.7',
  metadata: {
    title: 'Attestation de Scolarité',
    author: 'Université de Tunis',
    subject: 'Document Officiel',
    keywords: 'attestation, scolarité, étudiant',
    creator: 'Student Management System',
  },
};
```

### 9.2 Print Styles

```css
@media print {
  .no-print {
    display: none !important;
  }

  .print-break {
    page-break-after: always;
  }

  .print-avoid-break {
    page-break-inside: avoid;
  }
}
```

### 9.3 Browser Print Dialog

```typescript
const handlePrint = () => {
  window.print();
};

// Or better control with react-to-print
import { useReactToPrint } from 'react-to-print';

const handlePrint = useReactToPrint({
  content: () => componentRef.current,
  documentTitle: `Attestation_${demande.numeroDemande}`,
  onAfterPrint: () => console.log('Printed successfully'),
});
```

---

## 10. Implementation Steps

### Phase 1: Foundation (Week 1)
1. Install dependencies (`@react-pdf/renderer`, `qrcode`)
2. Create database models (templates, generated_documents)
3. Set up file storage structure
4. Create basic PDF generator service

### Phase 2: Templates (Week 2)
5. Design template for Attestation de Scolarité
6. Implement variable replacement engine
7. Add watermark functionality
8. Create QR code generator

### Phase 3: API & Integration (Week 3)
9. Build generate-document API endpoint
10. Build download API endpoint
11. Add document reference to Demande model
12. Create audit logging

### Phase 4: UI Components (Week 4)
13. Build document generator button in admin
14. Create preview modal
15. Add download button for students
16. Print functionality

### Phase 5: Additional Templates (Week 5-6)
17. Template for Relevé de Notes
18. Template for Attestation de Réussite
19. Template for Duplicata Carte
20. Template for Convention de Stage

### Phase 6: Polish & Security (Week 7)
21. Add serial number generation
22. Implement QR verification page
23. Add document expiration logic
24. Security hardening

### Phase 7: Advanced Features (Week 8+)
25. Template editor UI (admin)
26. Batch document generation
27. Email document to student
28. Document versioning

---

## 11. Testing Criteria

### 11.1 Unit Tests

```typescript
describe('PDF Generator', () => {
  it('should generate PDF for valid demande', async () => {
    const pdf = await generateDocument(demandeId);
    expect(pdf).toBeDefined();
    expect(pdf.size).toBeGreaterThan(0);
  });

  it('should replace all variables correctly', () => {
    const template = 'Hello {{student.prenom}} {{student.nom}}';
    const result = replaceVariables(template, studentData);
    expect(result).toBe('Hello John Doe');
  });

  it('should generate unique serial numbers', async () => {
    const serial1 = await generateSerialNumber('ATTESTATION_SCOLARITE');
    const serial2 = await generateSerialNumber('ATTESTATION_SCOLARITE');
    expect(serial1).not.toBe(serial2);
  });
});
```

### 11.2 Integration Tests

- Generate PDF for each demande type
- Download PDF and verify content
- Preview mode adds watermark
- QR code links to valid verification URL
- Access control: student can't access others' docs

### 11.3 E2E Tests

1. Admin approves demande (VALIDE status)
2. Admin clicks "Générer document"
3. Preview modal opens with watermarked PDF
4. Click "Générer officiel"
5. Download button appears
6. Student logs in
7. Student sees download button
8. Student downloads PDF
9. Verify QR code on verification page

### 11.4 Manual Testing Checklist

- [ ] PDF displays correctly in Chrome
- [ ] PDF displays correctly in Firefox
- [ ] PDF displays correctly in Safari
- [ ] PDF prints correctly (margins, page breaks)
- [ ] QR code scans with phone
- [ ] Verification page loads
- [ ] All variables replaced correctly
- [ ] French accents display properly
- [ ] Logo renders clearly
- [ ] File size is reasonable (<500KB)
- [ ] Download works on mobile
- [ ] Print works from mobile

---

## 12. Error Handling

### 12.1 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Template not found | Missing template for demande type | Create default template or show error |
| Student data incomplete | Missing required fields | Prompt admin to complete data |
| PDF generation failed | React-PDF error | Log error, retry, fallback message |
| Storage error | Disk full, S3 unavailable | Queue for retry, notify admin |
| Invalid QR code | Malformed URL | Regenerate document |
| Access denied | Wrong user accessing doc | Return 403 error |

### 12.2 Fallback Strategy

```typescript
try {
  const pdf = await generatePDF(demande);
  return pdf;
} catch (error) {
  logger.error('PDF generation failed', { demandeId, error });

  // Retry once
  try {
    const pdf = await generatePDF(demande);
    return pdf;
  } catch (retryError) {
    // Fallback: generate simple text document
    return await generateSimpleTextDocument(demande);
  }
}
```

---

## 13. Performance Considerations

### 13.1 Optimization Strategies

**Caching**:
- Cache generated PDFs for 1 hour
- Cache templates in memory
- Use Redis for distributed cache

**Async Processing**:
- Queue PDF generation for large batches
- Use background jobs (Bull, Agenda)
- Show progress indicator

**File Size**:
- Compress images before embedding
- Use web-optimized fonts
- Limit embedded resources

**Lazy Loading**:
- Don't generate PDF until explicitly requested
- Generate on-demand vs pre-generate

### 13.2 Expected Performance

| Metric | Target | Current |
|--------|--------|---------|
| Generation time | <2 seconds | TBD |
| File size | <500KB | TBD |
| Concurrent generations | 10/second | TBD |
| Storage per year | <10GB | TBD |

---

## 14. Future Enhancements

### v2.0
- [ ] Multi-language templates (French, Arabic, English)
- [ ] Custom logo per faculty
- [ ] Batch generation (all students)
- [ ] Email document directly
- [ ] Mobile app integration

### v3.0
- [ ] Advanced template editor (WYSIWYG)
- [ ] Template inheritance
- [ ] Conditional sections in templates
- [ ] Charts/graphs in documents (transcripts)
- [ ] Digital signatures with certificates

### v4.0
- [ ] Blockchain verification
- [ ] NFT certificates
- [ ] API for external systems
- [ ] Machine learning for fraud detection

---

## 15. Dependencies

### NPM Packages
```json
{
  "@react-pdf/renderer": "^3.1.14",
  "qrcode": "^1.5.3",
  "sharp": "^0.33.0", // Image processing
  "date-fns": "^3.0.0", // Date formatting
  "handlebars": "^4.7.8" // Template variables
}
```

### Environment Variables
```env
# Document generation
DOCUMENTS_STORAGE_PATH=/uploads/documents
DOCUMENTS_BASE_URL=https://yourdomain.com/api/documents
ENABLE_WATERMARK=true

# University info
UNIVERSITY_NAME=Université de Tunis
UNIVERSITY_ADDRESS=Address here
UNIVERSITY_LOGO_URL=/logo.png

# QR Code verification
QR_VERIFICATION_URL=https://yourdomain.com/verify
```

---

## 16. Acceptance Criteria

### Must Have (MVP)
- ✅ Generate PDF for Attestation de Scolarité
- ✅ Download PDF
- ✅ Preview with watermark
- ✅ QR code for verification
- ✅ Serial number generation
- ✅ Access control (owner only)

### Should Have
- ✅ All 5 document types supported
- ✅ Print-optimized format
- ✅ Audit trail of generations
- ✅ Admin can regenerate
- ✅ Email notification on generation

### Could Have
- ⏳ Template customization UI
- ⏳ Batch generation
- ⏳ Multi-language support
- ⏳ Digital signatures

### Won't Have (This Release)
- ❌ Blockchain verification
- ❌ Advanced template editor
- ❌ Charts in documents

---

## 17. Success Metrics

### Quantitative
- 95% of documents generate successfully
- <2 seconds generation time
- <1% error rate
- 100% of generated documents downloadable
- Zero unauthorized access attempts

### Qualitative
- Admins find generation process intuitive
- Students satisfied with document quality
- Documents pass official validation
- Print quality meets standards

---

## 18. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| PDF library bugs | High | Medium | Thorough testing, have fallback |
| Storage costs | Medium | High | Start local, optimize compression |
| Performance issues | High | Medium | Async processing, caching |
| Security breach | Critical | Low | Access control, audit logs |
| Template errors | Medium | Medium | Validation, preview before official |
| Printer compatibility | Medium | Low | Test on multiple printers |

---

**Document Version**: 1.0
**Last Updated**: 2024-02-01
**Next Review**: Before implementation start
