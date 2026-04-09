# 📸 Flutter Bridge API Documentation (Image Uploads)

This document explains how to integrate the Flutter mobile application with the Backend for single and multiple image uploads. The backend is designed to be highly flexible, supporting both standard Multipart files and Base64 encoded strings.

---

## 1. Multipart Form Data (File Upload)
Use this method when you have the local file path on the device.

- **Field Name:** `images` (Mandatory - must be exactly this name)
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Max Files:** 20 images per request
- **Supported Formats:** `.jpeg`, `.jpg`, `.png`, `.webp`

### **Endpoints**
| Purpose | Endpoint | Access |
| :--- | :--- | :--- |
| **Hotel/Property Images** | `/api/hotels/upload` | Private (Partner/Admin) |
| **Partner Documents** | `/api/auth/partner/upload-docs` | Public (During Registration) |
| **Admin Panel Image** | `/api/admin/upload-image` | Private (Admin Only) |

### **Flutter Implementation (Dio Example)**
```dart
// For multiple images
FormData formData = FormData.fromMap({
  "images": [
    await MultipartFile.fromFile(image1.path, filename: "hotel1.jpg"),
    await MultipartFile.fromFile(image2.path, filename: "hotel2.jpg"),
  ],
});

// For single image (use the same field name 'images')
FormData formData = FormData.fromMap({
  "images": await MultipartFile.fromFile(image1.path, filename: "doc.jpg"),
});

var response = await dio.post("/api/hotels/upload", data: formData);
```

---

## 2. Base64 Upload (JSON)
Ideal for instant camera captures where you want to send encoded strings directly.

- **Field Name:** `images`
- **Method:** `POST`
- **Content-Type:** `application/json`

### **Endpoints**
| Purpose | Endpoint | Access |
| :--- | :--- | :--- |
| **Hotel/Property** | `/api/hotels/upload-base64` | Private (Partner/Admin) |
| **Partner Documents** | `/api/auth/partner/upload-docs-base64` | Public |

### **Request Body Formats (Highly Flexible)**

#### **A. Array of Objects (Best Practice)**
Allows passing custom file names for better SEO/tracking.
```json
{
  "images": [
    { "base64": "data:image/jpeg;base64,...", "fileName": "front_view.jpg" },
    { "base64": "data:image/png;base64,...", "fileName": "room.png" }
  ]
}
```

#### **B. Array of Plain Strings**
Simple list of base64 strings.
```json
{
  "images": [
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,..."
  ]
}
```

#### **C. Single Item (No Array required)**
Backend automatically detects and wraps single objects or strings.
```json
{
  "images": "data:image/jpeg;base64,..."
}
```

---

## 3. Standard Response Format
On successful upload, the API returns a JSON containing Cloudinary URLs and Public IDs.

```json
{
  "success": true,
  "files": [
    {
      "url": "https://res.cloudinary.com/.../img_123.jpg",
      "publicId": "properties/17012345678"
    }
  ],
  "urls": [
    "https://res.cloudinary.com/.../img_123.jpg"
  ]
}
```

---

## 4. Key Constraints & Rules
1. **Field Name:** Always use `images`. The previous `document` or `file` field names are deprecated.
2. **File Size:** Handled by server limits (standard 5MB-10MB).
3. **Format Guard:** The backend strictly rejects PDFs for these routes; only images are allowed.
4. **Auth Header:** For private routes, ensure the `Authorization: Bearer <token>` header is present.
