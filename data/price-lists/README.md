# AskToddy Price Lists Database

## 📁 Folder Structure

This directory contains real-world price lists from construction suppliers across the UK. These PDFs are processed by the Price Context Engine to provide accurate, up-to-date pricing for the AI quoting system.

### **🏗️ Plant Hire**

#### **Single Site National**

Large national companies with single pricing structure across the UK:

- HSS Hire
- Speedy Services
- Brandon Hire Station
- A-Plant

**Characteristics:**

- Standardized pricing across regions
- Professional PDF layouts
- Comprehensive equipment catalogs
- Regular pricing updates

#### **Multi-Site National**

National companies with regional pricing variations:

- Travis Perkins Tool Hire
- Jewson Plant Hire
- Regional variations based on location

**Characteristics:**

- Regional pricing multipliers
- Location-specific availability
- Bulk discount structures

#### **Independent**

Local/regional plant hire companies:

- Local equipment rental shops
- Specialized equipment providers
- Regional pricing advantages

**Characteristics:**

- Competitive local pricing
- Specialized equipment
- Flexible terms
- Personal relationships

### **🏗️ Aggregates & Materials**

#### **Single Site National**

National builders merchants with standard pricing:

- Wickes Trade
- B&Q Trade
- Selco Builders Warehouse

**Characteristics:**

- Standard UK pricing
- Professional trade catalogs
- Bulk pricing tiers

#### **Multi-Site National**

National chains with regional variations:

- Travis Perkins
- Jewson
- Buildbase
- Regional pricing differences

**Characteristics:**

- Location-based pricing
- Local branch variations
- Delivery cost variations

#### **Independent**

Local suppliers and specialists:

- Local timber yards
- Specialist suppliers
- Regional quarries

**Characteristics:**

- Competitive local rates
- Specialized products
- Relationship pricing

## 📊 PDF Types & Processing

### **Text-Based Price Lists**

- Clean pricing tables
- Easy text extraction
- Structured data format
- **Processing:** Direct text parsing with regex

### **Catalog-Style PDFs**

- Images with pricing
- Mixed content layouts
- Visual product information
- **Processing:** AI vision extraction + OCR

## 🔧 Processing Workflow

```
PDF Upload → Document Analysis → Text/Image Extraction → Price Parsing → Database Update → AI Integration
```

### **AI Processing Pipeline**

1. **Document Classification**: Text-based vs Catalog-style
2. **Content Extraction**:
   - Text PDFs: Direct parsing
   - Visual PDFs: AI vision + OCR
3. **Price Standardization**: Convert to common format
4. **Database Integration**: Update pricing context
5. **AI Training**: Feed into quoting algorithms

## 📝 Naming Convention

**Format:** `[Company]_[Type]_[Date]_[Region].pdf`

**Examples:**

- `HSS_PlantHire_2024-10_National.pdf`
- `TravisPerkins_Materials_2024-10_London.pdf`
- `LocalHire_Plant_2024-10_Manchester.pdf`

## 🎯 Usage in AI Quoting

The processed price data feeds into:

- **Real-time pricing** for quotes
- **Regional variations** based on location
- **Supplier recommendations** based on availability
- **Cost optimization** through price comparison

## 🔄 Update Process

1. **Upload PDFs** to appropriate folders
2. **Run processing** via Price Context Engine
3. **Validate extraction** through AI system
4. **Update pricing database** automatically
5. **Test quotes** with new pricing data

---

**Note:** All price lists are used for legitimate business quoting purposes and respect supplier terms of use.
