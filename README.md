# 🌟 Hướng dẫn Deploy lên Vercel (Vite Edition)

Ứng dụng hiện đã sử dụng **Vite** để đảm bảo hoạt động 100% trên Vercel.

## 🚀 Các bước thực hiện:

1.  **Đưa code lên GitHub:**
    *   Push toàn bộ các file mới này lên Repository của bạn.

2.  **Kết nối với Vercel:**
    *   Vào Vercel Dashboard, chọn Project của bạn.
    *   **LƯU Ý:** Nếu bạn đã chỉnh sửa "Build & Development Settings" trước đó, hãy vào **Settings** -> **General** và nhấn **Reset** để Vercel tự động nhận diện Framework là **Vite**.

3.  **Cấu hình Biến môi trường:**
    *   Đảm bảo bạn đã thêm `API_KEY` (Gemini) trong phần **Environment Variables**.

4.  **Deploy:**
    *   Nhấn **Redeploy**. Vercel sẽ chạy lệnh `npm run build` và ứng dụng sẽ hoạt động mượt mà.

## 🛠 Tại sao dùng Vite?
*   Tự động biên dịch `.tsx` sang JavaScript mà trình duyệt hiểu được.
*   Tối ưu hóa hình ảnh và mã nguồn để tải cực nhanh.
*   Hỗ trợ Hot Module Replacement (HMR) khi phát triển.

Chúc bạn thành công! 🎈