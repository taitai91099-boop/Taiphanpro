const express = require('express');
const bodyParser = require('body-parser');
const path = require('path'); // Rất quan trọng để Render tìm thấy file

const app = express();

// Sử dụng Port được Render cung cấp, nếu không có thì dùng 3000 (Local)
const PORT = process.env.PORT || 3000; 

app.use(bodyParser.json());

// Phục vụ các file Frontend tĩnh (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, ''))); 

// Đảm bảo Server trả về file index.html khi truy cập đường dẫn gốc '/'
app.get('/', (req, res) => {
    // Đảm bảo file HTML của bạn có tên là index.html
    res.sendFile(path.join(__dirname, 'index.html')); 
});

// MÔ PHỎNG DATABASE cho Rate Limit
const requestHistory = {}; 
const COOLDOWN_SECONDS = 30 * 60; // 30 phút

// API Endpoint xử lý yêu cầu gửi công cụ
app.post('/api/submit-tool', async (req, res) => {
    const { url, toolType } = req.body;
    // Sử dụng req.ip để lấy địa chỉ IP của người dùng (từ Render)
    const userIdentifier = req.ip; 
    const currentTime = Date.now();
    
    // 1. KIỂM TRA RATE LIMITING
    const lastRequestTime = requestHistory[userIdentifier] || 0;
    const timeSinceLastRequest = currentTime - lastRequestTime;
    const remainingCooldown = COOLDOWN_SECONDS * 1000 - timeSinceLastRequest;

    if (remainingCooldown > 0) {
        const remainingSeconds = Math.ceil(remainingCooldown / 1000);
        return res.status(429).json({ 
            error: `Vui lòng chờ ${Math.ceil(remainingSeconds / 60)} phút ${remainingSeconds % 60} giây để sử dụng lại.`,
            cooldown: remainingSeconds
        });
    }

    // 2. KHU VỰC CẦN PHÁT TRIỂN: Mã TỰ ĐỘNG HÓA TƯƠNG TÁC SẼ Ở ĐÂY

    // 3. LƯU LỊCH SỬ VÀ KÍCH HOẠT COOLDOWN
    requestHistory[userIdentifier] = currentTime;

    // Trả lời thành công
    res.status(200).json({ 
        message: 'Yêu cầu đã được tiếp nhận và đang xử lý!',
        cooldown: COOLDOWN_SECONDS
    });
});

// Bắt đầu Server
app.listen(PORT, () => {
    console.log(`Server TaiPhan đang chạy tại Port: ${PORT}`);
});
