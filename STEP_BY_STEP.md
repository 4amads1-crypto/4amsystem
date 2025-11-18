# 📝 خطوة بخطوة - رفع النظام

## قبل البدء

### 1. تأكد من تثبيت Git

افتح Terminal واكتب:
```bash
git --version
```

إذا ظهر رقم الإصدار → Git مثبت ✅
إذا ظهر خطأ → حمّل Git من: https://git-scm.com/download/win

---

## الخطوات

### الخطوة 1: إنشاء حساب GitHub

1. اذهب إلى: **https://github.com/signup**
2. سجل حساب جديد (مجاني)
3. تأكد من البريد الإلكتروني
4. احفظ اسم المستخدم (ستحتاجه لاحقاً)

---

### الخطوة 2: إنشاء Repository على GitHub

1. اذهب إلى: **https://github.com/new**
2. املأ البيانات:
   - **Repository name:** `4am-system`
   - **Description:** `4AM System Company Management System`
   - اختر **Public**
   - **لا تضف** README أو .gitignore أو license
3. اضغط **"Create repository"**
4. **احفظ الصفحة مفتوحة** - ستحتاج الرابط

---

### الخطوة 3: افتح Terminal في مجلد المشروع

**في Kiro IDE:**
- اضغط `Ctrl + `` (backtick)
- أو من القائمة: Terminal → New Terminal

**أو في Windows:**
- افتح Command Prompt
- اكتب:
```bash
cd D:\2026
```

---

### الخطوة 4: نفذ الأوامر التالية

**انسخ والصق كل أمر واضغط Enter:**

#### 1. تهيئة Git
```bash
git init
```
✅ يجب أن ترى: `Initialized empty Git repository`

#### 2. إضافة الملفات
```bash
git add .
```
✅ لن ترى رسالة (هذا طبيعي)

#### 3. عمل Commit
```bash
git commit -m "4AM System - First Deploy"
```
✅ يجب أن ترى قائمة بالملفات المضافة

#### 4. تغيير اسم الـ branch
```bash
git branch -M main
```
✅ لن ترى رسالة (هذا طبيعي)

#### 5. ربط بـ GitHub
**⚠️ مهم: غير `YOUR_USERNAME` باسم حسابك على GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/4am-system.git
```

**مثال:**
إذا كان اسمك على GitHub هو `ahmed123`، الأمر يكون:
```bash
git remote add origin https://github.com/ahmed123/4am-system.git
```

✅ لن ترى رسالة (هذا طبيعي)

#### 6. رفع الكود
```bash
git push -u origin main
```

**سيطلب منك:**
- **Username:** اسم حسابك على GitHub
- **Password:** كلمة المرور (أو Personal Access Token)

✅ يجب أن ترى: `Branch 'main' set up to track remote branch 'main'`

---

### الخطوة 5: تحقق من الرفع

1. ارجع لصفحة GitHub
2. حدّث الصفحة (F5)
3. يجب أن ترى جميع الملفات! ✅

---

## إذا واجهت مشاكل

### المشكلة: "git is not recognized"
**الحل:** حمّل Git من https://git-scm.com/download/win

### المشكلة: "Permission denied"
**الحل:** استخدم Personal Access Token بدلاً من كلمة المرور

**كيفية إنشاء Token:**
1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token
4. اختر `repo` scope
5. انسخ الـ Token واستخدمه بدلاً من كلمة المرور

### المشكلة: "remote origin already exists"
**الحل:**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/4am-system.git
```

### المشكلة: "failed to push"
**الحل:**
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## الخطوة التالية: النشر على Render

بعد رفع الكود على GitHub، اتبع هذه الخطوات:

### 1. إنشاء حساب Render
- اذهب إلى: **https://render.com/register**
- سجل دخول بحساب GitHub
- اسمح لـ Render بالوصول

### 2. إنشاء Web Service
1. اضغط **"New +"** → **"Web Service"**
2. اختر repository: **4am-system**
3. املأ البيانات:
   ```
   Name: 4am-system
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

### 3. إضافة Environment Variable
في صفحة Settings → Environment:
```
Key: JWT_SECRET
Value: 4am-system-production-secret-2025
```

### 4. Deploy!
- اضغط **"Create Web Service"**
- انتظر 5-10 دقائق
- احصل على الرابط!

---

## 🎉 تم!

النظام الآن أونلاين على:
```
https://your-app-name.onrender.com
```

شارك الرابط مع فريقك! 🚀

---

## نسخ الأوامر بسرعة

**جميع الأوامر في ملف واحد:**
انظر ملف `COMMANDS.txt` في المشروع
