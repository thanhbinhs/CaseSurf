// lib/auth.ts (Đã sửa lỗi)

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// --- Đăng nhập với Google và lưu vào Firestore ---
export const signInWithGoogle = async (): Promise<User | null> => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Kiểm tra và tạo dữ liệu trên Firestore nếu cần
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      // Nếu tài liệu chưa tồn tại (người dùng mới), TẠO nó
      if (!docSnap.exists()) {
        console.log("Creating new user profile in Firestore for:", user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
          username: user.displayName,
          gmail: user.email,
          credit: 5, // Gán credit mặc định
          createdAt: serverTimestamp(), // Dùng serverTimestamp cho chính xác
        });
        console.log("User profile created successfully.");
      } else {
        console.log("User profile already exists for:", user.uid);
      }
    }
    
    // Trả về đối tượng user sau khi mọi việc hoàn tất
    return user;

  } catch (error) {
    console.error("Lỗi khi đăng nhập bằng Google:", error);
    return null;
  }
};

// --- Đăng xuất ---
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Lỗi khi đăng xuất:", error);
  }
};