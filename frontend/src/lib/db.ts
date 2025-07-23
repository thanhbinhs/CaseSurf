// src/lib/db.ts

import mysql from 'mysql2/promise';

// Tạo một "pool" kết nối. Pool hiệu quả hơn nhiều so với việc tạo kết nối mới cho mỗi request
// vì nó cho phép tái sử dụng các kết nối đã có.
const pool = mysql.createPool({
  host: process.env.DB_HOST,          // Địa chỉ IP server MySQL
  port: parseInt(process.env.DB_PORT as string), // Port của server MySQL
  user: process.env.DB_USER,          // Tên người dùng CSDL
  password: process.env.DB_PASSWORD,  // Mật khẩu CSDL
  database: process.env.DB_DATABASE,  // Tên CSDL bạn muốn kết nối
  waitForConnections: true,
  connectionLimit: 10, // Số kết nối tối đa trong pool
  queueLimit: 0
});

// Export pool kết nối để sử dụng trong các API routes
export const db = pool;