# Flow Nghiệp vụ: Tạo Sản phẩm (Create Product)

Tài liệu này mô tả chi tiết luồng nghiệp vụ tạo mới một sản phẩm, bao gồm cả các thông tin cơ bản, biến thể (variants), giá (prices) và hình ảnh (images).

## 1. Dữ liệu đầu vào (Payload)

Payload từ phía Client gửi lên bắt buộc và tùy chọn các trường liên quan đến Product và danh sách các Variants.

```json
{
  "name": "Áo thun nam",
  "description": "Áo thun cotton 100% cực mát",
  "vendorId": "uuid-of-vendor",
  "categoryId": "uuid-of-category",
  "variants": [
    {
      "name": "Màu đen - Size M",
      "stock": 100,
      "prices": [
        { "name": "Giá bán lẻ", "price": 150000 },
        { "name": "Giá nhập", "price": 100000 }
      ],
      "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ]
    },
    {
      "name": "Màu trắng - Size L",
      "stock": 50,
      "prices": [{ "name": "Giá bán lẻ", "price": 160000 }],
      "images": ["https://example.com/image3.jpg"]
    }
  ]
}
```

## 2. Luồng xử lý (Processing Flow)

### Bước 1: Validate Dữ liệu (Route / Schema Layer)

- **Hành động:** Sử dụng `zod` để định nghĩa và kiểm tra payload (`createProductSchema`).
- **Nghiệp vụ:**
  - Đảm bảo các trường bắt buộc của sản phẩm (`name`, `description`, `vendorId`, `categoryId`) không bị trống.
  - Kiểm tra mảng `variants` (mỗi variant buộc phải có `name`, `stock`, và mảng `prices` chứa thông tin các loại giá như "Giá bán lẻ", "Giá bán sỉ"... cùng với mức giá).
- **Kết quả:** Trả về lỗi `400 Bad Request` nếu dữ liệu đầu vào không hợp lệ.

### Bước 2: Chuẩn bị Transaction (Repository Layer)

- **Hành động:** Inject database instance hoặc sử dụng `db.transaction()` từ Drizzle.
- **Nghiệp vụ:** Vì việc lưu sản phẩm sẽ tác động lên nhiều bảng (`products`, `product_variants`, `prices`, `product_variant_images`), hệ thống bắt buộc sử dụng **Transaction** để đảm bảo tính toàn vẹn. Nếu xảy ra lỗi ở bất kỳ khâu nào, toàn bộ quá trình sẽ được `rollback` tự động.

### Bước 3: Insert Dữ liệu (Repository Layer)

1. **Insert Product:**
   - Đẩy thông tin `name`, `description`, `vendorId`, `categoryId` vào bảng `products`.
   - Lấy rả `productId` cấu thành từ bước này.
2. **Insert Variants (Biến thể):**
   - Lặp qua mảng `variants` trong payload.
   - Thêm bản ghi mới vào bảng `product_variants` với `productId`, `name` và `stock`.
   - Lấy ra `variantId` của từng bản ghi vừa được chèn.
3. **Insert Prices (Giá):**
   - Với mỗi `variantId`, vòng lặp qua mảng `prices` của variant đó, lưu lần lượt các loại giá (VD: Giá nhập, Giá bán lẻ) vào bảng `prices` bằng cách sử dụng `variantId`, `name` (tên loại giá) và `price`.
4. **Insert Images (Hình ảnh):**
   - Nếu variant có chứa danh sách `images`, duyệt qua mảng hình ảnh và insert song song vào bảng `product_variant_images` kèm theo `variantId`.

### Bước 4: Trả về kết quả (Service -> Route Layer)

- **Hành động:** Định dạng kết quả qua interface `Response<T>`.
- **Nghiệp vụ:** Service layer trả dữ liệu thống nhất (vd: `{ success: true, data: { ... }, status: 201 }`).
- **Kết quả cuối:** Route layer (`POST /api/products`) phát tín hiệu HTTP Response `201 Created` đến client.

## 3. Một số ngoại lệ và Lỗi (Error Handling)

- **Lỗi 400 Bad Request:** Payload thiếu các trường (e.g. quên ID của vendor hoặc category).
- **Lỗi 404/400 (Phụ thuộc thiết kế cơ sở dữ liệu):** UUID của `vendorId` hoặc `categoryId` không hợp lệ (Foreign Key Violation). Drizzle sẽ quăng lỗi từ Postgres.
- **Lỗi 500 Internal Server Error:** Các vấn đề rớt mạng tới DB hoặc sai cú pháp SQL. Transaction sẽ rollback an toàn.
