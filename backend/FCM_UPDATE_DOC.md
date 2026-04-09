# FCM Token Update API Documentation

This documentation provides details on how to update the Firebase Cloud Messaging (FCM) token for Users, Partners, and Admins using your **existing and working** backend endpoints.

## 1. Endpoints Overview

| Role | Endpoint | Method |
| :--- | :--- | :--- |
| **User & Partner** | `https://api.rukkoo.in/api/users/fcm-token` | `PUT` |
| **Admin** | `https://api.rukkoo.in/api/admin/fcm-token` | `PUT` |

### General Information:
- **Auth Required**: Yes (Bearer Token in Headers)
- **Content-Type**: `application/json`

---

## 2. Request Details

### Headers
| Header | Value |
| :--- | :--- |
| **Authorization** | `Bearer <JWT_TOKEN>` |
| **Content-Type** | `application/json` |

### Request Body (JSON)
For Flutter apps (Webview or Native), always specify `platform` as `"app"`.

```json
{
  "fcmToken": "YOUR_FCM_TOKEN_HERE",
  "platform": "app" 
}
```

---

## 3. Response Format

### Success (200 OK)
```json
{
  "success": true,
  "message": "FCM token updated successfully for app platform",
  "data": {
    "platform": "app",
    "tokenUpdated": true
  }
}
```

### Error (400 Bad Request)
If `fcmToken` is missing.
```json
{
  "success": false,
  "message": "Please provide FCM token"
}
```

---

## 4. Flutter Integration Example

### Using HTTP Package
```dart
Future<void> syncFCMToken(String fcmToken, String jwtToken, bool isAdmin) async {
  final String baseUrl = isAdmin 
      ? 'https://api.rukkoo.in/api/admin/fcm-token' 
      : 'https://api.rukkoo.in/api/users/fcm-token';

  final response = await http.put(
    Uri.parse(baseUrl),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $jwtToken',
    },
    body: jsonEncode({
      'fcmToken': fcmToken,
      'platform': 'app'
    }),
  );

  if (response.statusCode == 200) {
    print("Push Notifications Enabled Successfully");
  }
}
```

### Important Notes:
1. **Unified Partner/User API**: The endpoint `/api/users/fcm-token` is smart; it automatically detects if the logged-in user is a normal User or a Partner and updates the correct document in the database.
2. **Platform Specific**: By sending `"platform": "app"`, you ensure that the token is stored in the `app` slot, keeping the `web` session tokens safe if the user also uses the website.
