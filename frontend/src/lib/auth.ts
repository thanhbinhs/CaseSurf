// lib/auth.ts

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase"; // Đảm bảo import cả 'db'

// --- Đăng nhập với Google và lưu vào Firestore (Phiên bản đã sửa lỗi) ---
export const signInWithGoogle = async (): Promise<User | null> => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Sau khi đăng nhập thành công, kiểm tra và tạo dữ liệu trên Firestore
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      // Nếu tài liệu chưa tồn tại (người dùng mới), TẠO nó
      if (!docSnap.exists()) {
        console.log("Creating new user profile in Firestore for:", user.uid);
        try {
          await setDoc(userDocRef, {
            username: user.displayName,
            gmail: user.email,
            credit: 5, // Gán credit mặc định
            createdAt: new Date(),
          });
          console.log("User profile created successfully.");
        } catch (dbError) {
          console.error("Error creating user profile in Firestore:", dbError);
          // Optional: Handle the error, maybe sign the user out
        }
      } else {
        console.log("User profile already exists for:", user.uid);
      }
    }

    // Chỉ trả về user SAU KHI tất cả các thao tác trên đã hoàn tất
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